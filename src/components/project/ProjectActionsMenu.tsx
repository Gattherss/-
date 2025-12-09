"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type Project } from "@/types";
import { updateProject, deleteProject } from "@/app/actions";
import { MoreVertical, Edit, CheckCircle, Archive, Trash2, Loader2 } from "lucide-react";
import { EditProjectDialog } from "./EditProjectDialog";
import { Fireworks } from "@/components/ui/Fireworks";

interface ProjectActionsMenuProps {
    project: Project;
}

export function ProjectActionsMenu({ project }: ProjectActionsMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showFireworks, setShowFireworks] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleAction = async (action: "complete" | "archive" | "delete" | "active") => {
        setIsOpen(false);

        if (action === "delete") {
            if (!confirm("确定要删除此项目吗？该操作不可恢复，且会删除所有关联的交易记录。")) return;
            startTransition(async () => {
                const res = await deleteProject(project.id);
                if (res?.error) {
                    alert("删除失败: " + res.error);
                } else {
                    router.push("/");
                }
            });
            return;
        }

        let newStatus: string = action;
        let confirmMsg = "";
        let shouldCelebrate = false;
        if (action === "complete") {
            newStatus = "completed";
            confirmMsg = "确定要完结此项目吗？";
            shouldCelebrate = true;
        } else if (action === "archive") {
            newStatus = "archived";
            confirmMsg = "确定要归档此项目吗？";
            shouldCelebrate = true;
        } else {
            newStatus = "active";
            confirmMsg = "确定要将项目恢复至进行中吗？";
        }

        if (!confirm(confirmMsg)) return;

        startTransition(async () => {
            const res = await updateProject(project.id, { status: newStatus } as any);
            if (res?.error) {
                alert("操作失败: " + res.error);
            } else if (shouldCelebrate) {
                setShowFireworks(true);
            }
        });
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full border border-white/10 p-2 text-white/50 hover:bg-white/10 hover:text-white transition"
            >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : <MoreVertical size={16} />}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 z-20 overflow-hidden rounded-xl border border-white/10 bg-[#1A1A1A] shadow-xl">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setShowEditDialog(true);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white text-left"
                        >
                            <Edit size={14} /> 编辑信息
                        </button>

                        {project.status === 'active' ? (
                            <>
                                <button
                                    onClick={() => handleAction("complete")}
                                    className="flex w-full items-center gap-2 px-4 py-3 text-sm text-green-400 hover:bg-green-500/10 text-left border-t border-white/5"
                                >
                                    <CheckCircle size={14} /> 完结项目
                                </button>
                                <button
                                    onClick={() => handleAction("archive")}
                                    className="flex w-full items-center gap-2 px-4 py-3 text-sm text-amber-400 hover:bg-amber-500/10 text-left border-t border-white/5"
                                >
                                    <Archive size={14} /> 归档项目
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => handleAction("active")}
                                className="flex w-full items-center gap-2 px-4 py-3 text-sm text-cyan-400 hover:bg-cyan-500/10 text-left border-t border-white/5"
                            >
                                <CheckCircle size={14} /> 恢复至进行中
                            </button>
                        )}

                        <button
                            onClick={() => handleAction("delete")}
                            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 text-left border-t border-white/5"
                        >
                            <Trash2 size={14} /> 删除项目
                        </button>
                    </div>
                </>
            )}

            <EditProjectDialog
                project={project}
                isOpen={showEditDialog}
                onClose={() => setShowEditDialog(false)}
            />

            <Fireworks
                isActive={showFireworks}
                onComplete={() => setShowFireworks(false)}
                duration={2500}
            />
        </div>
    );
}
