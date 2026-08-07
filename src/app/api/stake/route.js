import { SUPABASE_URL, supabaseHeaders, supabaseConfigured } from "../../../lib/supabase";
import { parseJsonBody, sanitizeEmail, sanitizeDate, sanitizeBoolean, sanitizeStakeAmount } from "../../../lib/validation";

export async function POST(request) {
  const parsed = await parseJsonBody(request);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: parsed.status });

  const email = sanitizeEmail(parsed.data.email);

  if (!email) {
    return Response.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  if (!supabaseConfigured()) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const updates = {};

  const dateOfStake = sanitizeDate(parsed.data.dateOfStake);
  if (parsed.data.dateOfStake !== undefined) {
    if (!dateOfStake) {
      return Response.json({ error: "Please provide a valid stake date (YYYY-MM-DD)." }, { status: 400 });
    }
    updates["date of stake"] = dateOfStake;
  }

  const stakeAmount = sanitizeStakeAmount(parsed.data.stakeAmount);
  if (parsed.data.stakeAmount !== undefined) {
    if (stakeAmount === null) {
      return Response.json({ error: "Please provide a valid stake amount (500, 1000 or 5000)." }, { status: 400 });
    }
    updates.stake_amount = stakeAmount;
  }

  const notification = sanitizeBoolean(parsed.data.notification);
  if (parsed.data.notification !== undefined) {
    if (notification === null) {
      return Response.json({ error: "Please provide a valid notification value (true or false)." }, { status: 400 });
    }
    updates.notification = notification;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
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
      return Response.json({ error: `Failed to update stake details: ${bodyText}` }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: `Failed to update stake details: ${err.message}` }, { status: 500 });
  }
}
