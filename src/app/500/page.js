import Link from "next/link";

export default function StarterPlanPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] px-6 py-32 text-white">
      <section className="mx-auto max-w-3xl card p-8 sm:p-12">
        <p className="text-sm font-bold tracking-[0.2em] text-yellow-400">USDX SMART</p>
        <h1 className="mt-4 text-5xl font-extrabold">$500 Starter Plan</h1>
        <p className="mt-5 text-neutral-300">Use the monthly guide to follow your compounding plan step by step.</p>
        <Link href="/guide" className="btn-primary mt-8 inline-block">Open guide</Link>
      </section>
    </main>
  );
}
