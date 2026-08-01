"use client";

import { useState } from "react";

export default function MonthCard({
  month,
  title,
 investment,
  actions,
  note,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-gray-900 border border-yellow-500 rounded-xl overflow-hidden">

      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center p-5 text-left"
      >
        <div>
          <h2 className="text-3xl font-bold text-yellow-400">
            Month {month}
          </h2>

          <p className="text-lg text-white mt-2">
            {title}
          </p>
        </div>

        <span className="text-3xl text-yellow-400">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="p-5 border-t border-yellow-500">

          <p className="text-lg">
            <span className="font-bold">Investment:</span>{" "}
            <span className="text-yellow-400">{investment}</span>
          </p>

          <h3 className="mt-5 text-xl font-bold">
            Instructions
          </h3>

          <ul className="mt-3 space-y-3">
            {actions.map((action, index) => (
              <li key={index}>
                ✅ {action}
              </li>
            ))}
          </ul>

          <div className="mt-6 bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
            <strong>Note:</strong> {note}
          </div>

          <button className="mt-6 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg">
            ✓ Mark Completed
          </button>

        </div>
      )}
    </div>
  );
}