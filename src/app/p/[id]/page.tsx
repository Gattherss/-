import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabase";
import { mapProjectStats } from "@/lib/stats";
import { BurnOrbit } from "@/components/ui/BurnOrbit";
import { CaptureLauncher } from "@/components/capture/CaptureLauncher";
import { type Project, type Database } from "@/types";
import { TransactionList } from "@/components/transaction/TransactionList";
import { ProjectActionsMenu } from "@/components/project/ProjectActionsMenu";
import { BackButton } from "@/components/ui/BackButton";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = supabaseServerClient();

  const [projectRes, transactionsRes] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase.from("transactions").select("*").eq("project_id", id).order("occurred_at", { ascending: false })
  ]);

  const { data: project, error } = projectRes;

  if (error || !project) {
    notFound();
  }

  const projectRow = project as Database["public"]["Tables"]["projects"]["Row"];
  const transactions = (transactionsRes.data as Database["public"]["Tables"]["transactions"]["Row"][] ?? []);

  // --- Optimization: Compute stats locally ---
  const totalSpent = transactions.reduce((acc, tx) => acc + Number(tx.amount), 0);
  const totalBudget = Number(projectRow.total_budget);

  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  const budgetConsumedPct = totalBudget > 0 ? clamp(totalSpent / totalBudget) : 0;

  const now = new Date();
  const start = new Date(projectRow.start_date);
  const end = new Date(projectRow.deadline);

  const totalTimeMs = Math.max(end.getTime() - start.getTime(), 0);
  const elapsedMs = now.getTime() - start.getTime();
  const timeElapsedPct = totalTimeMs === 0 ? 1 : clamp(elapsedMs / totalTimeMs);

  const statsRaw = {
    budget_consumed_pct: budgetConsumedPct,
    time_elapsed_pct: timeElapsedPct,
    total_spent: totalSpent,
    total_budget: totalBudget
  };

  const stats = mapProjectStats(projectRow as Project, statsRaw);

  return (
    <main className="min-h-screen px-4 py-10 pb-32 max-w-2xl mx-auto">
      <header className="mb-0 pt-2 flex flex-col gap-4">
        <BackButton />
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-white/90 truncate">
            {projectRow?.name}
          </h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/p/${id}/export`}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/80 hover:text-white hover:border-white/30 transition"
            >
              导出 CSV
            </Link>
            <ProjectActionsMenu project={projectRow as Project} />
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 mb-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-white/50">
              燃烧轨道
            </p>
            <h1 className="text-3xl font-bold text-white">
              {projectRow.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-white/60">
              <span>预算 {currency.format(stats.totalBudget)}</span>
              <span className="text-white/30">•</span>
              <span>
                截止 {new Date(projectRow.deadline).toLocaleDateString()}
              </span>
            </div>
          </div>
          <BurnOrbit
            budgetPct={stats.budgetConsumedPct}
            timePct={stats.timeElapsedPct}
            size={140}
            strokeWidth={8}
            showLabels
          />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">
              剩余
            </div>
            <div className="text-xl font-mono font-bold text-white">
              {currency.format(stats.budgetRemaining)}
            </div>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">
              进度
            </div>
            <div className="text-xl font-mono font-bold text-white">
              {Math.max(0, Math.round(stats.timeElapsedPct * 100))}%
            </div>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">
              燃烧
            </div>
            <div
              className={`text-xl font-mono font-bold ${stats.budgetConsumedPct <= stats.timeElapsedPct
                ? "text-cyan-400"
                : "text-red-400"
                }`}
            >
              {Math.round(stats.budgetConsumedPct * 100)}%
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <TransactionList
          initialTransactions={transactions}
          projectId={projectRow.id}
        />
      </section>

      <CaptureLauncher projects={[projectRow as Project]} projectId={projectRow.id} />
    </main>
  );
}
