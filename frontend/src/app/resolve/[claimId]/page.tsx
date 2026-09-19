"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import confetti from "canvas-confetti";
import {
  ShieldCheck,
  CheckCircle2,
  Percent,
  CalendarDays,
  FileCheck,
  ArrowRight,
  Printer,
  Scale,
  Sparkles,
  Download,
  Award,
  Check,
} from "lucide-react";
import { getActiveClaim, updateClaimStatus, getSettlementAgreementPdfUrl } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import { ClaimData } from "@/types/claim";

export default function ResolvePage() {
  const params = useParams();
  const claimId = params?.claimId as string;

  const [claim, setClaim] = useState<ClaimData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"DISCOUNT" | "EMI" | null>(null);
  const [isSettled, setIsSettled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const data = getActiveClaim();
    setClaim(data);
    if (data.status === "SETTLED") {
      setIsSettled(true);
      setSelectedPlan(data.settlement_type === "EMI_PLAN" ? "EMI" : "DISCOUNT");
    }
  }, [claimId]);

  if (!claim) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-slate-400 font-medium">
        Loading Debtor Resolution Portal...
      </div>
    );
  }

  // Calculations for Option A: 5% Prompt Discount on principal, 100% waiver of interest
  const promptDiscountAmount = Math.round(claim.principal_amount * 0.05);
  const discountedTotal = claim.principal_amount - promptDiscountAmount;
  const totalSavings = promptDiscountAmount + claim.accrued_interest;

  // Calculations for Option B: 3-month EMI (Principal + Accrued Interest divided by 3)
  const emiTotal = claim.total_claimable_amount;
  const emiMonthly = Math.round((emiTotal / 3) * 100) / 100;

  const handleConfirmSettlement = () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const type = selectedPlan === "DISCOUNT" ? "LUMP_SUM_DISCOUNT" : "EMI_PLAN";
      const updated = updateClaimStatus(claim.claim_id, "SETTLED", type);
      setClaim(updated);
      setIsSettled(true);
      setIsSubmitting(false);

      // Trigger celebratory confetti burst
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#ff9900", "#3b82f6", "#f59e0b"],
        });
      } catch {
        // Fallback if canvas-confetti is not loaded
      }
    }, 600);
  };

  return (
    <div className="min-h-screen text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Buyer Header Banner */}
        <div className="bg-[#111827]/90 backdrop-blur border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
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

            <div className="text-left sm:text-right bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold block uppercase">Claim Reference</span>
              <span className="text-sm font-mono font-bold text-[#ff9900]">{claim.claim_id}</span>
              <span className="text-xs text-slate-400 block mt-0.5">Inv #{claim.invoice_number}</span>
            </div>
          </div>

          {/* Verified Claim Breakdown Grid */}
          <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 font-medium block">Principal Due</span>
              <span className="text-base font-bold text-white mt-0.5 block">
                {formatINR(claim.principal_amount)}
              </span>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 font-medium block">Statutory Interest (Sec 16)</span>
              <span className="text-base font-bold text-amber-400 mt-0.5 block">
                +{formatINR(claim.accrued_interest)}
              </span>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 font-medium block">Days Overdue</span>
              <span className="text-base font-bold text-rose-400 mt-0.5 block">
                {claim.days_overdue} Days
              </span>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 font-medium block">Total Statutory Claim</span>
              <span className="text-base font-bold text-[#ff9900] mt-0.5 block">
                {formatINR(claim.total_claimable_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* If Settled: Celebratory Card with Digital Conciliation Seal */}
        {isSettled ? (
          <div className="bg-gradient-to-b from-emerald-950/40 via-[#111827] to-[#111827] border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            
            {/* ⭐ Digital Conciliation Seal Badge */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 pointer-events-none">
              <div className="stamp-seal w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-dashed border-amber-400/80 bg-amber-500/10 flex flex-col items-center justify-center text-center p-2 shadow-2xl backdrop-blur-sm">
                <Award className="w-6 h-6 text-amber-400 mb-0.5" />
                <span className="text-[8px] font-black uppercase text-amber-300 tracking-wider">MSMED ACT 2006</span>
                <span className="text-[9px] font-black text-white">CONCILIATION</span>
                <span className="text-[8px] font-mono text-emerald-400 font-bold">CERTIFIED</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Status: SETTLED &amp; DISCHARGED
                  </span>
                  <span className="text-xs text-slate-400">
                    Timestamp: {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white mt-1">
                  Settlement Agreement Executed
                </h3>
                <p className="text-slate-300 text-sm mt-0.5">
                  The dispute for Invoice #{claim.invoice_number} is resolved under statutory conciliation terms.
                </p>
              </div>
            </div>

            {/* Executed Terms Summary Box */}
            <div className="bg-slate-950/90 rounded-2xl p-5 border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
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
                <span className="text-[#ff9900]">DHANSETU-AGR-{claim.claim_id}-2026</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  const url = getSettlementAgreementPdfUrl(claim.claim_id);
                  window.open(url, "_blank");
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Official Agreement Deed (PDF)</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 border border-slate-700 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Agreement</span>
              </button>

              <button
                onClick={() => {
                  setIsSettled(false);
                  setSelectedPlan(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition cursor-pointer"
              >
                Change Selection
              </button>
            </div>
          </div>
        ) : (
          /* Settlement Option Cards Selection Mode */
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Select Resolution Pathway
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
                Executing a digital settlement halts formal Section 18 MSEFC arbitration and secures a full discharge certificate.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Option A Card */}
              <div
                onClick={() => setSelectedPlan("DISCOUNT")}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  selectedPlan === "DISCOUNT"
                    ? "bg-[#111827] border-emerald-500 shadow-xl shadow-emerald-500/10 scale-[1.02]"
                    : "bg-[#111827]/70 border-slate-700/80 hover:border-slate-500 hover:bg-[#111827]"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Percent className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                          Option A
                        </span>
                        <h3 className="text-lg font-black text-white">
                          Immediate Settlement
                        </h3>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedPlan === "DISCOUNT"
                          ? "border-emerald-500 bg-emerald-500 text-slate-950"
                          : "border-slate-600"
                      }`}
                    >
                      {selectedPlan === "DISCOUNT" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Settle within 48 hours to unlock an immediate <strong className="text-white">5% cash discount on principal</strong> and secure <strong className="text-emerald-400">100% waiver of accrued statutory interest</strong>.
                  </p>

                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Full Statutory Amount:</span>
                      <span className="line-through text-slate-500 font-mono">
                        {formatINR(claim.total_claimable_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-medium">
                      <span>Total Savings for Debtor:</span>
                      <span className="font-mono font-bold">-{formatINR(totalSavings)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                      <span className="font-bold text-white">Settlement Payable:</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        {formatINR(discountedTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Full Discharge upon receipt</span>
                  <span className="text-emerald-400 font-semibold">Recommended</span>
                </div>
              </div>

              {/* Option B Card */}
              <div
                onClick={() => setSelectedPlan("EMI")}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  selectedPlan === "EMI"
                    ? "bg-[#111827] border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02]"
                    : "bg-[#111827]/70 border-slate-700/80 hover:border-slate-500 hover:bg-[#111827]"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                          Option B
                        </span>
                        <h3 className="text-lg font-black text-white">
                          3-Month EMI Plan
                        </h3>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedPlan === "EMI"
                          ? "border-blue-500 bg-blue-500 text-slate-950"
                          : "border-slate-600"
                      }`}
                    >
                      {selectedPlan === "EMI" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Protect enterprise working capital by amortizing the total statutory sum across 3 equal monthly installments without litigation.
                  </p>

                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Total Consolidated Debt:</span>
                      <span className="font-mono font-bold text-white">
                        {formatINR(emiTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Installment Schedule:</span>
                      <span className="font-mono">3 Monthly Payments</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                      <span className="font-bold text-white">Monthly Installment:</span>
                      <span className="text-xl font-black text-blue-400 font-mono">
                        {formatINR(emiMonthly)}<span className="text-xs text-slate-400 font-normal"> /mo</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Structured schedule</span>
                  <span className="text-blue-400 font-semibold">Installment Option</span>
                </div>
              </div>

            </div>

            {/* Confirm Settlement Button */}
            <div className="pt-4 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleConfirmSettlement}
                disabled={!selectedPlan || isSubmitting}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-[#ff9900] hover:brightness-110 active:scale-[0.99] disabled:opacity-40 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/20 transition cursor-pointer"
              >
                <FileCheck className="w-5 h-5" />
                <span>
                  {isSubmitting
                    ? "Executing Digital Agreement..."
                    : selectedPlan === "DISCOUNT"
                    ? `Accept Option A & Settle for ${formatINR(discountedTotal)}`
                    : selectedPlan === "EMI"
                    ? `Accept Option B & Authorize ${formatINR(emiMonthly)}/mo Plan`
                    : "Select a Settlement Pathway Above"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                <Scale className="w-3.5 h-3.5 text-[#ff9900]" />
                Binding digital deed executed under Section 18 MSMED Act conciliation mandate.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
