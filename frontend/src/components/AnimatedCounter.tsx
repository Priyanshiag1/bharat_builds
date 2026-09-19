"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  durationMs?: number;
  isCurrency?: boolean;
}

export default function AnimatedCounter({
  value,
  durationMs = 1200,
  isCurrency = true,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = 0;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (value - startValue) * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [value, durationMs]);

  if (isCurrency) {
    return <span>{formatINR(displayValue)}</span>;
  }

  return <span>{Math.round(displayValue).toLocaleString("en-IN")}</span>;
}
