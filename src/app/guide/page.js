import Link from "next/link";
import { plans } from "../../data/plans";

export default function Guide() {
  return (
    <main className="guide-shell">
      <header className="guide-nav glass-panel"><Link href="/" className="guide-brand"><span>U</span> USDX <small>YOUTH WING</small></Link><Link href="/" className="guide-back">← Back to landing</Link></header>
      <section className="guide-intro">
        <p className="guide-kicker">COMPOUNDING ROADMAPS</p>
        <h1>Choose your <em>growth path.</em></h1>
        <p>Open a plan to view its complete instruction set, ID-growth signal, and monthly progress timeline.</p>
      </section>
      <section className="plan-selector">
        {Object.values(plans).map((plan, index) => (
          <Link href={`/guide/${plan.slug}`} className="plan-choice glass-panel" key={plan.slug}>
            <span>0{index + 1} / {plan.horizon} MONTHS</span><strong>{plan.price}</strong><h2>{plan.name}</h2><p>{plan.summary}</p><b>Open plan <i>→</i></b>
          </Link>
        ))}
      </section>
    </main>
  );
}
