"use client";

import { useEffect, useState } from "react";

interface CircularGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function CircularGauge({
  score,
  size = 180,
  strokeWidth = 14,
}: CircularGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 150);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Determine color based on threshold (> 75 Emerald Green, 50-75 Amber, < 50 Red)
  let colorClass = "text-emerald-500";
  let strokeColor = "#10b981";
  let glowColor = "rgba(16, 185, 129, 0.25)";
  let statusText = "Strong Legal Standing";
  let statusBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";

  if (score < 50) {
    colorClass = "text-rose-500";
    strokeColor = "#ef4444";
    glowColor = "rgba(239, 68, 68, 0.25)";
    statusText = "Evidentiary Gaps Detected";
    statusBadge = "bg-rose-500/10 text-rose-400 border-rose-500/30";
  } else if (score <= 75) {
    colorClass = "text-amber-500";
    strokeColor = "#f59e0b";
    glowColor = "rgba(245, 158, 11, 0.25)";
    statusText = "Negotiate Structured Plan";
    statusBadge = "bg-amber-500/10 text-amber-400 border-amber-500/30";
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          style={{ filter: `drop-shadow(0 0 12px ${glowColor})` }}
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {animatedScore}
            <span className="text-sm font-medium text-slate-400">/100</span>
          </span>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mt-0.5">
            Claim Strength
          </span>
        </div>
      </div>

      <div className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge}`}>
        {statusText}
      </div>
    </div>
  );
}
