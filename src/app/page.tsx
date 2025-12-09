import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabase";
import { getProjectStats } from "./actions";
import { type ProjectStats, type Database } from "@/types";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { CaptureLauncher } from "@/components/capture/CaptureLauncher";
import { mapProjectStats } from "@/lib/stats";
import { Plus, Search, RefreshCw } from "lucide-react";
import { HomeClientWrapper } from "./HomeClientWrapper";
import { ThemeSelector } from "@/components/ui/ThemeSelector";

export default async function Home() {
  const hasSupabaseEnv =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL) &&
    Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY
    );

  if (!hasSupabaseEnv) {
    return (
      <main className="min-h-screen px-4 py-12 pb-32 max-w-md mx-auto relative">
        <header className="mb-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-white/60">
              GrantBurner OS v1.0
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Supabase 未配置
          </h1>
          <p className="text-sm text-white/60">
            请设置 SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY（或 ANON KEY）后再运行。
          </p>
        </header>
      </main>
    );
  }

  const supabase = supabaseServerClient();
  // Fetch active projects (or those without status for migration safety)
  // Note: 'is' filter for null might need explicit "or" syntax if not defaulted.
  // Since we set default, simple 'active' check is mostly sufficient, 
  // but to be safe for existing rows before migration we might want custom query.
  // For now, let's assume valid migration.

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .or("status.eq.active,status.is.null")
    .order("created_at", { ascending: false });

  if (error) {
    // Check for specific "column does not exist" error (Postgres code usually 42703, but Supabase message varies)
    if (error.message.includes("column") && error.message.includes("status") || error.code === "42703") {
      return (
        <main className="min-h-screen px-4 py-12 pb-32 max-w-md mx-auto relative flex flex-col items-center justify-center text-center">
          <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl space-y-4">
            <h2 className="text-xl font-bold text-red-200">需要数据库升级</h2>
            <p className="text-sm text-red-200/70">
              系统检测到数据库缺少 <code>status</code> 字段。请在 Supabase SQL Editor 中运行升级脚本。
            </p>
            <div className="bg-black/30 p-3 rounded-lg text-left overflow-x-auto max-w-[300px]">
              <code className="text-xs text-red-300 font-mono">
                ALTER TABLE public.projects
                ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'completed', 'archived'));
              </code>
            </div>
          </div>
        </main>
      );
    }
    console.warn("Failed to load projects (transient):", error.message);
  }

  const projectList =
    (projects as Database["public"]["Tables"]["projects"]["Row"][]) ?? [];

  const statsEntries = await Promise.all(
    projectList.map(async (project) => {
      try {
        const rawStats = await getProjectStats(project.id);
        return [project.id, mapProjectStats(project, rawStats)] as const;
      } catch (err) {
        console.error("Failed to load stats", err);
        return null;
      }
    })
  );

  const statsById = new Map<string, ProjectStats>(
    statsEntries.filter(
      (entry): entry is readonly [string, ProjectStats] => Boolean(entry)
    )
  );

  return (
    <HomeClientWrapper>
      <main className="min-h-screen px-4 py-12 pb-32 max-w-md mx-auto relative">
        <header className="mb-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-white/60">
              GrantBurner OS v1.0
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              仪表盘
            </h1>
            <div className="flex items-center gap-2">
              <Link
                href="/search"
                className="p-2 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition"
                title="搜索"
              >
                <Search size={16} />
              </Link>
              <ThemeSelector />
              <Link
                href="/dashboard"
                className="rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-xs text-purple-200 hover:bg-purple-500/20 transition"
              >
                看板
              </Link>
              <Link
                href="/ai"
                className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200 hover:bg-cyan-500/20 transition"
              >
                AI 助手
              </Link>
              <Link
                href="/projects/completed"
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50 hover:text-white hover:border-white/30 transition"
              >
                历史项目
              </Link>
              <Link
                href="/projects/new"
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/80 hover:text-white hover:border-white/30 transition flex items-center gap-1"
              >
                <Plus size={12} />
                新建
              </Link>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-4">
          {projectList.map((project) => {
            const stats = statsById.get(project.id);
            if (!stats) return null;
            return (
              <ProjectCard
                key={project.id}
                project={project}
                stats={stats}
                href={`/p/${project.id}`}
              />
            );
          })}
          {projectList.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
              还没有项目，添加后开始记录支出。
            </div>
          )}
        </div>

        <CaptureLauncher projects={projectList} />
      </main>
    </HomeClientWrapper>
  );
}
