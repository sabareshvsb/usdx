import { SUPABASE_URL, supabaseHeaders, supabaseConfigured } from "../../../lib/supabase";
import { parseJsonBody, sanitizeEmail, sanitizeWallet } from "../../../lib/validation";

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

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/usdxcompounding?email=eq.${encodeURIComponent(email)}`,
      {
        method: "PATCH",
        headers: supabaseHeaders(),
        body: JSON.stringify({ wallet_address2: walletAddress }),
      }
    );
    if (!response.ok) {
      const bodyText = await response.text();
      return Response.json({ error: `Failed to save wallet address: ${bodyText}` }, { status: 500 });
    }
  } catch (err) {
    return Response.json({ error: `Failed to save wallet address: ${err.message}` }, { status: 500 });
  }

  return Response.json({ success: true, walletAddress2: walletAddress });
}
