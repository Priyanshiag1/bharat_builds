"use client";

import { useEffect, useState } from "react";
import { FileSearch, Calculator, Brain, Flame, CheckCircle2, ShieldCheck } from "lucide-react";

interface LoadingOverlayProps {
  isOpen: boolean;
  onComplete?: () => void;
}

const auditSteps = [
  {
    stepNumber: "01",
    title: "Scanning Invoice via Amazon Textract OCR",
    desc: "Extracting GSTINs, credit terms & validating delivery date with AWS Trade Vault",
    icon: FileSearch,
    tag: "AWS Textract",
    tagColor: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  },
  {
    stepNumber: "02",
    title: "Evaluating MSMED Act Section 15 Compliance",
    desc: "Cross-referencing 45-day statutory cap & verifying Delivery Challan (POD) signature",
    icon: Calculator,
    tag: "Sec 15 Audit",
    tagColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
  {
    stepNumber: "03",
    title: "Bedrock Claude 3 Haiku Stalling Analysis",
    desc: "Analyzing debtor excuse pattern & validating statutory 15-day defect dispute window",
    icon: Brain,
    tag: "AWS Bedrock",
    tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
  {
    stepNumber: "04",
    title: "Computing Section 43B(h) Tax Disallowance",
    desc: "Flagging 30% corporate income tax penalty (₹75,000) & Section 16 compounding interest",
    icon: Flame,
    tag: "Finance Act 2023",
    tagColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  },
];

export default function LoadingOverlay({ isOpen, onComplete }: LoadingOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setProgress(10);
      return;
    }

    const t1 = setTimeout(() => {
      setCurrentStepIndex(1);
      setProgress(35);
    }, 800);

    const t2 = setTimeout(() => {
      setCurrentStepIndex(2);
      setProgress(65);
    }, 1600);

    const t3 = setTimeout(() => {
      setCurrentStepIndex(3);
      setProgress(90);
    }, 2400);

    const t4 = setTimeout(() => {
      setProgress(100);
      if (onComplete) onComplete();
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  const activeStep = auditSteps[currentStepIndex];
  const Icon = activeStep.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080c14]/90 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glowing top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-[#ff9900] via-emerald-500 to-purple-500 animate-pulse" />

        {/* Header Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              DhanSetu AI Statutory Legal Audit HUD
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-[#ff9900]">
            {progress}% COMPLETE
          </span>
        </div>

        {/* Center Animated Radar */}
        <div className="my-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700/60 flex items-center justify-center mb-4 relative shadow-inner">
            <div className="absolute inset-0 rounded-2xl bg-[#ff9900]/10 animate-ping opacity-25" />
            <Icon className="w-10 h-10 text-[#ff9900] animate-pulse" />
          </div>

          <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border mb-2 ${activeStep.tagColor}`}>
            {activeStep.tag}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {activeStep.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
            {activeStep.desc}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-2 mb-6 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-blue-500 via-[#ff9900] to-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 4 Phased Checkpoints */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
          {auditSteps.map((step, idx) => {
            const isDone = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;
            return (
              <div
                key={step.stepNumber}
                className={`p-2.5 rounded-xl border text-xs transition-all ${
                  isCurrent
                    ? "bg-slate-800/90 border-[#ff9900]/50 text-white shadow-sm ring-1 ring-[#ff9900]/30"
                    : isDone
                    ? "bg-slate-900/60 border-emerald-500/30 text-emerald-400"
                    : "bg-slate-950/40 border-slate-800/60 text-slate-500"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] bg-slate-800 font-mono text-slate-400">
                      {idx + 1}
                    </span>
                  )}
                  <span className="truncate text-[11px]">Step {step.stepNumber}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                  {step.tag}
                </div>
              </div>
            );
          })}
        </div>

        {/* Statutory rule footer */}
        <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>MSMED Act 2006 (Sec 15 &amp; 16) • Finance Act 2023 (Sec 43B(h))</span>
        </div>
      </div>
    </div>
  );
}
