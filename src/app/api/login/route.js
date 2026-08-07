import { SUPABASE_URL, supabaseHeaders, supabaseConfigured } from "../../../lib/supabase";
import { parseJsonBody, sanitizeEmail } from "../../../lib/validation";

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

  try {
    const select = encodeURIComponent('email,name');
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/usdxcompounding?email=eq.${encodeURIComponent(email)}&select=${select}`,
      {
        method: "GET",
        headers: supabaseHeaders(),
      }
    );

    if (!response.ok) {
      const bodyText = await response.text();
      return Response.json({ error: `Failed to look up account: ${bodyText}` }, { status: 500 });
    }

    const rows = await response.json();
    if (!rows || rows.length === 0) {
      return Response.json({ error: "No account found with this email. Please register first.", exists: false }, { status: 404 });
    }

    return Response.json({ exists: true, name: rows[0].name || "" });
  } catch (err) {
    return Response.json({ error: `Failed to look up account: ${err.message}` }, { status: 500 });
  }
}
