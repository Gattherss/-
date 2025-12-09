"use client";

import { useState, useTransition } from "react";
import { Loader2, Upload, Calendar as CalendarIcon, X } from "lucide-react";
import { Transaction } from "@/types";
import { updateTransaction } from "@/app/actions";

interface EditTransactionDialogProps {
    transaction: Transaction;
    projectId: string;
    onClose: () => void;
    onOptimisticUpdate?: (tx: Transaction, formData: FormData) => void;
}

export function EditTransactionDialog({
    transaction,
    projectId,
    onClose,
    onOptimisticUpdate,
}: EditTransactionDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [vendor, setVendor] = useState(transaction.vendor || "");
    const [amount, setAmount] = useState(transaction.amount?.toString() || "");
    const [notes, setNotes] = useState(transaction.notes || "");
    const [date, setDate] = useState(
        new Date(transaction.occurred_at).toISOString().slice(0, 10)
    );
    const [receiptFiles, setReceiptFiles] = useState<File[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isPending) return;

        const formData = new FormData();
        formData.append("id", transaction.id);
        formData.append("projectId", projectId);
        formData.append("vendor", vendor);
        formData.append("amount", amount);
        formData.append("notes", notes);
        formData.append("occurredAt", new Date(date).toISOString());

        receiptFiles.forEach((file) => {
            formData.append("receipt", file);
        });

        // Creating optimistic transaction object
        const optimisticTx: Transaction = {
            ...transaction,
            vendor: vendor || null,
            amount: Number(amount),
            notes: notes || null,
            occurred_at: new Date(date).toISOString(),
            // Optimistic logic: retain existing URLs, we can't show new files instantly easily without object URLs
            // For now, let's just trigger the refresh
            receipt_urls: transaction.receipt_urls ?? (transaction.receipt_url ? [transaction.receipt_url] : [])
        };

        if (onOptimisticUpdate) {
            onOptimisticUpdate(optimisticTx, formData);
            onClose();
            return;
        }

        startTransition(async () => {
            const res = await updateTransaction(formData);
            if (res?.error) {
                alert("更新失败: " + res.error);
            } else {
                onClose();
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-[#1A1A1A] border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 space-y-5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">编辑交易</h2>
                    <button onClick={onClose} className="p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs text-white/50 font-mono uppercase tracking-wider">金额</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-lg">$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 pl-8 text-white font-mono text-lg focus:outline-none focus:border-cyan-500/50 transition"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-white/50 font-mono uppercase tracking-wider">收款方 / 摘要</label>
                        <input
                            type="text"
                            value={vendor}
                            onChange={(e) => setVendor(e.target.value)}
                            placeholder="例如: AWS Server"
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-white/50 font-mono uppercase tracking-wider">日期</label>
                        <div className="relative">
                            <CalendarIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 pl-10 text-white font-mono focus:outline-none focus:border-cyan-500/50 transition"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-white/50 font-mono uppercase tracking-wider">备注 (可选)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition resize-none text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-white/50 font-mono uppercase tracking-wider">凭证 (可选, 可多选)</label>
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => setReceiptFiles(Array.from(e.target.files || []))}
                                className="hidden"
                                id="receipt-upload"
                            />
                            <label
                                htmlFor="receipt-upload"
                                className="flex items-center gap-3 w-full h-12 bg-white/5 border border-white/10 border-dashed rounded-xl px-4 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/30 transition cursor-pointer"
                            >
                                <Upload size={16} />
                                <span className="text-sm truncate">
                                    {receiptFiles.length > 0
                                        ? `已选择 ${receiptFiles.length} 张新图片`
                                        : (transaction.receipt_urls?.length
                                            ? `已有 ${transaction.receipt_urls.length} 张凭证 (上传将追加)`
                                            : (transaction.receipt_url ? "已有 1 张凭证 (上传将追加)" : "点击上传图片 (支持多选)")
                                        )
                                    }
                                </span>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full h-12 mt-2 bg-white text-black font-bold rounded-xl active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                        {isPending ? <Loader2 className="animate-spin" size={18} /> : null}
                        {isPending ? "保存中..." : "保存修改"}
                    </button>
                </form>
            </div>
        </div>
    );
}
