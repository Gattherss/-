"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getDashboardData } from "@/app/actions";
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from "recharts";

const CATEGORY_LABELS: Record<string, string> = {
    books: "书籍资料",
    dining: "餐饮接待",
    lecture: "专家讲座",
    conference: "会议差旅",
    stationery: "办公文具",
    printing: "印刷复印",
    research: "调研访谈",
    other: "其他",
    uncategorized: "未分类",
};

const COLORS = ["#06b6d4", "#f59e0b", "#8b5cf6", "#22c55e", "#ef4444", "#ec4899", "#64748b"];

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        categoryData: { name: string; value: number }[];
        monthlyData: { month: string; amount: number }[];
        totalSpent: number;
    } | null>(null);

    useEffect(() => {
        getDashboardData().then((res) => {
            if (res.data) {
                setData(res.data);
            }
            setLoading(false);
        });
    }, []);

    return (
        <main className="min-h-screen px-4 py-10 pb-32 max-w-md mx-auto">
            <header className="mb-6 flex items-center gap-3">
                <Link
                    href="/"
                    className="p-2 rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition"
                >
                    <ArrowLeft size={18} />
                </Link>
                <h1 className="text-2xl font-bold text-white">数据看板</h1>
            </header>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 size={32} className="animate-spin text-white/30" />
                </div>
            ) : data ? (
                <div className="space-y-8">
                    {/* Summary */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="text-xs uppercase tracking-wider text-white/50 font-mono mb-1">总支出</div>
                        <div className="text-3xl font-bold font-mono text-white">
                            ${data.totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    {/* Category Pie Chart */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <h2 className="text-sm font-bold text-white mb-4">按分类</h2>
                        {data.categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={data.categoryData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={70}
                                        dataKey="value"
                                        label={({ name, percent }) => `${CATEGORY_LABELS[name as string] || name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {data.categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-white/50 py-8">暂无分类数据</div>
                        )}
                    </div>

                    {/* Monthly Bar Chart */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <h2 className="text-sm font-bold text-white mb-4">月度趋势</h2>
                        {data.monthlyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={data.monthlyData}>
                                    <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                                        labelStyle={{ color: "#fff" }}
                                        itemStyle={{ color: "#06b6d4" }}
                                    />
                                    <Bar dataKey="amount" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-white/50 py-8">暂无月度数据</div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center text-white/50 py-12">加载失败</div>
            )}
        </main>
    );
}
