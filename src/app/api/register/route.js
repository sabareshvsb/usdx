import nodemailer from "nodemailer";
import { SUPABASE_URL, supabaseHeaders, supabaseConfigured, isDuplicateKeyError } from "../../../lib/supabase";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildWelcomeText(name) {
  return `Dear ${name},

Welcome to the USDX-SMART Compounding Scheme!

Thank you for registering with us. We sincerely appreciate your trust and are excited to have you as a part of the USDX-SMART community.

Your registration has been successfully received, and you are now one step closer to exploring the opportunities offered through the USDX-SMART Compounding Scheme.

Credits

This registration has been successfully credited to the Youth Wing.

Our team is committed to supporting you throughout your journey. If you have any questions or need assistance, please feel free to contact us.

Thank you once again for choosing USDX-SMART.

Best Regards,
USDX-SMART Team
Youth Wing`;
}

function buildWelcomeHtml(name) {
  const paragraph = (text) => `<p style="margin:0 0 18px;font-size:15px;line-height:1.75;color:#d7dbe8;">${text}</p>`;
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#070812;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070812;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:linear-gradient(135deg,rgba(255,255,255,.095),rgba(255,255,255,.025));border:1px solid rgba(212,225,255,.16);border-radius:16px;padding:40px;font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td>
                <p style="margin:0 0 26px;font-size:12px;letter-spacing:.14em;color:#57f4ff;font-family:'Courier New',monospace;">USDX / COMPOUNDING INTELLIGENCE</p>
                <h1 style="margin:0 0 8px;font-size:24px;line-height:1.25;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">Dear ${name},</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#d7dbe8;">Welcome to the <strong style="color:#ffffff;">USDX-SMART Compounding Scheme</strong>!</p>
                ${paragraph("Thank you for registering with us. We sincerely appreciate your trust and are excited to have you as a part of the USDX-SMART community.")}
                ${paragraph("Your registration has been successfully received, and you are now one step closer to exploring the opportunities offered through the USDX-SMART Compounding Scheme.")}
                <h2 style="margin:26px 0 10px;font-size:13px;letter-spacing:.16em;color:#57f4ff;">CREDITS</h2>
                ${paragraph("This registration has been successfully credited to the <strong style='color:#ffffff;'>Youth Wing</strong>.")}
                ${paragraph("Our team is committed to supporting you throughout your journey. If you have any questions or need assistance, please feel free to contact us.")}
                ${paragraph("Thank you once again for choosing USDX-SMART.")}
                <p style="margin:26px 0 0;font-size:15px;line-height:1.75;color:#d7dbe8;">Best Regards,<br/><strong style="color:#ffffff;">USDX-SMART Team</strong><br/>Youth Wing</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!name) {
    return Response.json({ error: "Please provide your name." }, { status: 400 });
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return Response.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;

  if (!user || !pass) {
    return Response.json({ error: "Gmail credentials are not configured." }, { status: 500 });
  }

  if (supabaseConfigured()) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const response = await fetch(`${SUPABASE_URL}/rest/v1/usdxcompounding`, {
        method: "POST",
        headers: supabaseHeaders(),
        body: JSON.stringify({ email, name, "date of stake": today }),
      });

      if (!response.ok) {
        const bodyText = await response.text();
        if (isDuplicateKeyError(bodyText)) {
          return Response.json({ error: "You are already registered. Please Log in.", alreadyRegistered: true }, { status: 409 });
        }
        return Response.json({ error: `Failed to save registration: ${bodyText}` }, { status: 500 });
      }
    } catch (err) {
      return Response.json({ error: `Failed to save registration: ${err.message}` }, { status: 500 });
    }
  }

  try {
    await transporter.sendMail({
      from: `"USDX-SMART Team" <${user}>`,
      to: email,
      replyTo: user,
      subject: "Welcome to the USDX-SMART Compounding Scheme",
      text: buildWelcomeText(name),
      html: buildWelcomeHtml(name),
      headers: {
        "X-Priority": "3",
        "List-Unsubscribe": `<mailto:${user}?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message || "Failed to send welcome email." }, { status: 500 });
  }
}
