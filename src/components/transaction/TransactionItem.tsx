"use client";

import { useState, useTransition, useEffect } from "react";
import { type Transaction } from "@/types";
import { deleteTransaction, getReceiptUrl } from "@/app/actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EditTransactionDialog } from "./EditTransactionDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Loader2, ChevronDown, ChevronUp, FileText, ImageIcon } from "lucide-react";

interface TransactionItemProps {
    transaction: Transaction & { signed_receipt_url?: string | null };
    projectId: string;
    onOptimisticDelete: (id: string) => void;
    onOptimisticUpdate: (tx: Transaction, formData: FormData) => void;
}

function StatusBadge({ status }: { status: Transaction["status"] }) {
    const palette =
        status === "invoiced"
            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
            : "bg-red-500/15 text-red-200 border-red-500/30";
    return (
        <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-mono uppercase tracking-wide ${palette}`}
        >
            {status}
        </span>
    );
}

export function TransactionItem({
    transaction: tx,
    projectId,
    onOptimisticDelete,
    onOptimisticUpdate
}: TransactionItemProps) {
    const [isPending, startTransition] = useTransition();
    const [isExpanded, setIsExpanded] = useState(false);
    const [signedUrls, setSignedUrls] = useState<string[]>([]);
    const [loadingImages, setLoadingImages] = useState(false);

    // Normalize receipts list
    const receiptPaths = tx.receipt_urls ?? (tx.receipt_url ? [tx.receipt_url] : []);
    const hasReceipt = receiptPaths.length > 0;

    // Lazy load images on expand
    useEffect(() => {
        if (isExpanded && hasReceipt && signedUrls.length === 0 && !loadingImages) {
            setLoadingImages(true);
            Promise.all(receiptPaths.map(path => getReceiptUrl(path)))
                .then((results) => {
                    const validUrls = results.map(r => r.url).filter(Boolean) as string[];
                    setSignedUrls(validUrls);
                })
                .finally(() => setLoadingImages(false));
        }
    }, [isExpanded, hasReceipt, signedUrls.length, loadingImages, receiptPaths]); // eslint-disable-next-line react-hooks/exhaustive-deps

    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const currencyFormatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    });

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = () => {
        setShowDeleteConfirm(false);
        onOptimisticDelete(tx.id);
    };

    return (
        <>
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex flex-col rounded-2xl bg-white/5 border border-white/10 px-4 py-3 transition-all cursor-pointer hover:bg-white/10 ${isPending ? "opacity-50 pointer-events-none" : "opacity-100"}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                                {tx.vendor || "未知商家"}
                            </span>
                            <StatusBadge status={tx.status} />
                            {hasReceipt ? (
                                <span className="flex items-center gap-1 text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 font-mono">
                                    <ImageIcon size={10} /> 有存证 ({receiptPaths.length})
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[10px] bg-white/5 text-white/30 px-1.5 py-0.5 rounded border border-white/10 font-mono">
                                    无凭证
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/50 font-mono">
                            <span suppressHydrationWarning>
                                {new Date(tx.occurred_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                            {(tx.notes) && (
                                <div className="flex gap-1 text-white/30">
                                    <FileText size={10} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                        <div className="text-xl font-mono font-bold text-white">
                            {currencyFormatter.format(tx.amount)}
                        </div>
                        <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronUp size={14} className="text-white/50" /> : <ChevronDown size={14} className="text-white/50" />}
                        </div>
                    </div>
                </div>

                {isExpanded && (
                    <div
                        className="mt-4 pt-4 border-t border-white/10 space-y-4 cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {tx.notes && (
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase tracking-wider text-white/40 font-mono">备注</span>
                                <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed select-text">{tx.notes}</p>
                            </div>
                        )}

                        {hasReceipt && (
                            <div className="space-y-2">
                                <span className="text-[10px] uppercase tracking-wider text-white/40 font-mono">收据凭证 (点击查看大图)</span>

                                <div className={`grid gap-2 ${signedUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    {loadingImages ? (
                                        <div className="h-[100px] flex items-center justify-center bg-white/5 rounded-xl border border-white/10 w-full col-span-full">
                                            <Loader2 size={20} className="animate-spin text-white/30" />
                                        </div>
                                    ) : signedUrls.length > 0 ? (
                                        signedUrls.map((url, idx) => (
                                            <div key={idx} className="rounded-xl overflow-hidden border border-white/10 bg-black/20 relative flex items-center justify-center group aspect-[4/3]">
                                                <a href={url} target="_blank" rel="noopener noreferrer" className="cursor-zoom-in w-full h-full flex items-center justify-center">
                                                    <img
                                                        src={url}
                                                        alt={`Receipt ${idx + 1}`}
                                                        className="w-full h-full object-cover transition group-hover:scale-[1.05]"
                                                    />
                                                </a>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-xs text-white/30">无法加载图片</span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="pt-2 flex justify-end gap-2">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition border border-white/10 flex items-center gap-1.5 active:scale-95"
                            >
                                编辑 / 上传凭证
                            </button>
                            <button
                                onClick={handleDeleteClick}
                                disabled={isPending}
                                className="text-xs text-red-100 hover:text-white bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-lg transition border border-red-500/30 flex items-center gap-1.5 active:scale-95"
                            >
                                {isPending && <Loader2 size={12} className="animate-spin" />}
                                {isPending ? "删除中..." : "删除记录"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isEditing && (
                <EditTransactionDialog
                    transaction={tx}
                    projectId={projectId}
                    onClose={() => setIsEditing(false)}
                />
            )}

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="删除记录"
                message="确定要删除这条记录吗？此操作无法撤销。"
                confirmText="删除"
                cancelText="取消"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </>
    );
}
