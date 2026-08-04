import Link from "next/link";
import { redirect } from "next/navigation";
import { SUPABASE_URL, supabaseHeaders, supabaseConfigured } from "../../lib/supabase";
import { plans } from "../../data/plans";

function parseMonthRange(label) {
  const normalized = label.replace(/[–—]/g, "-");
  const range = normalized.match(/(\d+)\s*-\s*(\d+)/);
  if (range) return [Number(range[1]), Number(range[2])];
  const single = normalized.match(/month\s+(\d+)/i);
  if (single) return [Number(single[1]), Number(single[1])];
  return null;
}

function findInstruction(plan, cycle) {
  const candidates = plan.steps
    .map(([label, title, detail]) => ({ label, title, detail, range: parseMonthRange(label) }))
    .filter((step) => step.range);
  if (!candidates.length) return null;
  const exact = candidates.find((step) => cycle >= step.range[0] && cycle <= step.range[1]);
  if (exact) return exact;
  const fallback = candidates
    .filter((step) => step.range[0] <= cycle)
    .sort((a, b) => b.range[0] - a.range[0])[0];
  return fallback || null;
}

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function UserPage({ searchParams }) {
  const { email } = await searchParams;

  if (!email || !supabaseConfigured()) {
    redirect("/");
  }

  let user;
  try {
    const select = encodeURIComponent('email,name,stake_amount,"date of stake"');
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/usdxcompounding?email=eq.${encodeURIComponent(email)}&select=${select}`,
      { headers: supabaseHeaders(), cache: "no-store" }
    );
    if (response.ok) {
      const rows = await response.json();
      user = rows && rows[0];
    }
  } catch {
    user = null;
  }

  if (!user) {
    redirect("/register");
  }

  const name = user.name || "there";
  const stakeAmount = user["stake_amount"];
  const dateOfStake = user["date of stake"] || "";

  const planKey = String(stakeAmount || "");
  const plan = plans[planKey];

  let cycle = 1;
  let instruction = null;
  if (dateOfStake) {
    const start = new Date(`${dateOfStake}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysSinceStake = Math.max(0, Math.round((today - start) / 86400000));
    cycle = Math.floor(daysSinceStake / 30) + 1;
  }
  if (plan) {
    cycle = Math.min(cycle, plan.horizon);
    instruction = findInstruction(plan, cycle);
  }

  return (
    <main className="user-shell">
      <nav className="guide-nav glass-panel">
        <Link href="/" className="guide-brand"><span>U</span> USDX <small>YOUTH WING</small></Link>
        <Link href="/" className="guide-back">← Back to landing</Link>
      </nav>

      <section className="user-hero glass-panel">
        <p className="eyebrow user-eyebrow"><span /> USDX / MEMBER DASHBOARD</p>
        <h1 className="user-greeting">👋 Welcome, <em>{name}</em></h1>
        <p className="user-message">We&apos;re delighted to have you with us.<br />Monitor your progress, stay consistent, and let smart compounding support your long-term financial goals.</p>
        <p className="user-closing">Have a productive day!</p>
      </section>

      <section className="user-stats">
        <div className="user-stat glass-panel"><small>STAKED AMOUNT</small><strong>{stakeAmount ? `$${stakeAmount}` : "—"}</strong></div>
        <div className="user-stat glass-panel"><small>DATE OF STAKE</small><strong>{formatDate(dateOfStake) || "—"}</strong></div>
        <div className="user-stat glass-panel"><small>CURRENT CYCLE</small><strong>{plan ? `CYCLE ${cycle}` : "—"}</strong></div>
      </section>

      {plan && instruction ? (
        <section className="user-instruction glass-panel">
          <div className="user-instruction-head">
            <p className="eyebrow"><span /> USDX / CURRENT INSTRUCTION</p>
            <span className="user-cycle">{instruction.label}</span>
          </div>
          <h2>{instruction.title}</h2>
          <p>{instruction.detail}</p>
          <Link href={`/guide/${planKey}`} className="text-cta">Open full plan guide <span>↗</span></Link>
        </section>
      ) : (
        <section className="user-instruction glass-panel">
          <p className="eyebrow"><span /> USDX / CURRENT INSTRUCTION</p>
          <h2>Complete your stake check-in</h2>
          <p>Confirm your stake amount and date to unlock your personalized 30-day compounding instructions.</p>
          <Link href="/" className="text-cta">Back to landing <span>→</span></Link>
        </section>
      )}
    </main>
  );
}
