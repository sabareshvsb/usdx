import nodemailer from "nodemailer";
import webpush from "web-push";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SUPABASE_URL, supabaseHeaders, supabaseConfigured } from "../../../../lib/supabase";
import { MONTHLY_EMAILS } from "../../../../data/monthlyEmails";
import { cycleForDate } from "../../../../lib/planGuide";
import { escapeHtml } from "../../../../lib/validation";

export const maxDuration = 60;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:usdxcompounding@gmail.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

function personalize(body, name) {
  return body.replace("Dear USDX-SMART Member,", `Dear ${name},`);
}

function instructionsAttachment(stakeAmount) {
  if (String(stakeAmount) !== "5000") return [];
  const pdfPath = join(process.cwd(), "public", "downloads", "USDX5000NEW_INSTRUCTIONS.pdf");
  return [{ filename: "USDX5000NEW_INSTRUCTIONS.pdf", content: readFileSync(pdfPath) }];
}

function buildProgressText(name, cycle, content) {
  return `Hi ${name},

Here is your monthly USDX-SMART compounding update for Cycle ${cycle}.

${personalize(content.body, name)}

Keep this email for your monthly records. The figures are based on the official plan chart and are not a guarantee of future returns.

Thank you for being part of the USDX-SMART community.

Regards,
USDX COMPOUNDING TEAM`;
}

function buildProgressHtml(name, cycle, content) {
  const safeName = escapeHtml(name);
  const bodyHtml = escapeHtml(personalize(content.body, name));
  const safeSubject = escapeHtml(content.subject);
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#070812;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070812;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:linear-gradient(135deg,rgba(255,255,255,.095),rgba(255,255,255,.025));border:1px solid rgba(212,225,255,.16);border-radius:16px;padding:40px;font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td>
                <p style="margin:0 0 26px;font-size:12px;letter-spacing:.14em;color:#57f4ff;font-family:'Courier New',monospace;">USDX / COMPOUNDING PROGRESS</p>
                <h1 style="margin:0 0 8px;font-size:24px;line-height:1.25;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">Hi ${safeName},</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#d7dbe8;">Here is your <strong style="color:#ffffff;">USDX-SMART</strong> compounding update for <strong style="color:#57f4ff;">Cycle ${cycle}</strong>.</p>
                <h2 style="margin:26px 0 10px;font-size:13px;letter-spacing:.16em;color:#57f4ff;">${safeSubject.toUpperCase()}</h2>
                <p style="margin:0;font-size:15px;line-height:1.75;color:#d7dbe8;white-space:pre-line;word-break:break-word;">${bodyHtml}</p>
                <p style="margin:26px 0 0;font-size:15px;line-height:1.75;color:#d7dbe8;">Thank you for being part of the USDX-SMART community.</p>
                <p style="margin:26px 0 0;font-size:15px;line-height:1.75;color:#d7dbe8;">Regards,<br/><strong style="color:#ffffff;">USDX COMPOUNDING TEAM</strong></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization") || "";
  const expected = process.env.CRON_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseConfigured()) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  if (!user || !pass) {
    return Response.json({ error: "Gmail credentials are not configured." }, { status: 500 });
  }

  let rows;
  try {
    const filter = encodeURIComponent("or=(notification.eq.1,push_subscription.not.is.null)");
    const select = encodeURIComponent('email,name,stake_amount,"date of stake",notification,push_subscription');
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/usdxcompounding?${filter}&select=${select}`,
      { headers: supabaseHeaders() }
    );
    if (!response.ok) {
      const bodyText = await response.text();
      return Response.json({ error: `Failed to fetch users: ${bodyText}` }, { status: 500 });
    }
    rows = await response.json();
  } catch (err) {
    return Response.json({ error: `Failed to fetch users: ${err.message}` }, { status: 500 });
  }

  const dueUsers = [];
  for (const row of rows || []) {
    const stakeAmount = row["stake_amount"];
    const dateOfStake = row["date of stake"];
    if (!stakeAmount || !dateOfStake) continue;

    const emailEnabled = row["notification"] === true || row["notification"] === 1;
    const pushEnabled = Boolean(row["push_subscription"] && row["push_subscription"].endpoint);
    if (!emailEnabled && !pushEnabled) continue;

    const { cycle, daysSinceStake } = cycleForDate(dateOfStake);
    if (daysSinceStake <= 0 || daysSinceStake % 30 !== 0) continue;

    const monthly = MONTHLY_EMAILS[String(stakeAmount)];
    if (!monthly) continue;
    if (cycle > monthly.length) continue;

    const content = monthly[cycle - 1];
    if (!content) continue;

    dueUsers.push({ row, cycle, content, emailEnabled, pushEnabled });
  }

  const result = { due: dueUsers.length, sent: 0, pushed: 0, failed: [] };
  for (const { row, cycle, content, emailEnabled, pushEnabled } of dueUsers) {
    const name = row["name"] || "there";
    if (emailEnabled) {
      try {
        await transporter.sendMail({
          from: `"USDX-SMART Team" <${user}>`,
          to: row.email,
          replyTo: user,
          subject: content.subject,
          text: buildProgressText(name, cycle, content),
          html: buildProgressHtml(name, cycle, content),
          attachments: instructionsAttachment(row["stake_amount"]),
          headers: {
            "X-Priority": "3",
            "List-Unsubscribe": `<mailto:${user}?subject=unsubscribe>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
        result.sent += 1;
      } catch (err) {
        result.failed.push({ email: row.email, error: err.message });
      }
    }
    if (pushEnabled && vapidPublicKey && vapidPrivateKey) {
      try {
        await webpush.sendNotification(
          row["push_subscription"],
          JSON.stringify({
            title: content.subject,
            body: `Your USDX-SMART compounding update for Cycle ${cycle} is ready.`,
            url: "/",
          })
        );
        result.pushed += 1;
      } catch (err) {
        if (err && (err.statusCode === 404 || err.statusCode === 410)) {
          try {
            await fetch(
              `${SUPABASE_URL}/rest/v1/usdxcompounding?email=eq.${encodeURIComponent(row.email)}&columns=push_subscription`,
              {
                method: "PATCH",
                headers: supabaseHeaders(),
                body: JSON.stringify({ push_subscription: null }),
              }
            );
          } catch {
            // ignore cleanup failures
          }
        } else {
          result.failed.push({ email: row.email, pushError: err.message });
        }
      }
    }
  }

  return Response.json(result);
}
