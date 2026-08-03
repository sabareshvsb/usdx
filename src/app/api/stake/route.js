import { SUPABASE_URL, supabaseHeaders, supabaseConfigured } from "../../../lib/supabase";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!email || !EMAIL_REGEX.test(email)) {
    return Response.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  if (!supabaseConfigured()) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const updates = {};

  const dateOfStake = typeof body.dateOfStake === "string" ? body.dateOfStake.trim() : "";
  if (dateOfStake) {
    updates["date of stake"] = dateOfStake;
  }

  const stakeAmount = Number(body.stakeAmount);
  if (body.stakeAmount !== undefined && [500, 1000, 5000].includes(stakeAmount)) {
    updates.stake_amount = stakeAmount;
  }

  if (body.notification === 1 || body.notification === "1" || body.notification === true) {
    updates.notification = 1;
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
