export const DEFAULT_USDX_CONTRACT = "0xf38671eA6290b43F30f2b685e86CDD125B86e13a";
export const DEFAULT_DAI_CONTRACT = "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb";
export const DEFAULT_STAKE_CONTRACT = "0x079C3035E68aE1aE6A45303B16d67Fa727c2cC35";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const STAKE_PLAN_AMOUNTS = { 250: "500", 500: "1000", 1000: "5000" };
const PLAN_STAKE_AMOUNTS = { "500": 250, "1000": 500, "5000": 1000 };

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const ALCHEMY_URL = ALCHEMY_API_KEY
  ? `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  : "";
const PRIMARY_RPC = process.env.BASE_RPC_URL || "https://base.gateway.tenderly.co";
const FALLBACK_RPC = process.env.BASE_RPC_URL_FALLBACK || "https://mainnet.base.org";

const deploymentBlockCache = new Map();

export function detectStakePlan(value) {
  for (const [amount, key] of Object.entries(STAKE_PLAN_AMOUNTS)) {
    if (Math.abs(value - Number(amount)) < 0.5) return key;
  }
  return null;
}

export function stakeAmountForPlan(plan) {
  return PLAN_STAKE_AMOUNTS[String(plan)] ?? null;
}

function padWallet(wallet) {
  return `0x${"0".repeat(24)}${wallet.toLowerCase().slice(2)}`;
}

async function rpcCall(rpcUrl, method, params, timeoutMs = 30000) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`RPC returned HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) {
    const err = new Error(data.error.message || "RPC error");
    err.code = data.error.code;
    throw err;
  }
  return data.result;
}

async function findDeploymentBlock(contract, rpcUrl) {
  if (deploymentBlockCache.has(contract)) return deploymentBlockCache.get(contract);
  const latestHex = await rpcCall(rpcUrl, "eth_blockNumber", [], 10000);
  let hi = parseInt(latestHex, 16);
  let lo = 0;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const code = await rpcCall(rpcUrl, "eth_getCode", [contract, "0x" + mid.toString(16)], 10000);
    if (code.length > 2) hi = mid;
    else lo = mid + 1;
  }
  deploymentBlockCache.set(contract, lo);
  return lo;
}

function parseLogs(logs) {
  const out = [];
  for (const log of logs || []) {
    const value = log.data && log.data !== "0x" ? Number(BigInt(log.data)) / 1e18 : 0;
    out.push({
      block: parseInt(log.blockNumber, 16),
      txHash: log.transactionHash,
      from: "0x" + (log.topics[1] || "0x").slice(26),
      to: "0x" + (log.topics[2] || "0x").slice(26),
      value,
    });
  }
  return out;
}

function selectStake(transfers) {
  const sorted = [...transfers].sort((a, b) => a.block - b.block);
  return sorted.find((t) => detectStakePlan(t.value)) || sorted[0] || null;
}

async function lookupAlchemy(walletAddress, daiContract, stakeContract) {
  const base = {
    fromBlock: "0x0",
    toBlock: "latest",
    contractAddresses: [daiContract],
    category: ["erc20"],
    order: "asc",
    maxCount: "0x3e8",
  };
  const toRes = await rpcCall(ALCHEMY_URL, "alchemy_getAssetTransfers", [
    { ...base, fromAddress: walletAddress, toAddress: stakeContract },
  ]);
  const transfers = (toRes.transfers || []).map((transfer) => ({
    block: parseInt(transfer.blockNum, 16),
    txHash: transfer.hash,
    value: typeof transfer.value === "number" ? transfer.value : 0,
    timestamp:
      transfer.metadata && transfer.metadata.blockTimestamp
        ? Date.parse(transfer.metadata.blockTimestamp) / 1000
        : null,
  }));
  return selectStake(transfers);
}

async function lookupFullRange(walletAddress, daiContract, stakeContract) {
  const padFrom = padWallet(walletAddress);
  const padTo = padWallet(stakeContract);
  const base = { address: daiContract, fromBlock: "0x0", toBlock: "latest" };
  const toLogs = await rpcCall(PRIMARY_RPC, "eth_getLogs", [{ ...base, topics: [TRANSFER_TOPIC, padFrom, padTo] }]);
  return selectStake(parseLogs(toLogs));
}

async function lookupWindowScan(walletAddress, daiContract, stakeContract) {
  const deploy = await findDeploymentBlock(daiContract, FALLBACK_RPC);
  const latestHex = await rpcCall(FALLBACK_RPC, "eth_blockNumber", [], 10000);
  const latest = parseInt(latestHex, 16);
  const padFrom = padWallet(walletAddress);
  const padTo = padWallet(stakeContract);
  const deadline = Date.now() + 45000;
  for (let s = deploy; s <= latest; s += 10000) {
    if (Date.now() > deadline) throw new Error("Lookup timed out. Please try again.");
    const e = Math.min(s + 9999, latest);
    const range = { address: daiContract, fromBlock: "0x" + s.toString(16), toBlock: "0x" + e.toString(16) };
    const toLogs = await rpcCall(FALLBACK_RPC, "eth_getLogs", [{ ...range, topics: [TRANSFER_TOPIC, padFrom, padTo] }], 15000);
    const found = selectStake(parseLogs(toLogs));
    if (found) return found;
  }
  return null;
}

export async function findStake(walletAddress, daiContract, stakeContract) {
  if (ALCHEMY_URL) {
    try {
      return await lookupAlchemy(walletAddress, daiContract, stakeContract);
    } catch {
      try {
        return await lookupFullRange(walletAddress, daiContract, stakeContract);
      } catch {
        try {
          return await lookupWindowScan(walletAddress, daiContract, stakeContract);
        } catch (fallbackErr) {
          throw new Error(`Could not read the Base blockchain: ${fallbackErr.message}`);
        }
      }
    }
  } else {
    try {
      return await lookupFullRange(walletAddress, daiContract, stakeContract);
    } catch {
      try {
        return await lookupWindowScan(walletAddress, daiContract, stakeContract);
      } catch (err) {
        throw new Error(`Could not read the Base blockchain: ${err.message}`);
      }
    }
  }
}

async function getBlockTimestamp(block) {
  const hex = "0x" + block.toString(16);
  try {
    const b = await rpcCall(PRIMARY_RPC, "eth_getBlockByNumber", [hex, false], 15000);
    return parseInt(b.timestamp, 16);
  } catch {
    const b = await rpcCall(FALLBACK_RPC, "eth_getBlockByNumber", [hex, false], 15000);
    return parseInt(b.timestamp, 16);
  }
}

export async function findStakeWithTimestamp(walletAddress, daiContract, stakeContract) {
  const tx = await findStake(walletAddress, daiContract, stakeContract);
  if (!tx) return null;
  let timestamp = tx.timestamp;
  if (!timestamp) timestamp = await getBlockTimestamp(tx.block);
  return {
    tx,
    timestamp,
    stakeDate: new Date(timestamp * 1000).toISOString().slice(0, 10),
    plan: detectStakePlan(tx.value) || null,
  };
}
