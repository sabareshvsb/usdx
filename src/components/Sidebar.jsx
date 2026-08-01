"use client";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white p-6 min-h-screen sticky top-0">
      <h2 className="text-2xl font-bold text-yellow-400 mb-6">
        Monthly Guide
      </h2>

      <ul className="space-y-3">
        {[...Array(60)].map((_, i) => (
          <li key={i}>
            <a
              href={`#month-${i + 1}`}
              className="block p-2 rounded hover:bg-yellow-500 hover:text-black"
            >
              Month {i + 1}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}