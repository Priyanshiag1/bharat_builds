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
  MessageSquare,
  Mail,
  Copy,
  Check,
  Workflow,
  Sparkles,
  Flame,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import CircularGauge from "@/components/CircularGauge";
import AnimatedCounter from "@/components/AnimatedCounter";
import NoticeViewer from "@/components/NoticeViewer";
import { getActiveClaim, dispatchNotice } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import { ClaimData } from "@/types/claim";

export default function DashboardPage() {
  const [claim, setClaim] = useState<ClaimData | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDispatchingSes, setIsDispatchingSes] = useState(false);
  const [sesDispatchResult, setSesDispatchResult] = useState<{
    message_id?: string;
    execution_arn?: string;
    status: string;
    dispatched_at: string;
  } | null>(null);
  const [waDispatched, setWaDispatched] = useState(false);

  useEffect(() => {
    const active = getActiveClaim();
    setClaim(active);
    if (active.dispatch_channels?.email) {
      setSesDispatchResult({
        message_id: active.dispatch_channels.email.message_id,
        execution_arn: active.dispatch_channels.step_functions?.execution_arn,
        status: active.dispatch_channels.email.status,
        dispatched_at: active.dispatched_at || new Date().toLocaleTimeString(),
      });
    }
  }, []);

  if (!claim) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-400 font-medium">
        Loading Dispute Analytics...
      </div>
    );
  }

  const resolvePortalUrl = typeof window !== "undefined"
    ? `${window.location.origin}/resolve/${claim.claim_id}`
    : `http://localhost:3000/resolve/${claim.claim_id}`;

  const sec43bTaxPenalty = claim.sec43b_tax_disallowance || Math.round(claim.principal_amount * 0.3);
  const totalDebtorExposure = claim.total_exposure || (claim.principal_amount + claim.accrued_interest + sec43bTaxPenalty);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(resolvePortalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSesDispatch = async () => {
    setIsDispatchingSes(true);
    try {
      const res = await dispatchNotice(claim.claim_id, "email");
      const timestamp = new Date().toLocaleTimeString();
      setSesDispatchResult({
        message_id: res.message_id || `ses-msg-${claim.claim_id}-DEMO`,
        execution_arn: res.execution_arn || `arn:aws:states:us-east-1:123456789012:execution:vasuli-recovery-workflow-demo:${claim.claim_id}`,
        status: res.status || "DELIVERED",
        dispatched_at: timestamp,
      });
    } finally {
      setIsDispatchingSes(false);
    }
  };

  const buyerPhone = claim.buyer_phone || "+91 98765 43210";
  const cleanPhone = buyerPhone.replace(/[^0-9]/g, "");
  const waMessage = `*STATUTORY DEMAND NOTICE - MSMED ACT 2006 & SEC 43B(h)*
To: ${claim.buyer_name}
GSTIN: ${claim.buyer_gstin}

Ref: Invoice #${claim.invoice_number}
Status: 72 Days Overdue (Past 45-day legal cap)
Principal Overdue: INR ${claim.principal_amount.toLocaleString("en-IN")}
Sec 16 Penal Interest (3x RBI): INR ${claim.accrued_interest.toLocaleString("en-IN")}
Sec 43B(h) Tax Disallowance Penalty: INR ${sec43bTaxPenalty.toLocaleString("en-IN")}
TOTAL DEBTOR EXPOSURE: INR ${totalDebtorExposure.toLocaleString("en-IN")}

You may execute immediate settlement with a 5% penalty waiver or select a 3-month EMI plan here:
${resolvePortalUrl}

Failure to settle within 15 days triggers MSEFC Section 18 statutory arbitration.`;

  const waDeepLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

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

          {/* Quick Action CTA to Buyer Portal */}
          <div className="flex items-center gap-3">
            <Link
              href={`/resolve/${claim.claim_id}`}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff9900] to-amber-500 hover:brightness-110 text-slate-950 text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#ff9900]/20 transition group"
            >
              <span>Preview Buyer Portal</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Top Analytics Row: Circular Gauge & 4 Metric Cards */}
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

          {/* 4 Financial & Tax Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Metric 1: Principal Amount */}
            <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Coins className="w-14 h-14 text-[#ff9900]" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Principal Amount
                </span>
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2">
                  {formatINR(claim.principal_amount)}
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5 mt-3">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Inv Date: {formatDate(claim.invoice_date)}</span>
              </div>
            </div>

            {/* Metric 2: Days Overdue */}
            <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Clock className="w-14 h-14 text-rose-500" />
              </div>
              <div>
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                  <AlertOctagon className="w-3.5 h-3.5" /> Days Overdue
                </span>
                <div className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight mt-2">
                  {claim.days_overdue} Days
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5 mt-3">
                <Scale className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Past 45d limit</span>
              </div>
            </div>

            {/* Metric 3: Accrued 3x Penal Interest */}
            <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden border-amber-500/30 group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Coins className="w-14 h-14 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    3x Penal Interest
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 font-bold border border-amber-400/20">
                    Sec 16
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight mt-2">
                  <AnimatedCounter value={claim.accrued_interest} />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5 mt-3">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Statutory 16.50% p.a.</span>
              </div>
            </div>

            {/* Metric 4: Section 43B(h) Corporate Tax Penalty */}
            <div className="bg-gradient-to-br from-purple-950/40 via-[#1e293b] to-slate-900 border border-purple-500/40 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-15 group-hover:opacity-25 transition-opacity">
                <Flame className="w-14 h-14 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                    Sec 43B(h) Tax Hit
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
                    30% Disallow
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-purple-300 tracking-tight mt-2">
                  {formatINR(sec43bTaxPenalty)}
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800 text-[11px] text-purple-300/80 flex items-center gap-1.5 mt-3">
                <AlertTriangle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Corporate Tax Penalty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 43B(h) High-Impact Statutory Leverage Callout */}
        <div className="rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/40 p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-purple-400" />
                  Statutory Tax Weapon: Section 43B(h) Finance Act 2023
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                Debtor Total Financial Exposure: <span className="text-purple-300">{formatINR(totalDebtorExposure)}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Under Section 43B(h) of the Income Tax Act, 1961, amounts payable to registered MSMEs beyond 45 days are
                <strong className="text-white"> strictly disallowed as deductible business expenses</strong> for the buyer&apos;s fiscal year.
                This imposes an immediate <strong className="text-purple-300">30% corporate income tax penalty ({formatINR(sec43bTaxPenalty)})</strong> directly on {claim.buyer_name}, giving your MSME unprecedented legal leverage for rapid dispute settlement.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-purple-500/30 rounded-xl p-4 min-w-[260px] space-y-2 shrink-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Exposure Breakdown
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Principal Debt:</span>
                  <span className="font-mono font-bold text-white">{formatINR(claim.principal_amount)}</span>
                </div>
                <div className="flex justify-between text-amber-300">
                  <span>Sec 16 Interest (3x):</span>
                  <span className="font-mono font-bold">{formatINR(claim.accrued_interest)}</span>
                </div>
                <div className="flex justify-between text-purple-300">
                  <span>Sec 43B(h) Tax Hit (30%):</span>
                  <span className="font-mono font-bold">{formatINR(sec43bTaxPenalty)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black text-white">
                  <span>Total Debtor Risk:</span>
                  <span className="text-purple-400">{formatINR(totalDebtorExposure)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Channel Debtor Dispatch Panel */}
        <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Workflow className="w-4 h-4 text-[#ff9900]" /> Multi-Channel Recovery Dispatch
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                Trigger 1-Click Multi-Channel Escalation to Debtor
              </h3>
              <p className="text-xs text-slate-400">
                Direct statutory demand dispatch to {claim.buyer_name} via WhatsApp Web &amp; Amazon SES Cloud Orchestrator.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Debtor: {buyerPhone} | {claim.buyer_email || "accounts@apexinfra.com"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Channel 1: WhatsApp Web Deep Link */}
            <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-white">WhatsApp Web Direct Dispatch</span>
                  </div>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border font-semibold ${
                    waDispatched
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}>
                    {waDispatched ? "Dispatched" : "Ready"}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Opens instant WhatsApp chat with <strong className="text-emerald-300">{buyerPhone}</strong>. Pre-populates formal MSMED statutory default notice, Sec 43B(h) tax liability alert, and the secure settlement link.
                </p>
              </div>

              <a
                href={waDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setWaDispatched(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send via WhatsApp Web</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Channel 2: Amazon SES & Step Functions */}
            <div className="bg-slate-950/60 border border-[#ff9900]/30 rounded-xl p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#ff9900]/10 border border-[#ff9900]/30 flex items-center justify-center text-[#ff9900]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-white">Amazon SES + Step Functions</span>
                  </div>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border font-semibold ${
                    sesDispatchResult
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}>
                    {sesDispatchResult ? sesDispatchResult.status : "Standby"}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Dispatches verified audit notice to <strong className="text-amber-300">{claim.buyer_email || "accounts@apexinfra.com"}</strong> via Amazon SES and initiates AWS Step Functions 14-day recovery state machine.
                </p>
                {sesDispatchResult && (
                  <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 p-2 rounded border border-emerald-500/30 space-y-0.5">
                    <div>✓ Dispatched at {sesDispatchResult.dispatched_at}</div>
                    <div className="text-slate-400 truncate">Msg ID: {sesDispatchResult.message_id}</div>
                    <div className="text-slate-400 truncate">StepFn: vasuli-recovery-workflow-demo</div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSesDispatch}
                disabled={isDispatchingSes}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ff9900] to-amber-500 hover:brightness-110 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-[#ff9900]/20 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>{isDispatchingSes ? "Dispatching via SES..." : "Dispatch via Amazon SES"}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Copy Debtor Resolution URL Bar */}
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="font-semibold text-slate-300">Debtor Magic Resolution URL:</span>
              <span className="font-mono text-slate-400 truncate max-w-xs sm:max-w-md bg-slate-900 px-2 py-1 rounded border border-slate-800">
                {resolvePortalUrl}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Copied!" : "Copy Portal Link"}</span>
              </button>
              <Link
                href={`/resolve/${claim.claim_id}`}
                target="_blank"
                className="px-3 py-1.5 rounded-lg bg-[#ff9900]/10 hover:bg-[#ff9900]/20 text-[#ff9900] font-semibold flex items-center gap-1.5 border border-[#ff9900]/30 transition"
              >
                <span>Open Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
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
                &ldquo;{claim.stalling_message_snippet || "Sir our quarterly statutory audit is ongoing..."}&rdquo;
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
          claimId={claim.claim_id}
        />
      </div>
    </div>
  );
}
