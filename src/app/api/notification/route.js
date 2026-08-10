import nodemailer from "nodemailer";
import { SUPABASE_URL, supabaseHeaders, supabaseConfigured } from "../../../lib/supabase";
import { parseJsonBody, sanitizeEmail, sanitizeBoolean } from "../../../lib/validation";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

function buildEnabledText() {
  return `Dear User,

We are pleased to inform you that monthly notifications for your USDX Compounding Scheme have been successfully enabled.

Starting from next month, you will receive a monthly notification with updates related to your compounding activity.

If you have any questions or wish to report any technical issues, please feel free to contact us:

Email: usdxcompounding@gmail.com
Phone: +91 9003788941

Thank you for being a part of the USDX community.

Regards,
USDX Compounding Team`;
}

function buildEnabledHtml() {
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
                <p style="margin:0 0 26px;font-size:12px;letter-spacing:.14em;color:#57f4ff;font-family:'Courier New',monospace;">USDX / MONTHLY NOTIFICATION</p>
                <h1 style="margin:0 0 24px;font-size:22px;line-height:1.3;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">Monthly Notification Enabled</h1>
                ${paragraph("Dear User,")}
                ${paragraph("We are pleased to inform you that monthly notifications for your <strong style='color:#ffffff;'>USDX Compounding Scheme</strong> have been successfully <strong style='color:#57f4ff;'>enabled</strong>.")}
                ${paragraph("Starting from next month, you will receive a monthly notification with updates related to your compounding activity.")}
                <h2 style="margin:26px 0 10px;font-size:13px;letter-spacing:.16em;color:#57f4ff;">CONTACT US</h2>
                ${paragraph("If you have any questions or wish to report any technical issues, please feel free to contact us:<br/>Email: <a href='mailto:usdxcompounding@gmail.com' style='color:#57f4ff;'>usdxcompounding@gmail.com</a><br/>Phone: <a href='tel:+919003788941' style='color:#57f4ff;'>+91 9003788941</a>")}
                ${paragraph("Thank you for being a part of the USDX community.")}
                <p style="margin:26px 0 0;font-size:15px;line-height:1.75;color:#d7dbe8;">Regards,<br/><strong style="color:#ffffff;">USDX Compounding Team</strong></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function POST(request) {
  const parsed = await parseJsonBody(request);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: parsed.status });

  const email = sanitizeEmail(parsed.data.email);
  const enabled = sanitizeBoolean(parsed.data.enabled);

  if (!email) {
    return Response.json({ error: "Please provide a valid email address." }, { status: 400 });
  }
  if (enabled === null) {
    return Response.json({ error: "Please provide a valid enabled value (true or false)." }, { status: 400 });
  }

  if (!supabaseConfigured()) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  if (!user || !pass) {
    return Response.json({ error: "Gmail credentials are not configured." }, { status: 500 });
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/usdxcompounding?email=eq.${encodeURIComponent(email)}`,
      {
        method: "PATCH",
        headers: supabaseHeaders(),
        body: JSON.stringify({ notification: enabled }),
      }
    );

    if (!response.ok) {
      const bodyText = await response.text();
      return Response.json({ error: `Failed to update notification setting: ${bodyText}` }, { status: 500 });
    }
  } catch (err) {
    return Response.json({ error: `Failed to update notification setting: ${err.message}` }, { status: 500 });
  }

  if (enabled) {
    try {
      await transporter.sendMail({
        from: `"USDX-SMART Team" <${user}>`,
        to: email,
        replyTo: user,
        subject: "Monthly Notification Enabled – USDX Compounding Scheme",
        text: buildEnabledText(),
        html: buildEnabledHtml(),
        headers: {
          "X-Priority": "3",
          "List-Unsubscribe": `<mailto:${user}?subject=unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
    } catch (err) {
      return Response.json({ error: `Notification enabled, but the confirmation email could not be sent: ${err.message}` }, { status: 500 });
    }
  }

  return Response.json({ success: true, enabled });
}
