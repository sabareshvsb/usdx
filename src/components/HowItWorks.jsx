import {
  Wallet,
  BookOpen,
  TrendingUp,
  Trophy,
} from "lucide-react";

const steps = [
  {
    icon: Wallet,
    title: "Choose Your Plan",
    description:
      "Select the investment plan that matches your goal: $500, $1000, or $5000.",
  },
  {
    icon: BookOpen,
    title: "Follow the Guide",
    description:
      "Read the monthly instructions carefully and complete every step in order.",
  },
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    description:
      "Monitor your completed months, Main IDs, and Sub IDs through the dashboard.",
  },
  {
    icon: Trophy,
    title: "Achieve Your Goal",
    description:
      "Complete the roadmap and maximize your compounding journey.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-28 bg-black">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold">
            How It
            <span className="text-yellow-400"> Works</span>
          </h2>

          <p className="text-gray-400 mt-5 max-w-2xl mx-auto">
            Follow these four simple steps to complete your USDX SMART
            compounding journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={index}
                className="relative bg-[#151515] border border-white/10 rounded-3xl p-8 hover:border-yellow-400 hover:-translate-y-2 transition-all duration-300"
              >
                {/* Step Number */}
                <div className="absolute -top-5 left-6 w-10 h-10 rounded-full bg-yellow-400 text-black font-bold flex items-center justify-center">
                  {index + 1}
                </div>

                <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-6 mt-4">
                  <Icon size={34} className="text-yellow-400" />
                </div>

                <h3 className="text-2xl font-bold mb-4">
                  {step.title}
                </h3>

                <p className="text-gray-400 leading-7">
                  {step.description}
                </p>
              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}