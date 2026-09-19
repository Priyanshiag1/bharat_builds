import Link from "next/link";
import {
  FileSpreadsheet,
  Activity,
  Handshake,
  Scale,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Award,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff9900]/10 border border-[#ff9900]/30 text-[#ff9900] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Bharat Builds Tour Hackathon
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
            Unlocking India's <span className="text-[#ff9900]">₹10.7 Lakh Cr</span> Delayed Liquidity
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Statutory legal intelligence for MSMEs under the MSMED Act, 2006. Instant document audit, Section 16 3x compound interest calculation, autonomous multi-tier negotiation, and direct buyer resolution portal.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/intake"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#ff9900] to-amber-500 hover:brightness-110 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-[#ff9900]/25 transition active:scale-95"
            >
              <span>Launch Claim Intake Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard"
              className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition"
            >
              View Analytics Dashboard
            </Link>
          </div>
        </div>

        {/* 3 Interactive Screen Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Screen 1 */}
          <Link
            href="/intake"
            className="group bg-[#1e293b] border border-slate-700/80 hover:border-[#ff9900]/60 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all hover:-translate-y-1"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#ff9900]/10 border border-[#ff9900]/30 flex items-center justify-center text-[#ff9900] mb-5 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ff9900]">
                Module 1
              </span>
              <h2 className="text-xl font-bold text-white mt-1 group-hover:text-[#ff9900] transition-colors">
                Claim Intake & MSMED Compliance Audit
              </h2>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Upload Invoice PDFs & Proof of Delivery. Amazon Textract OCR extracts GSTINs, credit terms, and triggers evidentiary warnings for missing challans.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-800/80 text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Enter Intake Screen</span>
              <ArrowRight className="w-4 h-4 text-[#ff9900] group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Screen 2 */}
          <Link
            href="/dashboard"
            className="group bg-[#1e293b] border border-slate-700/80 hover:border-emerald-500/60 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all hover:-translate-y-1"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Module 2 & 3
              </span>
              <h2 className="text-xl font-bold text-white mt-1 group-hover:text-emerald-400 transition-colors">
                Dispute Analytics & Notice Generator
              </h2>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Visual circular claim strength gauge (88/100), animated 3x compounding interest ticker, Bedrock stalling excuse classifier, and dual-tier legal notices.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-800/80 text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>View Analytics</span>
              <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Screen 3 */}
          <Link
            href="/resolve/CLM-9082"
            className="group bg-[#1e293b] border-2 border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-[#ff9900] text-slate-950 font-black text-[9px] uppercase px-3 py-1 rounded-bl-lg">
              The Showstopper
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 transition-transform">
                <Handshake className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Module 4
              </span>
              <h2 className="text-xl font-bold text-white mt-1 group-hover:text-blue-300 transition-colors">
                Buyer Settlement Portal
              </h2>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Friction-free debtor portal. 5% prompt discount (₹2,37,500) or 3-Month EMI plan (₹86,150/mo) with celebratory confetti and binding digital agreement.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-800/80 text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Open Magic Link</span>
              <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Statutory MSMED Act Reference Footer Card */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-[#ff9900] shrink-0" />
            <div>
              <span className="font-bold text-slate-200">MSMED Act 2006 Statutory Rulebook: </span>
              Section 15 mandates payment within max 45 days. Section 16 penalizes defaults at 3x the RBI Bank Rate compounding monthly. Section 19 mandates 75% pre-deposit for appeals.
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]">
              Branch: feature/frontend-ui
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
