"use client";

import { useEffect, useState } from "react";
import { FileSearch, Calculator, Brain, ShieldAlert } from "lucide-react";

interface LoadingOverlayProps {
  isOpen: boolean;
  onComplete?: () => void;
}

const steps = [
  {
    title: "Running Textract OCR...",
    desc: "Ingesting Invoice PDF & validating GSTIN credentials with Amazon Textract",
    icon: FileSearch,
    color: "text-blue-400",
  },
  {
    title: "Calculating Section 16 Interest...",
    desc: "Computing 3x RBI compounding penalty from 45-day statutory milestone",
    icon: Calculator,
    color: "text-[#ff9900]",
  },
  {
    title: "Querying Bedrock Legal Counsel...",
    desc: "Anthropic Claude analyzing buyer stalling patterns & drafting dual notices",
    icon: Brain,
    color: "text-emerald-400",
  },
];

export default function LoadingOverlay({ isOpen, onComplete }: LoadingOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setProgress(15);
      return;
    }

    const t1 = setTimeout(() => {
      setCurrentStepIndex(1);
      setProgress(55);
    }, 1100);

    const t2 = setTimeout(() => {
      setCurrentStepIndex(2);
      setProgress(90);
    }, 2200);

    const t3 = setTimeout(() => {
      setProgress(100);
      if (onComplete) onComplete();
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];
  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl max-w-lg w-full p-8 shadow-2xl relative overflow-hidden text-center">
        {/* Glowing top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-[#ff9900] to-emerald-500 animate-pulse" />

        {/* Animated Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700/60 flex items-center justify-center mb-6 shadow-inner relative">
          <div className="absolute inset-0 rounded-2xl bg-[#ff9900]/10 animate-ping opacity-30" />
          <Icon className={`w-10 h-10 ${currentStep.color} animate-pulse`} />
        </div>

        {/* Rotating Headline */}
        <h3 className="text-2xl font-black text-white tracking-tight mb-2 min-h-[36px] transition-all">
          {currentStep.title}
        </h3>

        {/* Dynamic subtext */}
        <p className="text-sm text-slate-300 mb-8 min-h-[44px] transition-all">
          {currentStep.desc}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-2.5 mb-6 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-[#ff9900] to-amber-400 h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 3 Step Pills */}
        <div className="grid grid-cols-3 gap-2 text-left">
          {steps.map((step, idx) => {
            const isDone = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;
            return (
              <div
                key={step.title}
                className={`p-2.5 rounded-lg border text-xs transition-all ${
                  isCurrent
                    ? "bg-slate-800/90 border-[#ff9900]/50 text-white shadow-sm"
                    : isDone
                    ? "bg-slate-900/60 border-emerald-500/30 text-emerald-400"
                    : "bg-slate-900/30 border-slate-800 text-slate-500"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-slate-800">
                    {isDone ? "✓" : idx + 1}
                  </span>
                  <span className="truncate">Stage {idx + 1}</span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-500 mt-6 flex items-center justify-center gap-1.5 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          Auditing statutory parameters under Section 15 & 16, MSMED Act 2006
        </p>
      </div>
    </div>
  );
}
