"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileSpreadsheet, Activity, Handshake, Scale } from "lucide-react";
import AwsTelemetryModal from "@/components/AwsTelemetryModal";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Intake", fullName: "Claim Intake", href: "/intake", icon: FileSpreadsheet },
    { name: "Analytics", fullName: "Dispute Analytics", href: "/dashboard", icon: Activity },
    { name: "Buyer Portal", fullName: "Buyer Settlement Portal", href: "/resolve/CLM-9082", icon: Handshake },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0f172a]/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand - shrink-0 to prevent pushing right items off screen */}
          <Link href="/intake" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff9900] to-amber-500 flex items-center justify-center shadow-lg shadow-[#ff9900]/20 group-hover:scale-105 transition-transform">
              <Scale className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  Vasuli<span className="text-[#ff9900]">.AI</span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-800 text-[#ff9900] border border-[#ff9900]/30 hidden sm:inline-block">
                  MSMED
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium -mt-0.5 hidden xl:block">
                Autonomous MSME Recovery
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href.includes("/resolve") && pathname.startsWith("/resolve"));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                    isActive
                      ? "bg-slate-800 text-[#ff9900] border border-[#ff9900]/30 shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? "text-[#ff9900]" : "text-slate-400"}`} />
                  <span className="hidden md:inline">{item.fullName}</span>
                  <span className="inline md:hidden">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: AWS Inspector ALWAYS VISIBLE with shrink-0 */}
          <div className="flex items-center gap-2 shrink-0">
            <AwsTelemetryModal />

            <div className="hidden 2xl:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Bharat Builds</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
