"use client";

export default function MonthGrid() {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-10 gap-3 mb-10">
      {[...Array(60)].map((_, i) => (
        <a
          key={i}
          href={`#month-${i + 1}`}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-center py-3 rounded-lg transition"
        >
          {i + 1}
        </a>
      ))}
    </div>
  );
}