import Link from "next/link";
import { redirect } from "next/navigation";
import { SUPABASE_URL, supabaseHeaders, supabaseConfigured } from "../../lib/supabase";
import { plans } from "../../data/plans";
import { findInstruction, cycleForDate } from "../../lib/planGuide";

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
    const select = encodeURIComponent('email,name,stake_amount,"date of stake",wallet_address2,"stake_date2","stake_amount2"');
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
    cycle = cycleForDate(dateOfStake).cycle;
  }
  if (plan) {
    cycle = Math.min(cycle, plan.horizon);
    instruction = findInstruction(plan, cycle);
  }

  const plan2Key = String(user["stake_amount2"] || "");
  const plan2 = plans[plan2Key];
  const dateOfStake2 = user["stake_date2"] || "";
  let cycle2 = 1;
  let instruction2 = null;
  if (dateOfStake2) {
    cycle2 = cycleForDate(dateOfStake2).cycle;
  }
  if (plan2) {
    cycle2 = Math.min(cycle2, plan2.horizon);
    instruction2 = findInstruction(plan2, cycle2);
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

      {plan2 && instruction2 && user.wallet_address2 ? (
        <section className="user-instruction glass-panel">
          <div className="user-instruction-head">
            <p className="eyebrow"><span /> USDX / ADDITIONAL WALLET INSTRUCTION</p>
            <span className="user-cycle">{instruction2.label}</span>
          </div>
          <h2>{instruction2.title}</h2>
          <p>{instruction2.detail}</p>
          <span className="wallet2-stored"><span>ADDITIONAL WALLET</span>{user.wallet_address2}</span>
          <Link href={`/guide/${plan2Key}`} className="text-cta">Open full plan guide <span>↗</span></Link>
        </section>
      ) : null}
    </main>
  );
}
