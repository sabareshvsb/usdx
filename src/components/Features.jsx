import {
  ShieldCheck,
  CalendarDays,
  BarChart3,
  Smartphone,
  Rocket,
  BookOpen,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Secure Roadmap",
    description:
      "Follow a structured and easy-to-understand compounding strategy.",
  },
  {
    icon: CalendarDays,
    title: "60 Month Plan",
    description:
      "Every month includes clear instructions and milestones.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description:
      "Monitor your investment journey month by month.",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description:
      "Access your guide from desktop, tablet, or mobile.",
  },
  {
    icon: Rocket,
    title: "Fast Navigation",
    description:
      "Move quickly between months and investment plans.",
  },
  {
    icon: BookOpen,
    title: "Step-by-Step Guide",
    description:
      "Simple instructions designed for every experience level.",
  },
];

export default function Features() {
  return (
    <section className="py-28 bg-[#0B0B0B]">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold">
            Why Choose
            <span className="text-yellow-400"> USDX SMART?</span>
          </h2>

          <p className="mt-5 text-gray-400 max-w-2xl mx-auto">
            Everything you need to follow the compounding roadmap
            in one professional platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={index}
                className="rounded-3xl bg-[#151515] border border-white/10 p-8 hover:border-yellow-400 hover:-translate-y-2 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-6">
                  <Icon className="text-yellow-400" size={34} />
                </div>

                <h3 className="text-2xl font-bold">
                  {feature.title}
                </h3>

                <p className="text-gray-400 mt-4 leading-7">
                  {feature.description}
                </p>
              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}