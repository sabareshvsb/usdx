import { SUPABASE_URL, supabaseHeaders, supabaseConfigured } from "../../../lib/supabase";
import { parseJsonBody, sanitizeEmail, sanitizeWallet } from "../../../lib/validation";

export const maxDuration = 60;

const DEFAULT_USDX_CONTRACT = "0xf38671eA6290b43F30f2b685e86CDD125B86e13a";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const PLAN_VALUES = { 500: "500", 1000: "1000", 5000: "5000" };

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const ALCHEMY_URL = ALCHEMY_API_KEY
  ? `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  : "";
const PRIMARY_RPC = process.env.BASE_RPC_URL || "https://base.gateway.tenderly.co";
const FALLBACK_RPC = process.env.BASE_RPC_URL_FALLBACK || "https://mainnet.base.org";

const deploymentBlockCache = new Map();

function detectPlan(value) {
  const doubled = value * 2;
  for (const [amount, key] of Object.entries(PLAN_VALUES)) {
    if (Math.abs(doubled - Number(amount)) < 0.5) return key;
  }
  return null;
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
  return sorted.find((t) => detectPlan(t.value)) || sorted[0] || null;
}

async function lookupAlchemy(walletAddress, contract) {
  const base = {
    fromBlock: "0x0",
    toBlock: "latest",
    contractAddresses: [contract],
    category: ["erc20"],
    order: "asc",
    maxCount: "0x3e8",
  };
  const toRes = await rpcCall(ALCHEMY_URL, "alchemy_getAssetTransfers", [{ ...base, toAddress: walletAddress }]);
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

async function lookupFullRange(walletAddress, contract) {
  const pad = padWallet(walletAddress);
  const base = { address: contract, fromBlock: "0x0", toBlock: "latest" };
  const toLogs = await rpcCall(PRIMARY_RPC, "eth_getLogs", [{ ...base, topics: [TRANSFER_TOPIC, null, pad] }]);
  return selectStake(parseLogs(toLogs));
}

async function lookupWindowScan(walletAddress, contract) {
  const deploy = await findDeploymentBlock(contract, FALLBACK_RPC);
  const latestHex = await rpcCall(FALLBACK_RPC, "eth_blockNumber", [], 10000);
  const latest = parseInt(latestHex, 16);
  const pad = padWallet(walletAddress);
  const deadline = Date.now() + 45000;
  for (let s = deploy; s <= latest; s += 10000) {
    if (Date.now() > deadline) throw new Error("Lookup timed out. Please try again.");
    const e = Math.min(s + 9999, latest);
    const range = { address: contract, fromBlock: "0x" + s.toString(16), toBlock: "0x" + e.toString(16) };
    const toLogs = await rpcCall(FALLBACK_RPC, "eth_getLogs", [{ ...range, topics: [TRANSFER_TOPIC, null, pad] }], 15000);
    const found = selectStake(parseLogs(toLogs));
    if (found) return found;
  }
  return null;
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

export async function POST(request) {
  const parsed = await parseJsonBody(request);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: parsed.status });

  const email = sanitizeEmail(parsed.data.email);
  const walletAddress = parsed.data.walletAddress ? sanitizeWallet(parsed.data.walletAddress) : null;

  if (!email) {
    return Response.json({ error: "Please provide a valid email address." }, { status: 400 });
  }
  if (parsed.data.walletAddress && !walletAddress) {
    return Response.json({ error: "Please provide a valid wallet address (0x + 40 hex characters)." }, { status: 400 });
  }

  if (!supabaseConfigured()) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  let user;
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/usdxcompounding?email=eq.${encodeURIComponent(email)}&select=${encodeURIComponent('email,name,"date of stake",stake_amount,wallet_address,wallet_address2')}`,
      { headers: supabaseHeaders() }
    );
    if (!response.ok) {
      const bodyText = await response.text();
      return Response.json({ error: `Failed to look up account: ${bodyText}` }, { status: 500 });
    }
    const rows = await response.json();
    user = rows && rows[0];
  } catch (err) {
    return Response.json({ error: `Failed to look up account: ${err.message}` }, { status: 500 });
  }

  if (!user) {
    return Response.json({ error: "No account found with this email. Please register first." }, { status: 404 });
  }

  const storedWallet = user.wallet_address || null;
  const storedDate = user["date of stake"] || null;
  const storedPlan = user.stake_amount != null ? String(user.stake_amount) : null;

  if (!walletAddress) {
    if (storedWallet && storedDate) {
      return Response.json({
        success: true,
        fromStorage: true,
        stakeDate: storedDate,
        timestamp: Math.floor(Date.parse(`${storedDate}T00:00:00Z`) / 1000),
        value: storedPlan ? Number(storedPlan) / 2 : 0,
        plan: storedPlan,
        txHash: null,
        walletAddress: storedWallet,
        walletAddress2: user.wallet_address2 || null,
      });
    }
    return Response.json({ success: false, needsWallet: true });
  }

  const contract = process.env.USDX_CONTRACT_ADDRESS || DEFAULT_USDX_CONTRACT;

  let stakeTx;
  if (ALCHEMY_URL) {
    try {
      stakeTx = await lookupAlchemy(walletAddress, contract);
    } catch (err) {
      try {
        stakeTx = await lookupFullRange(walletAddress, contract);
      } catch {
        try {
          stakeTx = await lookupWindowScan(walletAddress, contract);
        } catch (fallbackErr) {
          return Response.json({ error: `Could not read the Base blockchain: ${fallbackErr.message}` }, { status: 502 });
        }
      }
    }
  } else {
    try {
      stakeTx = await lookupFullRange(walletAddress, contract);
    } catch {
      try {
        stakeTx = await lookupWindowScan(walletAddress, contract);
      } catch (err) {
        return Response.json({ error: `Could not read the Base blockchain: ${err.message}` }, { status: 502 });
      }
    }
  }

  if (!stakeTx) {
    return Response.json(
      { error: "No USDX stake transactions found for this wallet address." },
      { status: 404 }
    );
  }

  let timestamp = stakeTx.timestamp;
  if (!timestamp) {
    try {
      timestamp = await getBlockTimestamp(stakeTx.block);
    } catch (err) {
      return Response.json({ error: `Could not read the stake date: ${err.message}` }, { status: 502 });
    }
  }

  const stakeDate = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const plan = detectPlan(stakeTx.value) || null;

  const updates = { "date of stake": stakeDate, wallet_address: walletAddress };
  if (plan) updates.stake_amount = Number(plan);

  try {
    let response = await fetch(
      `${SUPABASE_URL}/rest/v1/usdxcompounding?email=eq.${encodeURIComponent(email)}`,
      {
        method: "PATCH",
        headers: supabaseHeaders(),
        body: JSON.stringify(updates),
      }
    );
    if (!response.ok && updates.wallet_address) {
      const fallback = { ...updates };
      delete fallback.wallet_address;
      response = await fetch(
        `${SUPABASE_URL}/rest/v1/usdxcompounding?email=eq.${encodeURIComponent(email)}`,
        {
          method: "PATCH",
          headers: supabaseHeaders(),
          body: JSON.stringify(fallback),
        }
      );
    }
    if (!response.ok) {
      const bodyText = await response.text();
      return Response.json({ error: `Failed to save stake details: ${bodyText}` }, { status: 500 });
    }
  } catch {
    // saving must never block returning the stake date to the user
  }

  return Response.json({ success: true, stakeDate, timestamp, value: stakeTx.value, plan, txHash: stakeTx.txHash, walletAddress, walletAddress2: user.wallet_address2 || null });
}
