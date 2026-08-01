import Link from "next/link";

export default function PlanCard({
  title,
  price,
  description,
  icon,
  href,
  popular = false,
}) {
  return (
    <div
      className={`relative rounded-3xl bg-[#141414] border ${
        popular
          ? "border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,.25)]"
          : "border-white/10"
      } p-8 transition duration-300 hover:-translate-y-3 hover:border-yellow-400`}
    >
      {popular && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-5 py-2 rounded-full text-sm font-bold">
          MOST POPULAR
        </span>
      )}

      <div className="text-5xl mb-6">{icon}</div>

      <h3 className="text-5xl font-bold text-white">
        {price}
      </h3>

      <h4 className="text-2xl font-semibold text-yellow-400 mt-2">
        {title}
      </h4>

      <p className="text-gray-400 mt-6 leading-7">
        {description}
      </p>

      <ul className="mt-8 space-y-3 text-gray-300">
        <li>✔ 60 Month Roadmap</li>
        <li>✔ Step-by-Step Guide</li>
        <li>✔ Dashboard Access</li>
        <li>✔ Lifetime Updates</li>
      </ul>

      <Link href={href || "/"}>
        <button className="w-full mt-10 py-4 rounded-xl bg-yellow-400 text-black font-bold hover:scale-105 transition">
          View Guide →
        </button>
      </Link>
    </div>
  );
}