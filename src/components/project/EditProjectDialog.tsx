"use client";

import { useState, useTransition } from "react";
import { type Project } from "@/types";
import { updateProject } from "@/app/actions";
import { Loader2, X } from "lucide-react";

interface EditProjectDialogProps {
    project: Project;
    isOpen: boolean;
    onClose: () => void;
}

export function EditProjectDialog({ project, isOpen, onClose }: EditProjectDialogProps) {
    const [name, setName] = useState(project.name);
    const [budget, setBudget] = useState(project.total_budget.toString());
    const [start, setStart] = useState(project.start_date);
    const [end, setEnd] = useState(project.deadline);
    const [isPending, startTransition] = useTransition();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await updateProject(project.id, {
                name,
                total_budget: Number(budget),
                start_date: start,
                deadline: end,
            });
            if (res?.error) {
                alert("更新失败: " + res.error);
                return;
            }
            onClose();
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#121212] p-6 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">编辑项目</h2>
                    <button onClick={onClose} className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase text-white/50">项目名称</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase text-white/50">总预算 ($)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase text-white/50">开始日期</label>
                            <input
                                type="date"
                                required
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase text-white/50">截止日期</label>
                            <input
                                type="date"
                                required
                                value={end}
                                onChange={(e) => setEnd(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-black hover:bg-cyan-400 disabled:opacity-50"
                    >
                        {isPending && <Loader2 size={18} className="animate-spin" />}
                        {isPending ? "保存中..." : "保存更改"}
                    </button>
                </form>
            </div>
        </div>
    );
}
