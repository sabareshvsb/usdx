import { SUPABASE_URL, supabaseHeaders, supabaseConfigured } from "../../../lib/supabase";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;
const DEFAULT_USDX_CONTRACT = "0xf38671eA6290b43F30f2b685e86CDD125B86e13a";
const BASESCAN_API_URL = "https://api.basescan.org/api";
const PLAN_VALUES = { 500: "500", 1000: "1000", 5000: "5000" };

function detectPlan(value) {
  for (const [amount, key] of Object.entries(PLAN_VALUES)) {
    if (Math.abs(value - Number(amount)) < 0.5) return key;
  }
  return null;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const walletAddress = typeof body.walletAddress === "string" ? body.walletAddress.trim() : "";

  if (!email || !EMAIL_REGEX.test(email)) {
    return Response.json({ error: "Please provide a valid email address." }, { status: 400 });
  }
  if (!walletAddress) {
    return Response.json({ error: "Please provide your wallet address." }, { status: 400 });
  }
  if (!WALLET_REGEX.test(walletAddress)) {
    return Response.json({ error: "Please provide a valid wallet address (0x + 40 hex characters)." }, { status: 400 });
  }

  if (!supabaseConfigured()) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  let user;
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/usdxcompounding?email=eq.${encodeURIComponent(email)}&select=${encodeURIComponent('email,name,"date of stake",stake_amount')}`,
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

  const apiKey = process.env.BASESCAN_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "BaseScan API key is not configured." }, { status: 500 });
  }

  const contract = process.env.USDX_CONTRACT_ADDRESS || DEFAULT_USDX_CONTRACT;

  let transfers = [];
  try {
    const url = `${BASESCAN_API_URL}?module=account&action=tokentx&contractaddress=${contract}&address=${walletAddress}&sort=asc&page=1&offset=100&apikey=${apiKey}`;
    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json();
    if (data.status === "1" && Array.isArray(data.result)) {
      transfers = data.result;
    } else if (!Array.isArray(data.result) && data.message && !/no transactions/i.test(String(data.message))) {
      return Response.json({ error: `BaseScan: ${data.result || data.message}` }, { status: 502 });
    }
  } catch (err) {
    return Response.json({ error: `Could not reach BaseScan: ${err.message}` }, { status: 502 });
  }

  if (!transfers.length) {
    return Response.json(
      { error: "No USDX stake transactions found for this wallet address on BaseScan." },
      { status: 404 }
    );
  }

  const stakeTx = transfers.reduce((earliest, tx) => {
    if (!earliest) return tx;
    return Number(tx.timeStamp) < Number(earliest.timeStamp) ? tx : earliest;
  }, null);

  const timestamp = Number(stakeTx.timeStamp);
  const stakeDate = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const value = Number(stakeTx.value) / 1e18;
  const plan = detectPlan(value) || null;

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

  return Response.json({ success: true, stakeDate, timestamp, value, plan, txHash: stakeTx.hash });
}
