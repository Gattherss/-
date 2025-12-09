import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Database } from "@/types";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];

export async function GET() {
    try {
        const supabase = await createSupabaseServerClient();

        // Fetch all active projects
        const { data: projects } = await supabase
            .from("projects")
            .select("*")
            .in("status", ["active", "pending"])
            .order("created_at", { ascending: false });

        const projectList = (projects as ProjectRow[] | null) ?? [];

        // Fetch all transactions
        const { data: transactions } = await supabase
            .from("transactions")
            .select("*")
            .order("occurred_at", { ascending: false })
            .limit(100);

        const txList = (transactions as TransactionRow[] | null) ?? [];

        // Calculate project stats
        const projectStats = projectList.map((project) => {
            const projectTxs = txList.filter((tx) => tx.project_id === project.id);
            const spent = projectTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
            const remaining = project.total_budget - spent;
            const usedPercent = project.total_budget > 0
                ? Math.round((spent / project.total_budget) * 100)
                : 0;

            const now = new Date();
            const deadline = new Date(project.deadline);
            const daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

            return {
                id: project.id,
                name: project.name,
                totalBudget: project.total_budget,
                spent,
                remaining,
                usedPercent,
                startDate: project.start_date,
                deadline: project.deadline,
                daysRemaining,
            };
        });

        // Get recent transactions for context
        const recentTxs = txList.slice(0, 20).map((tx) => ({
            vendor: tx.vendor,
            amount: tx.amount,
            category: tx.category ?? null,
            date: tx.occurred_at,
        }));

        // Calculate totals
        const totalBudget = projectStats.reduce((sum, p) => sum + p.totalBudget, 0);
        const totalSpent = projectStats.reduce((sum, p) => sum + p.spent, 0);
        const totalRemaining = totalBudget - totalSpent;

        // Format data for AI
        const lines: string[] = [];
        lines.push("=== 当前财务数据 ===\n");
        lines.push(`📊 总体预算: ¥${totalBudget.toLocaleString()}`);
        lines.push(`💸 已支出: ¥${totalSpent.toLocaleString()}`);
        lines.push(`💰 剩余: ¥${totalRemaining.toLocaleString()}`);
        lines.push(`📈 使用率: ${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%\n`);

        if (projectStats.length > 0) {
            lines.push("=== 项目明细 ===\n");
            projectStats.forEach((p, i) => {
                lines.push(`${i + 1}. ${p.name}`);
                lines.push(`   - 预算: ¥${p.totalBudget.toLocaleString()}`);
                lines.push(`   - 已用: ¥${p.spent.toLocaleString()} (${p.usedPercent}%)`);
                lines.push(`   - 剩余: ¥${p.remaining.toLocaleString()}`);
                lines.push(`   - 截止: ${p.deadline} (${p.daysRemaining}天后)`);
                lines.push("");
            });
        }

        if (recentTxs.length > 0) {
            lines.push("=== 最近交易 (前10条) ===\n");
            recentTxs.slice(0, 10).forEach((tx) => {
                const date = new Date(tx.date).toLocaleDateString("zh-CN");
                const vendor = tx.vendor || "未命名";
                const category = tx.category ? `[${tx.category}]` : "";
                lines.push(`- ${date}: ${vendor} ${category} ¥${tx.amount.toLocaleString()}`);
            });
        }

        const formatted = lines.join("\n");

        return NextResponse.json({
            success: true,
            data: {
                projects: projectStats,
                recentTransactions: recentTxs,
                totalBudget,
                totalSpent,
                totalRemaining,
            },
            formatted,
        });
    } catch (error) {
        console.error("Failed to load AI data:", error);
        return NextResponse.json(
            { success: false, error: "加载数据失败" },
            { status: 500 }
        );
    }
}
