"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import confetti from "canvas-confetti";
import {
  ShieldCheck,
  Percent,
  CalendarDays,
  CheckCircle2,
  Download,
  Printer,
  Sparkles,
  Building,
  Scale,
  CreditCard,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { getActiveClaim, updateClaimStatus, resolveClaimOnBackend, getSettlementAgreementPdfUrl } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import { ClaimData } from "@/types/claim";

export default function BuyerSettlementPage() {
  const params = useParams();
  const claimId = (params?.claimId as string) || "CLM-9082";

  const [claim, setClaim] = useState<ClaimData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"DISCOUNT" | "EMI" | null>(null);
  const [isSettled, setIsSettled] = useState(false);

  useEffect(() => {
    const data = getActiveClaim();
    setClaim(data);
    if (data.status === "SETTLED") {
      setIsSettled(true);
      setSelectedPlan(data.settlement_type === "EMI_PLAN" ? "EMI" : "DISCOUNT");
    }
  }, []);

  // Calculated values
  const principal = claim?.principal_amount || 250000;
  const interest = claim?.accrued_interest || 8450.75;
  const discountedTotal = Math.round(principal * 0.95); // 5% discount = 237500
  const emiMonthly = 86150; // 3-month EMI as specified in playbook
  const emiTotal = emiMonthly * 3;

  const triggerConfetti = () => {
    // Stage 1 burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Stage 2 side cannons
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#ff9900", "#10b981", "#38bdf8"],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#ff9900", "#10b981", "#38bdf8"],
      });
    }, 250);
  };

  const handleChooseDiscount = async () => {
    setSelectedPlan("DISCOUNT");
    setIsSettled(true);
    updateClaimStatus(claimId, "SETTLED", "LUMP_SUM_DISCOUNT");
    triggerConfetti();
    await resolveClaimOnBackend(claimId, "LUMP_SUM_DISCOUNT");
  };

  const handleChooseEMI = async () => {
    setSelectedPlan("EMI");
    setIsSettled(true);
    updateClaimStatus(claimId, "SETTLED", "EMI_PLAN");
    triggerConfetti();
    await resolveClaimOnBackend(claimId, "EMI_PLAN");
  };

  if (!claim) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-400">
        Loading Buyer Portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Buyer Header Banner */}
        <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified MSMED Direct Resolution Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Commercial Dispute Settlement Offer
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Issued to: <span className="font-bold text-white">{claim.buyer_name}</span> (GSTIN: {claim.buyer_gstin})
              </p>
            </div>

            <div className="text-left sm:text-right bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold block uppercase">Claim Reference</span>
              <span className="text-sm font-mono font-bold text-[#ff9900]">{claim.claim_id}</span>
              <span className="text-xs text-slate-400 block mt-0.5">Inv #{claim.invoice_number}</span>
            </div>
          </div>

          {/* Verified Claim Breakdown Grid */}
          <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-medium block">Principal Due</span>
              <span className="text-base font-bold text-white mt-0.5 block">
                {formatINR(claim.principal_amount)}
              </span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-medium block">Statutory Interest (Sec 16)</span>
              <span className="text-base font-bold text-amber-400 mt-0.5 block">
                +{formatINR(claim.accrued_interest)}
              </span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-medium block">Days Overdue</span>
              <span className="text-base font-bold text-rose-400 mt-0.5 block">
                {claim.days_overdue} Days
              </span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-medium block">Total Claimable Sum</span>
              <span className="text-base font-bold text-[#ff9900] mt-0.5 block">
                {formatINR(claim.total_claimable_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* If Settled: Celebratory Card */}
        {isSettled ? (
          <div className="bg-gradient-to-b from-emerald-950/40 via-[#1e293b] to-[#1e293b] border-2 border-emerald-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Status: SETTLED
                  </span>
                  <span className="text-xs text-slate-400">
                    Timestamp: {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white mt-1">
                  Settlement Agreement Executed
                </h3>
                <p className="text-slate-300 text-sm mt-0.5">
                  The dispute for Invoice #{claim.invoice_number} is resolved under terms of Section 15/16 waiver.
                </p>
              </div>
            </div>

            {/* Executed Terms Summary Box */}
            <div className="bg-slate-900/90 rounded-xl p-5 border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Selected Pathway:</span>
                <span className="font-bold text-white">
                  {selectedPlan === "DISCOUNT"
                    ? "Option A: 5% Early Settlement Discount (Lump Sum)"
                    : "Option B: 3-Month Structured EMI Plan"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Settlement Amount:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {selectedPlan === "DISCOUNT" ? formatINR(discountedTotal) : `${formatINR(emiMonthly)} / month`}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Statutory Interest Waiver:</span>
                <span className="font-semibold text-amber-300">
                  {selectedPlan === "DISCOUNT"
                    ? `100% Waived (${formatINR(claim.accrued_interest)})`
                    : "Standard Statutory Amortization"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Binding Digital Reference:</span>
                <span className="text-[#ff9900]">VASOOL-AGR-{claim.claim_id}-2026</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  const url = getSettlementAgreementPdfUrl(claim.claim_id);
                  window.open(url, "_blank");
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
                title="Download Official ReportLab Binding Agreement Deed PDF"
              >
                <Download className="w-4 h-4" />
                <span>Official Agreement Deed (PDF)</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Agreement</span>
              </button>

              <button
                onClick={() => {
                  setIsSettled(false);
                  setSelectedPlan(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
              >
                Change Selection
              </button>
            </div>
          </div>
        ) : (
          /* Resolution Pathways: Option A vs Option B */
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Choose an Amicable Resolution Pathway
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Execute directly to avert formal escalation to the Micro and Small Enterprises Facilitation Council (MSEFC).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option A: Settle with 5% Discount */}
              <div className="bg-[#1e293b] border-2 border-emerald-500/30 hover:border-emerald-500 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-bl-lg">
                  Recommended
                </div>

                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                    <Percent className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Option A
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Settle Now with 5% Early Discount
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Pay the discounted principal immediately. The MSME supplier waives 100% of accrued statutory compound interest ({formatINR(claim.accrued_interest)}).
                  </p>

                  <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400 block">Immediate Settlement Sum</span>
                    <div className="text-3xl font-black text-emerald-400 tracking-tight">
                      {formatINR(discountedTotal)}
                    </div>
                    <span className="text-[11px] text-slate-400 block line-through">
                      Standard Claim: {formatINR(claim.total_claimable_amount)}
                    </span>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={handleChooseDiscount}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.99] transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Settle Now ({formatINR(discountedTotal)})</span>
                  </button>
                </div>
              </div>

              {/* Option B: 3-Month EMI Plan */}
              <div className="bg-[#1e293b] border-2 border-blue-500/30 hover:border-blue-500 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all group relative overflow-hidden">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Option B
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Accept 3-Month EMI Plan
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Spread the settlement across three manageable monthly tranches to ease short-term treasury and cash flow friction.
                  </p>

                  <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400 block">Monthly Installment (3 Months)</span>
                    <div className="text-3xl font-black text-blue-400 tracking-tight">
                      {formatINR(emiMonthly)}
                      <span className="text-xs font-normal text-slate-400"> / month</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      Total Amortized: {formatINR(emiTotal)}
                    </span>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={handleChooseEMI}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Accept 3-Month EMI Plan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
