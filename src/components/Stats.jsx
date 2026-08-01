import {
  CalendarDays,
  Layers3,
  BookOpen,
  ShieldCheck,
} from "lucide-react";

const stats = [
  {
    icon: CalendarDays,
    value: "60+",
    title: "Months",
    desc: "Complete Roadmap",
  },
  {
    icon: Layers3,
    value: "3",
    title: "Investment Plans",
    desc: "$500 • $1000 • $5000",
  },
  {
    icon: BookOpen,
    value: "100%",
    title: "Step-by-Step Guide",
    desc: "Easy to Follow",
  },
  {
    icon: ShieldCheck,
    value: "24/7",
    title: "Lifetime Access",
    desc: "Anytime, Anywhere",
  },
];

export default function Stats() {
  return (
    <section className="py-24 bg-[#0B0B0B]">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold">
            Why Choose
            <span className="text-yellow-400"> USDX Guide</span>
          </h2>

          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Everything you need to successfully follow the
            USDX SMART compounding roadmap in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {stats.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className="group rounded-3xl border border-yellow-500/20 bg-[#141414] p-8 hover:border-yellow-400 hover:-translate-y-2 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-6">
                  <Icon
                    size={34}
                    className="text-yellow-400"
                  />
                </div>

                <h3 className="text-5xl font-bold text-yellow-400">
                  {item.value}
                </h3>

                <h4 className="text-xl font-semibold mt-3">
                  {item.title}
                </h4>

                <p className="text-gray-400 mt-2">
                  {item.desc}
                </p>
              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}