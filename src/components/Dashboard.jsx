export default function Dashboard() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">

      <div className="bg-gray-900 p-5 rounded-xl border border-yellow-500">
        <h3 className="text-gray-400">Total Months</h3>
        <p className="text-3xl font-bold text-yellow-400">60</p>
      </div>

      <div className="bg-gray-900 p-5 rounded-xl border border-yellow-500">
        <h3 className="text-gray-400">Completed</h3>
        <p className="text-3xl font-bold text-green-400">0</p>
      </div>

      <div className="bg-gray-900 p-5 rounded-xl border border-yellow-500">
        <h3 className="text-gray-400">Pending</h3>
        <p className="text-3xl font-bold text-red-400">60</p>
      </div>

      <div className="bg-gray-900 p-5 rounded-xl border border-yellow-500">
        <h3 className="text-gray-400">Main IDs</h3>
        <p className="text-3xl font-bold text-blue-400">1</p>
      </div>

      <div className="bg-gray-900 p-5 rounded-xl border border-yellow-500">
        <h3 className="text-gray-400">Sub IDs</h3>
        <p className="text-3xl font-bold text-purple-400">0</p>
      </div>

    </div>
  );
}