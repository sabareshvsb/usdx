import { SUPABASE_URL, supabaseHeaders, supabaseConfigured } from "../../../lib/supabase";
import { parseJsonBody, sanitizeEmail } from "../../../lib/validation";

function sanitizeSubscription(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (typeof value.endpoint !== "string" || !/^https:\/\//.test(value.endpoint)) return null;
  const keys = value.keys;
  if (!keys || typeof keys !== "object" || Array.isArray(keys)) return null;
  if (typeof keys.p256dh !== "string" || !keys.p256dh) return null;
  if (typeof keys.auth !== "string" || !keys.auth) return null;
  return {
    endpoint: value.endpoint,
    expirationTime: typeof value.expirationTime === "number" ? value.expirationTime : null,
    keys: { p256dh: keys.p256dh, auth: keys.auth },
  };
}

export async function GET(request) {
  const email = sanitizeEmail(new URL(request.url).searchParams.get("email"));
  if (!email) {
    return Response.json({ error: "Please provide a valid email address." }, { status: 400 });
  }
  if (!supabaseConfigured()) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  try {
    const select = encodeURIComponent("push_subscription");
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/usdxcompounding?email=eq.${encodeURIComponent(email)}&select=${select}`,
      { headers: supabaseHeaders(), cache: "no-store" }
    );
    if (!response.ok) {
      const bodyText = await response.text();
      return Response.json({ error: `Failed to fetch notification setting: ${bodyText}` }, { status: 500 });
    }
    const rows = await response.json();
    const subscription = rows && rows[0] && rows[0].push_subscription;
    return Response.json({ enabled: Boolean(subscription && subscription.endpoint) });
  } catch (err) {
    return Response.json({ error: `Failed to fetch notification setting: ${err.message}` }, { status: 500 });
  }
}

export async function POST(request) {
  const parsed = await parseJsonBody(request);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: parsed.status });

  const email = sanitizeEmail(parsed.data.email);
  if (!email) {
    return Response.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  const subscription = sanitizeSubscription(parsed.data.subscription);
  if (!subscription) {
    return Response.json({ error: "Please provide a valid push subscription." }, { status: 400 });
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
        body: JSON.stringify({ push_subscription: subscription }),
      }
    );
    if (!response.ok) {
      const bodyText = await response.text();
      return Response.json({ error: `Failed to save notification subscription: ${bodyText}` }, { status: 500 });
    }
  } catch (err) {
    return Response.json({ error: `Failed to save notification subscription: ${err.message}` }, { status: 500 });
  }

  return Response.json({ success: true, enabled: true });
}

export async function DELETE(request) {
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
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/usdxcompounding?email=eq.${encodeURIComponent(email)}&columns=push_subscription`,
      {
        method: "PATCH",
        headers: supabaseHeaders(),
        body: JSON.stringify({ push_subscription: null }),
      }
    );
    if (!response.ok) {
      const bodyText = await response.text();
      return Response.json({ error: `Failed to remove notification subscription: ${bodyText}` }, { status: 500 });
    }
  } catch (err) {
    return Response.json({ error: `Failed to remove notification subscription: ${err.message}` }, { status: 500 });
  }

  return Response.json({ success: true, enabled: false });
}
