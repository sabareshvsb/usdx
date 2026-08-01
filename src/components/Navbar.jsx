"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-6 pt-6">

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-8 py-4 shadow-2xl">

          {/* Logo */}

          <Link href="/" className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center text-black font-black">
              U
            </div>

            <div>
              <h1 className="text-xl font-bold text-white">
                USDX SMART
              </h1>

              <p className="text-xs text-gray-400">
                Compounding Guide
              </p>
            </div>

          </Link>

          {/* Navigation */}

          <nav className="hidden md:flex items-center gap-10 text-gray-300">

            <Link href="/" className="hover:text-yellow-400 transition">
              Home
            </Link>

            <Link href="#plans" className="hover:text-yellow-400 transition">
              Plans
            </Link>

            <Link href="/guide" className="hover:text-yellow-400 transition">
              Guide
            </Link>

            <Link href="#faq" className="hover:text-yellow-400 transition">
              FAQ
            </Link>

            <Link href="/contact" className="hover:text-yellow-400 transition">
              Contact
            </Link>

          </nav>

          {/* Dashboard Button */}

          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 font-semibold text-black transition hover:scale-105 hover:bg-yellow-300"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

        </div>

      </div>
    </header>
  );
}