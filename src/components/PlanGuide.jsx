import Link from "next/link";

export default function PlanGuide({ plan }) {
  const graph = plan.graph.map((point, index) => typeof point === "number" ? { month: index + 1, ids: point } : point);
  const maxIds = Math.max(...graph.map((point) => point.ids));
  return (
    <main className="guide-shell">
      <header className="guide-nav glass-panel"><Link href="/" className="guide-brand"><span>U</span> USDX <small>YOUTH WING</small></Link><Link href="/guide" className="guide-back">← All plans</Link></header>
      <section className="plan-hero">
        <p className="guide-kicker">{plan.horizon}-MONTH COMPOUNDING ROADMAP</p><h1>{plan.price} <em>{plan.name.replace("Compounding Plan", "")}</em></h1><p>{plan.summary}</p>
        <div className="progress-wrap glass-panel"><div className="progress-meta"><span>ROADMAP PROGRESS</span><b>0 / {plan.horizon} MONTHS</b></div><div className="progress-track"><i /></div><div className="progress-months"><span>START</span><span>MONTH {plan.horizon}</span></div></div>
        <a className="mt-4 inline-flex items-center gap-3 rounded-[10px] border border-cyan-300/40 px-4 py-3 text-xs font-semibold text-cyan-300 transition hover:-translate-y-0.5 hover:bg-cyan-300/10" href={plan.download} download={plan.downloadName}>↓ Download plan spreadsheet <span className="font-mono text-[10px] tracking-widest text-slate-400">.XLSX</span></a>
      </section>
      <section className="id-graph glass-panel"><div><p className="guide-kicker">ID GROWTH SIGNAL</p><h2>Active ID trajectory</h2><span>Growth follows the scheduled creation events in this plan.</span></div><div className="chart" aria-label="ID growth graph">{graph.map((point) => <i key={point.month} style={{ height: `${Math.max(8, point.ids / maxIds * 100)}%` }} title={`Month ${point.month}: ${point.ids} IDs`} />)}</div><div className="chart-axis"><span>MONTH 1</span><span>MONTH {plan.horizon}</span></div></section>
      <section className="instructions"><div className="instruction-heading"><p className="guide-kicker">EXECUTION LOG</p><h2>Monthly <em>instructions.</em></h2><span>{plan.steps.length} roadmap checkpoints</span></div><div className="instruction-grid">{plan.steps.map(([month, title, detail], index) => <article className="instruction-card glass-panel" key={`${month}-${index}`}><span>{month}</span><h3>{title}</h3><p>{detail}</p></article>)}</div></section>
    </main>
  );
}
