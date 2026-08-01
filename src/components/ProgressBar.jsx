"use client";

export default function ProgressBar({ completed }) {

  const percentage = (completed / 60) * 100;

  return (
    <div className="mb-8">

      <p className="mb-2 text-white">
        Progress: {completed}/60 Months
      </p>

      <div className="bg-gray-700 h-4 rounded">

        <div
          className="bg-yellow-500 h-4 rounded"
          style={{ width: `${percentage}%` }}
        />

      </div>

    </div>
  );
}