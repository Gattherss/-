"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BurnOrbitProps {
  budgetPct: number; // 0-1
  timePct: number; // 0-1
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabels?: boolean;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function BurnOrbit({
  budgetPct,
  timePct,
  size = 120,
  strokeWidth = 8,
  className,
  showLabels = false,
}: BurnOrbitProps) {
  const burn = clamp(budgetPct);
  const time = clamp(timePct);

  // Green when budget not exceeded, red when overspent
  const isOverspent = burn >= 1.0;
  const glowColor = isOverspent
    ? "var(--color-burn-critical)" // Red when overspent
    : "var(--color-burn-safe)";    // Green when on budget

  const radius = (size - strokeWidth) / 2;
  const circuit = 2 * Math.PI * radius;

  const innerStrokeWidth = strokeWidth * 1.4;
  const innerRadius = (size - strokeWidth * 3) / 2;
  const innerCircuit = 2 * Math.PI * innerRadius;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        "drop-shadow-[0_0_12px_rgba(6,182,212,0.15)]",
        className
      )}
      style={{ width: size, height: size }}
      aria-label="Burn orbit"
    >
      <svg
        width={size}
        height={size}
        className="absolute inset-0 -rotate-90 transform"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-foreground)"
          strokeOpacity={0.08}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          initial={{ strokeDashoffset: circuit }}
          animate={{ strokeDashoffset: circuit * (1 - time) }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={glowColor}
          strokeOpacity={isOverspent ? 0.3 : 0.7}
          strokeWidth={strokeWidth}
          strokeDasharray={circuit}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
        />
      </svg>

      <svg
        width={size}
        height={size}
        className="absolute inset-0 -rotate-90 transform"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          fill="none"
          stroke={glowColor}
          strokeOpacity={0.12}
          strokeWidth={innerStrokeWidth}
        />
        <motion.circle
          initial={{ strokeDashoffset: innerCircuit }}
          animate={{ strokeDashoffset: innerCircuit * (1 - burn) }}
          transition={{ duration: 1, delay: 0.15, ease: "easeOut" }}
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          fill="none"
          stroke={glowColor}
          strokeWidth={innerStrokeWidth}
          strokeDasharray={innerCircuit}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
        />
      </svg>

      {showLabels && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-mono font-bold tracking-tight">
          <span style={{ color: glowColor }}>{Math.round(burn * 100)}%</span>
          <span className="text-white/40 text-[10px]">预算</span>
        </div>
      )}
    </div>
  );
}
