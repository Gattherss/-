import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getProjectStats } from "@/app/actions";
import { type ProjectStats, type Database } from "@/types";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { mapProjectStats } from "@/lib/stats";
import { ArrowLeft } from "lucide-react";

export default async function CompletedProjectsPage() {
    const supabase = await createSupabaseServerClient();
    const { data: projects, error } = await supabase
        .from("projects")
        .select("*")
        .in('status', ['completed', 'archived'])
        .order("created_at", { ascending: false });

    if (error) {
        console.warn("Failed to load completed projects (transient):", error.message);
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
        <main className="min-h-screen px-4 py-12 pb-32 max-w-md mx-auto relative">
            <header className="mb-10 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Link href="/" className="text-white/50 hover:text-white transition flex items-center gap-1 text-sm">
                        <ArrowLeft size={16} /> 返回首页
                    </Link>
                </div>
                <div className="flex items-center justify-between gap-3 mt-4">
                    <h1 className="text-3xl font-bold tracking-tight text-white/90">
                        历史项目
                    </h1>
                </div>
                <p className="text-sm text-white/50">
                    已完结或归档的项目
                </p>
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
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-white/40">
                        <p>还没有历史项目。</p>
                        <p className="text-xs mt-2 text-white/30">在进行中的项目里点击“完结”或“归档”，它们就会出现在这里。</p>
                    </div>
                )}
            </div>
        </main>
    );
}
