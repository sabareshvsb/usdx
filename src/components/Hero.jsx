"use client";

import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-[#050505] text-white min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-8 w-full">

        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* LEFT SIDE */}

          <div>

            <span className="inline-block bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded-full px-4 py-2 text-sm font-semibold">
              USDX SMART • YOUTH WING
            </span>

            <h1 className="mt-8 text-5xl lg:text-6xl font-black leading-tight">
              Professional
              <br />
              <span className="text-yellow-400">
                Compounding Guide
              </span>
            </h1>

            <p className="mt-8 text-lg text-gray-400 max-w-lg leading-8">
              Follow the complete roadmap for the
              <span className="text-white font-semibold">
                {" "} $500, $1000 and $5000
              </span>{" "}
              investment plans.
            </p>

            <div className="mt-10 flex gap-5">

              <Link
                href="#plans"
                className="bg-yellow-400 text-black px-7 py-4 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition"
              >
                Explore Plans
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/dashboard"
                className="border border-yellow-400 text-yellow-400 px-7 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-400 hover:text-black transition"
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>

            </div>

          </div>

          {/* RIGHT SIDE */}

          <div className="flex justify-center">

            <div className="w-full max-w-md rounded-3xl bg-[#111111] border border-white/10 p-8">

              <p className="text-gray-400">
                Current Progress
              </p>

              <h2 className="text-4xl font-bold mt-3">
                Month 36 / 60
              </h2>

              <div className="mt-8 h-3 rounded-full bg-neutral-800">

                <div className="w-3/5 h-full bg-yellow-400 rounded-full"></div>

              </div>

              <div className="flex justify-between mt-3 text-gray-400 text-sm">

                <span>60% Complete</span>

                <span>24 Months Left</span>

              </div>

              <div className="mt-12 rounded-xl border border-yellow-400/20 bg-[linear-gradient(135deg,rgba(250,204,21,.2),transparent)] p-8 text-yellow-300">
                Growth chart
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
