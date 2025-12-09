"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Project, ProjectStats } from "@/types";
import { BurnOrbit } from "./BurnOrbit";

interface ProjectCardProps {
  project: Project;
  stats: ProjectStats;
  href?: string;
  onClick?: () => void;
}

export function ProjectCard({ project, stats, href, onClick }: ProjectCardProps) {
  const router = useRouter();
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const remainingBudget =
    stats.budgetRemaining ?? stats.totalBudget - stats.totalSpent;
  const daysLeft = Math.max(0, Math.ceil(stats.daysRemaining));
  const isTimeAhead = stats.timeElapsedPct >= stats.budgetConsumedPct;
  const handleClick = () => {
    if (onClick) return onClick();
    if (href) router.push(href);
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="group relative flex w-full items-center justify-between overflow-hidden rounded-3xl bg-white/5 p-6 border border-white/5 active:bg-white/10 transition-colors"
    >
      <div className="flex flex-col gap-1 z-10">
        <h3 className="text-lg font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
          {project.name}
        </h3>
        <div className="flex flex-col gap-0.5">
          <span
            suppressHydrationWarning
            className="text-3xl font-mono font-bold tracking-tighter text-white"
          >
            {formatter.format(remainingBudget)}
          </span>
          <span className="text-xs text-white/40 font-mono uppercase tracking-widest">
            剩余预算
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs font-mono text-white/60">
          <span className={isTimeAhead ? "text-cyan-400" : "text-red-400"}>
            已用 {Math.round(stats.budgetConsumedPct * 100)}%
          </span>
          <span className="text-white/40">•</span>
          <span>剩余 {daysLeft} 天</span>
        </div>
      </div>

      <div className="z-10">
        <BurnOrbit
          budgetPct={stats.budgetConsumedPct}
          timePct={stats.timeElapsedPct}
          size={80}
          strokeWidth={6}
          showLabels={true}
        />
      </div>

      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl pointer-events-none" />
    </motion.div>
  );
}
