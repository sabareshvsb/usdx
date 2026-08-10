import { SUPABASE_URL, supabaseHeaders, supabaseConfigured } from "../../../lib/supabase";
import { parseJsonBody, sanitizeEmail, sanitizeWallet } from "../../../lib/validation";
import { DEFAULT_DAI_CONTRACT, DEFAULT_STAKE_CONTRACT, findStakeWithTimestamp } from "../../../lib/stakeLookup";

export const maxDuration = 60;

export async function POST(request) {
  const parsed = await parseJsonBody(request);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: parsed.status });

  const email = sanitizeEmail(parsed.data.email);
  const walletAddress = sanitizeWallet(parsed.data.walletAddress);

  if (!email) {
    return Response.json({ error: "Please provide a valid email address." }, { status: 400 });
  }
  if (!walletAddress) {
    return Response.json({ error: "Please provide a valid wallet address (0x + 40 hex characters)." }, { status: 400 });
  }

  if (!supabaseConfigured()) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const daiContract = process.env.DAI_CONTRACT_ADDRESS || DEFAULT_DAI_CONTRACT;
  const stakeContract = process.env.STAKE_CONTRACT_ADDRESS || DEFAULT_STAKE_CONTRACT;

  let stake = null;
  let lookupError = null;
  try {
    stake = await findStakeWithTimestamp(walletAddress, daiContract, stakeContract);
  } catch (err) {
    lookupError = err.message;
  }

  const updates = { wallet_address2: walletAddress };
  if (stake) {
    updates.stake_date2 = stake.stakeDate;
    if (stake.plan) updates.stake_amount2 = Number(stake.plan);
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/usdxcompounding?email=eq.${encodeURIComponent(email)}`,
      {
        method: "PATCH",
        headers: supabaseHeaders(),
        body: JSON.stringify(updates),
      }
    );
    if (!response.ok) {
      const bodyText = await response.text();
      return Response.json({ error: `Failed to save wallet address: ${bodyText}` }, { status: 500 });
    }
  } catch (err) {
    return Response.json({ error: `Failed to save wallet address: ${err.message}` }, { status: 500 });
  }

  return Response.json({
    success: true,
    walletAddress2: walletAddress,
    stakeDate2: stake ? stake.stakeDate : null,
    stakeAmount2: stake && stake.plan ? Number(stake.plan) : null,
    value: stake ? stake.tx.value : null,
    txHash: stake ? stake.tx.txHash : null,
    timestamp: stake ? stake.timestamp : null,
    stakeFound: Boolean(stake),
    lookupError,
  });
}
