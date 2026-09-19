"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileSpreadsheet,
  Activity,
  Handshake,
  Scale,
  Languages,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import AwsTelemetryModal from "@/components/AwsTelemetryModal";

export default function Navbar() {
  const pathname = usePathname();
  const [lang, setLang] = useState<"EN" | "HI">("EN");

  useEffect(() => {
    const saved = localStorage.getItem("dhansetu_lang");
    if (saved === "HI" || saved === "EN") setLang(saved);
  }, []);

  const toggleLanguage = () => {
    const next = lang === "EN" ? "HI" : "EN";
    setLang(next);
    localStorage.setItem("dhansetu_lang", next);
    window.dispatchEvent(new CustomEvent("dhansetu_lang_change", { detail: next }));
  };

  const navItems = [
    { name: "Intake", fullName: lang === "HI" ? "दावा अपलोड" : "Claim Intake", href: "/intake", icon: FileSpreadsheet, step: "1" },
    { name: "Analytics", fullName: lang === "HI" ? "विवाद ऑडिट" : "Dispute Analytics", href: "/dashboard", icon: Activity, step: "2" },
    { name: "Settlement", fullName: lang === "HI" ? "समाधान पोर्टल" : "Debtor Portal", href: "/resolve/CLM-9082", icon: Handshake, step: "3" },
  ];

  // Active step calculation
  const getActiveStep = () => {
    if (pathname === "/intake") return 1;
    if (pathname === "/dashboard") return 2;
    if (pathname.startsWith("/resolve")) return 3;
    return 0;
  };
  const activeStep = getActiveStep();

  return (
    <header className="border-b border-slate-800/80 bg-[#080c14]/90 backdrop-blur-xl sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand Logo */}
          <Link href="/intake" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff9900] via-amber-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-[#ff9900]/20 group-hover:scale-105 transition-transform">
              <Scale className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg sm:text-xl tracking-tight text-white flex items-center">
                  Dhan<span className="text-[#ff9900]">Setu</span>
                  <span className="text-[10px] bg-gradient-to-r from-[#ff9900] to-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded ml-1 tracking-wider">
                    AI
                  </span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hidden sm:inline-block">
                  MSMED Sec 15-16
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium -mt-0.5 hidden xl:block">
                {lang === "HI" ? "स्वायत्त MSME भुगतान वसूली सेतु" : "Autonomous MSME Delayed Liquidity Bridge"}
              </p>
            </div>
          </Link>

          {/* Visual Journey Stepper (Desktop & Tablet) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#ff9900]" /> Journey:
            </span>
            <div className="flex items-center gap-2 text-slate-300">
              <span className={`flex items-center gap-1 font-semibold ${activeStep >= 1 ? "text-[#ff9900]" : "text-slate-300"}`}>
                <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 text-[10px] flex items-center justify-center">1</span>
                <span>Upload</span>
              </span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className={`flex items-center gap-1 font-semibold ${activeStep >= 2 ? "text-emerald-400" : "text-slate-300"}`}>
                <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 text-[10px] flex items-center justify-center">2</span>
                <span>Audit</span>
              </span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className={`flex items-center gap-1 font-semibold ${activeStep >= 3 ? "text-blue-400" : "text-slate-300"}`}>
                <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 text-[10px] flex items-center justify-center">3</span>
                <span>Settlement</span>
              </span>
            </div>
          </div>

          {/* Right Navigation & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nav Links */}
            <nav className="flex items-center gap-1 sm:gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href.includes("/resolve") && pathname.startsWith("/resolve"));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                      isActive
                        ? "bg-slate-800/90 text-[#ff9900] border border-[#ff9900]/40 shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#ff9900]" : "text-slate-400"}`} />
                    <span className="hidden md:inline">{item.fullName}</span>
                    <span className="inline md:hidden">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Language Toggle: EN | हिन्दी */}
            <button
              type="button"
              onClick={toggleLanguage}
              title="Toggle English / हिन्दी"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-500 text-xs font-bold text-slate-200 transition cursor-pointer shrink-0"
            >
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span className={lang === "EN" ? "text-amber-400" : "text-slate-300"}>EN</span>
              <span className="text-slate-400">/</span>
              <span className={lang === "HI" ? "text-emerald-400 font-bold" : "text-slate-300"}>हिन्दी</span>
            </button>

            {/* AWS Architecture & Telemetry Modal */}
            <AwsTelemetryModal />
          </div>

        </div>
      </div>
    </header>
  );
}
