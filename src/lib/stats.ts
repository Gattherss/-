import {
  type Project,
  type ProjectStats,
  type ProjectStatsResponse,
} from "@/types";

export const DAY_MS = 1000 * 60 * 60 * 24;

export function mapProjectStats(
  project: Project,
  raw: ProjectStatsResponse
): ProjectStats {
  const start = new Date(project.start_date);
  const end = new Date(project.deadline);
  const now = new Date();
  const totalBudget = Number(project.total_budget);
  const spent = Number(raw.total_spent);
  const totalDays = Math.max((end.getTime() - start.getTime()) / DAY_MS, 0);
  const elapsedDays = Math.max((now.getTime() - start.getTime()) / DAY_MS, 0);

  return {
    budgetConsumedPct: raw.budget_consumed_pct,
    timeElapsedPct: raw.time_elapsed_pct,
    budgetRemaining: Math.max(totalBudget - spent, 0),
    daysRemaining: Math.max(0, totalDays - elapsedDays),
    totalBudget,
    totalSpent: spent,
  };
}
