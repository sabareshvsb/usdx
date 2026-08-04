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

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/usdxcompounding?email=eq.${encodeURIComponent(email)}`,
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

    return Response.json({ exists: true });
  } catch (err) {
    return Response.json({ error: `Failed to look up account: ${err.message}` }, { status: 500 });
  }
}
