"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertOctagon,
  Calendar,
  ExternalLink,
  Info,
  Clock,
  Coins,
  Scale,
  BrainCircuit,
  FileCheck2,
  ChevronRight,
  Send,
} from "lucide-react";
import CircularGauge from "@/components/CircularGauge";
import AnimatedCounter from "@/components/AnimatedCounter";
import NoticeViewer from "@/components/NoticeViewer";
import { getActiveClaim, getDossierPdfUrl, dispatchNotice } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import { ClaimData } from "@/types/claim";

export default function DashboardPage() {
  const [claim, setClaim] = useState<ClaimData | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  useEffect(() => {
    setClaim(getActiveClaim());
  }, []);

  const handleDispatch = async () => {
    if (!claim) return;
    setIsDispatching(true);
    const res = await dispatchNotice(claim.claim_id);
    setDispatchResult(res);
    setIsDispatching(false);
    setShowDispatchModal(true);
  };

  if (!claim) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-400">
        Loading Dispute Analytics...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Claim {claim.claim_id}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> MSMED Act Protection Active
              </span>
              <span className="text-xs text-slate-400 font-mono px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                Inv #{claim.invoice_number}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              Debtor: <span className="font-semibold text-white">{claim.buyer_name}</span> (GSTIN: {claim.buyer_gstin})
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDispatch}
              disabled={isDispatching}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer"
              title="Dispatch Notice via Amazon SES & WhatsApp with AWS Step Functions"
            >
              <Send className="w-4 h-4" />
              <span>{isDispatching ? "Dispatching..." : "Dispatch Notice (SES/WhatsApp)"}</span>
            </button>

            <a
              href={getDossierPdfUrl(claim.claim_id)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 border border-slate-600 transition"
              title="Download Arbitration-Ready 1-Click Dossier"
            >
              <Scale className="w-4 h-4 text-amber-400" />
              <span>MSEFC Dossier (PDF)</span>
            </a>

            <Link
              href={`/resolve/${claim.claim_id}`}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff9900] to-amber-500 hover:brightness-110 text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#ff9900]/20 transition group"
            >
              <span>Preview Buyer Portal</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Top Analytics Row: Circular Gauge & 3 Metric Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Circular Gauge Card */}
          <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
            <div className="w-full flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
              <span>LEGAL AUDIT</span>
              <span className="text-[#ff9900]">MSMED Sec 15/16</span>
            </div>
            <CircularGauge score={claim.claim_strength_score} size={160} />
            <p className="text-[11px] text-slate-400 mt-4 leading-tight">
              Calculated from POD authenticity, statutory grace period expiration, and stalling excuse patterns.
            </p>
          </div>

          {/* 3 Metric Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Metric 1: Principal Amount */}
            <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Coins className="w-16 h-16 text-[#ff9900]" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Principal Amount
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
                  {formatINR(claim.principal_amount)}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-1.5 mt-4">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Invoice Date: {formatDate(claim.invoice_date)}</span>
              </div>
            </div>

            {/* Metric 2: Days Overdue */}
            <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Clock className="w-16 h-16 text-rose-500" />
              </div>
              <div>
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                  <AlertOctagon className="w-3.5 h-3.5" /> Days Overdue
                </span>
                <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight mt-2">
                  {claim.days_overdue} Days
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-1.5 mt-4">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>Past 45-day statutory deadline</span>
              </div>
            </div>

            {/* Metric 3: Accrued 3x Penal Interest */}
            <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden border-amber-500/40 group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Coins className="w-16 h-16 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    Accrued 3x Penal Interest
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 font-bold border border-amber-400/20">
                    Sec 16
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight mt-2">
                  <AnimatedCounter value={claim.accrued_interest} />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-1.5 mt-4">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Total Claim: {formatINR(claim.total_claimable_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 43B(h) Statutory Income Tax Disallowance Leverage Banner */}
        <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-[#1e293b] border border-rose-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Section 43B(h) Income Tax Act Disallowance
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold">
                  30% Corporate Tax Penalty
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Under Finance Act 2023, overdue MSME debt past 45 days is disallowed as an expenditure, forcing debtor to pay direct corporate income tax.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 text-left md:text-right shrink-0">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Direct Tax Penalty on Debtor</span>
            <span className="text-lg sm:text-xl font-black text-rose-400 font-mono">
              {formatINR(claim.tax_disallowance_penalty || claim.principal_amount * 0.30)}
            </span>
          </div>
        </div>

        {/* Stalling Intelligence Badge & AI Counter-Reasoning */}
        <div className="bg-gradient-to-r from-[#1e293b] to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Amazon Bedrock Stalling Classifier
                </span>
                <h4 className="text-base font-bold text-white">
                  Detected Excuse Category: <span className="text-[#ff9900]">{claim.stalling_category}</span>
                </h4>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                Legitimacy: Low (Commercial Pretext)
              </span>
              <span className={`text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full border font-semibold ${
                claim.classification_mode === "offline_fallback"
                  ? "bg-slate-800 text-slate-400 border-slate-700"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              }`}>
                {claim.classification_mode === "offline_fallback" ? "Offline Fallback" : "AWS Bedrock"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="font-semibold text-slate-400 block mb-1">Debtor Communication Snippet:</span>
              <p className="italic text-slate-300">
                "{claim.stalling_message_snippet || "Sir our quarterly statutory audit is ongoing..."}"
              </p>
            </div>

            <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/30 text-emerald-200">
              <span className="font-bold text-emerald-400 block mb-1">Statutory Counter-Reasoning:</span>
              <p className="leading-relaxed">
                {claim.counter_reasoning ||
                  "Under Section 15 of MSMED Act, payment terms cannot exceed 45 days regardless of buyer internal audits. Goods were accepted on 2024-05-14 without dispute within statutory 15-day objection window."}
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Tier Notice Viewer */}
        <NoticeViewer
          tier1Text={claim.tier_1_letter}
          tier2Text={claim.tier_2_notice}
          tier3Text={claim.tier_3_petition}
          claimId={claim.claim_id}
        />

        {/* Multi-Channel Dispatch Modal */}
        {showDispatchModal && dispatchResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="font-bold text-white text-base">Dispute Notice Dispatched</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="font-semibold text-[#ff9900] block">Amazon SES Email Service</span>
                  <p className="text-[11px] text-slate-400">
                    Recipient: {dispatchResult.channels?.email?.recipient} | Status: <span className="text-emerald-400 font-bold">Delivered</span>
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 truncate">
                    Msg ID: {dispatchResult.channels?.email?.message_id}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="font-semibold text-blue-400 block">AWS Step Functions State Machine</span>
                  <p className="text-[11px] text-slate-400">
                    Workflow: <code className="text-amber-300">vasuli-recovery-workflow-demo</code> | State: <span className="text-emerald-400 font-bold">RUNNING</span>
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 truncate">
                    ARN: {dispatchResult.channels?.step_functions?.execution_arn}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const waLink = dispatchResult.channels?.whatsapp?.deep_link;
                    if (waLink) window.open(waLink, "_blank");
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Notice via WhatsApp Direct Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
