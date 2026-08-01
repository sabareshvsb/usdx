import PlanCard from "./PlanCard";

export default function Plans() {
  return (
    <section id="plans" className="py-28 bg-black">

      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center">

          <h2 className="text-5xl font-bold">

            Choose Your

            <span className="text-yellow-400">
              {" "}Investment Plan
            </span>

          </h2>

          <p className="text-gray-400 mt-5 max-w-3xl mx-auto">

            Select the roadmap that matches your investment.
            Every guide contains detailed monthly instructions.

          </p>

        </div>

        <div className="grid lg:grid-cols-3 gap-10 mt-20">

          <PlanCard
            price="$500"
            title="Starter Plan"
            description="Perfect for beginners entering the USDX SMART ecosystem."
            icon="🌱"
            href="/500"
          />

          <PlanCard
            price="$1000"
            title="Advanced Plan"
            description="Recommended for members who want faster compounding growth."
            icon="💎"
            href="/1000"
            popular={true}
          />

          <PlanCard
            price="$5000"
            title="Professional Plan"
            description="Designed for experienced members aiming for maximum growth."
            icon="👑"
            href="/5000"
          />

        </div>

      </div>

    </section>
  );
}