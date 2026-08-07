import nodemailer from "nodemailer";
import { SUPABASE_URL, supabaseHeaders, supabaseConfigured } from "../../../../lib/supabase";
import { plans } from "../../../../data/plans";
import { findInstruction, cycleForDate } from "../../../../lib/planGuide";
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

function buildProgressText(name, amount, cycle, instruction) {
  return `Hi ${name},

Here is your USDX-SMART compounding progress update for Cycle ${cycle}.

Staked amount: $${amount}
Current instruction (${instruction.label}): ${instruction.title}
${instruction.detail}

Open the full plan guide on the site to review your roadmap and stay on track.

Have a productive day!

Best Regards,
USDX-SMART Team
Youth Wing`;
}

function buildProgressHtml(name, amount, cycle, instruction) {
  const safeName = escapeHtml(name);
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
                <p style="margin:0 0 26px;font-size:12px;letter-spacing:.14em;color:#57f4ff;font-family:'Courier New',monospace;">USDX / COMPOUNDING PROGRESS</p>
                <h1 style="margin:0 0 8px;font-size:24px;line-height:1.25;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">Hi ${safeName},</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#d7dbe8;">Here is your <strong style="color:#ffffff;">USDX-SMART</strong> compounding progress update for <strong style="color:#57f4ff;">Cycle ${cycle}</strong>.</p>
                <h2 style="margin:26px 0 10px;font-size:13px;letter-spacing:.16em;color:#57f4ff;">YOUR STAKED AMOUNT</h2>
                ${paragraph(`<strong style="color:#ffffff;">$${amount}</strong>`)}
                <h2 style="margin:26px 0 10px;font-size:13px;letter-spacing:.16em;color:#57f4ff;">CURRENT INSTRUCTION &middot; ${instruction.label}</h2>
                ${paragraph(`<strong style="color:#ffffff;">${instruction.title}</strong><br/>${instruction.detail}`)}
                ${paragraph("Open the full plan guide on the site to review your roadmap and stay on track.")}
                <p style="margin:26px 0 0;font-size:15px;line-height:1.75;color:#d7dbe8;">Have a productive day!</p>
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
    const select = encodeURIComponent('email,name,stake_amount,"date of stake"');
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/usdxcompounding?notification=eq.1&select=${select}`,
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

  const origin = new URL(request.url).origin;
  const dueUsers = [];
  for (const row of rows || []) {
    const stakeAmount = row["stake_amount"];
    const dateOfStake = row["date of stake"];
    if (!stakeAmount || !dateOfStake) continue;

    const { cycle, daysSinceStake } = cycleForDate(dateOfStake);
    if (daysSinceStake <= 0 || daysSinceStake % 30 !== 0) continue;

    const plan = plans[String(stakeAmount)];
    if (!plan) continue;
    if (cycle > plan.horizon) continue;

    const instruction = findInstruction(plan, cycle);
    if (!instruction) continue;

    dueUsers.push({ row, cycle, plan, instruction, planKey: String(stakeAmount) });
  }

  const result = { due: dueUsers.length, sent: 0, failed: [] };
  for (const { row, cycle, instruction, planKey } of dueUsers) {
    const amount = row["stake_amount"];
    const name = row["name"] || "there";
    try {
      await transporter.sendMail({
        from: `"USDX-SMART Team" <${user}>`,
        to: row.email,
        replyTo: user,
        subject: `Your USDX Progress Update - Cycle ${cycle}`,
        text: buildProgressText(name, amount, cycle, instruction),
        html: buildProgressHtml(name, amount, cycle, instruction),
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

  return Response.json(result);
}
