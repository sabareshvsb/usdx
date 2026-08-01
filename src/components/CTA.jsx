import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-32 bg-black">

      <div className="max-w-6xl mx-auto px-6">

        <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 p-[1px]">

          <div className="rounded-[40px] bg-[#111111] px-8 py-20 text-center">

            <p className="uppercase tracking-[6px] text-yellow-400 font-semibold">
              START TODAY
            </p>

            <h2 className="text-5xl md:text-6xl font-bold mt-6">
              Ready to Begin Your
              <span className="block text-yellow-400">
                Compounding Journey?
              </span>
            </h2>

            <p className="text-gray-400 text-lg max-w-3xl mx-auto mt-8 leading-8">
              Choose your investment plan and follow a professionally
              structured 60-month roadmap designed for USDX SMART members.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-6">

              <Link href="#plans">
                <button className="px-10 py-4 bg-yellow-400 text-black rounded-xl font-bold hover:scale-105 transition">
                  Explore Plans
                </button>
              </Link>

              <Link href="/dashboard">
                <button className="px-10 py-4 border border-yellow-400 text-yellow-400 rounded-xl font-bold hover:bg-yellow-400 hover:text-black transition">
                  Open Dashboard
                </button>
              </Link>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}