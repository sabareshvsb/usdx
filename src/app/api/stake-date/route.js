import { SUPABASE_URL, supabaseHeaders, supabaseConfigured } from "../../../lib/supabase";
import { parseJsonBody, sanitizeEmail, sanitizeWallet } from "../../../lib/validation";
import { DEFAULT_DAI_CONTRACT, DEFAULT_STAKE_CONTRACT, findStakeWithTimestamp, stakeAmountForPlan } from "../../../lib/stakeLookup";

export const maxDuration = 60;

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
    const select = encodeURIComponent('email,name,"date of stake",stake_amount,wallet_address,wallet_address2,"stake_date2","stake_amount2"');
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/usdxcompounding?email=eq.${encodeURIComponent(email)}&select=${select}`,
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
  const storedWallet2 = user.wallet_address2 || null;
  const storedDate2 = user["stake_date2"] || null;
  const storedPlan2 = user.stake_amount2 != null ? String(user.stake_amount2) : null;

  if (!walletAddress) {
    if (storedWallet && storedDate) {
      return Response.json({
        success: true,
        fromStorage: true,
        stakeDate: storedDate,
        timestamp: Math.floor(Date.parse(`${storedDate}T00:00:00Z`) / 1000),
        value: storedPlan ? stakeAmountForPlan(storedPlan) ?? Number(storedPlan) / 2 : 0,
        plan: storedPlan,
        txHash: null,
        walletAddress: storedWallet,
        walletAddress2: storedWallet2,
        stakeDate2: storedDate2,
        stakeAmount2: storedPlan2 ? Number(storedPlan2) : null,
        wallet2Timestamp: storedDate2 ? Math.floor(Date.parse(`${storedDate2}T00:00:00Z`) / 1000) : null,
      });
    }
    return Response.json({ success: false, needsWallet: true });
  }

  const daiContract = process.env.DAI_CONTRACT_ADDRESS || DEFAULT_DAI_CONTRACT;
  const stakeContract = process.env.STAKE_CONTRACT_ADDRESS || DEFAULT_STAKE_CONTRACT;

  let stake;
  try {
    stake = await findStakeWithTimestamp(walletAddress, daiContract, stakeContract);
  } catch (err) {
    return Response.json({ error: `Could not read the Base blockchain: ${err.message}` }, { status: 502 });
  }

  if (!stake) {
    return Response.json(
      { error: "No DAI stake transactions found for this wallet address." },
      { status: 404 }
    );
  }

  const plan = stake.plan;
  const stakeAmount = plan ? Number(plan) : Number(stake.tx.value);
  const updates = { "date of stake": stake.stakeDate, wallet_address: walletAddress, stake_amount: stakeAmount };

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

  return Response.json({
    success: true,
    stakeDate: stake.stakeDate,
    timestamp: stake.timestamp,
    value: stake.tx.value,
    plan,
    txHash: stake.tx.txHash,
    walletAddress,
    walletAddress2: storedWallet2,
    stakeDate2: storedDate2,
    stakeAmount2: storedPlan2 ? Number(storedPlan2) : null,
    wallet2Timestamp: storedDate2 ? Math.floor(Date.parse(`${storedDate2}T00:00:00Z`) / 1000) : null,
  });
}
