"use client";

import { useState, useTransition } from "react";
import { Loader2, Upload, Calendar as CalendarIcon, X, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Transaction } from "@/types";
import { updateTransaction } from "@/app/actions";
import { motion, AnimatePresence } from "framer-motion";

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
    // Format as datetime-local (YYYY-MM-DDThh:mm)
    const [date, setDate] = useState(() => {
        const d = new Date(transaction.occurred_at);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    });
    const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<{
        current: number;
        total: number;
        status: 'idle' | 'uploading' | 'success' | 'error';
        errorMessage?: string;
    }>({ current: 0, total: 0, status: 'idle' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isPending) return;

        // Show upload progress if there are files
        if (receiptFiles.length > 0) {
            setUploadProgress({ current: 0, total: receiptFiles.length, status: 'uploading' });
        }

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
            receipt_urls: transaction.receipt_urls ?? (transaction.receipt_url ? [transaction.receipt_url] : [])
        };

        if (onOptimisticUpdate) {
            onOptimisticUpdate(optimisticTx, formData);
            onClose();
            return;
        }

        startTransition(async () => {
            try {
                const res = await updateTransaction(formData);
                if (res?.error) {
                    setUploadProgress({
                        current: 0,
                        total: receiptFiles.length,
                        status: 'error',
                        errorMessage: res.error
                    });
                    // Auto-hide error after 5 seconds
                    setTimeout(() => setUploadProgress({ current: 0, total: 0, status: 'idle' }), 5000);
                } else {
                    if (receiptFiles.length > 0) {
                        setUploadProgress({ current: receiptFiles.length, total: receiptFiles.length, status: 'success' });
                        // Auto-hide success and close dialog after 1 second
                        setTimeout(() => {
                            setUploadProgress({ current: 0, total: 0, status: 'idle' });
                            onClose();
                        }, 1000);
                    } else {
                        onClose();
                    }
                }
            } catch (error: any) {
                setUploadProgress({
                    current: 0,
                    total: receiptFiles.length,
                    status: 'error',
                    errorMessage: error.message || '网络连接失败'
                });
                setTimeout(() => setUploadProgress({ current: 0, total: 0, status: 'idle' }), 5000);
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
                        <label className="text-xs text-white/50 font-mono uppercase tracking-wider">日期和时间</label>
                        <div className="relative">
                            <CalendarIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                            <input
                                type="datetime-local"
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

                    {/* Upload Progress Indicator */}
                    <AnimatePresence>
                        {uploadProgress.status !== 'idle' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mt-2 p-3 rounded-xl border"
                                style={{
                                    backgroundColor: uploadProgress.status === 'success' ? 'rgba(34, 197, 94, 0.1)' :
                                        uploadProgress.status === 'error' ? 'rgba(239, 68, 68, 0.1)' :
                                            'rgba(6, 182, 212, 0.1)',
                                    borderColor: uploadProgress.status === 'success' ? 'rgba(34, 197, 94, 0.3)' :
                                        uploadProgress.status === 'error' ? 'rgba(239, 68, 68, 0.3)' :
                                            'rgba(6, 182, 212, 0.3)'
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    {uploadProgress.status === 'uploading' && (
                                        <>
                                            <Loader2 className="animate-spin text-cyan-400" size={18} />
                                            <span className="text-sm text-white font-mono">
                                                正在上传图片... ({uploadProgress.current}/{uploadProgress.total})
                                            </span>
                                        </>
                                    )}
                                    {uploadProgress.status === 'success' && (
                                        <>
                                            <CheckCircle2 className="text-green-400" size={18} />
                                            <span className="text-sm text-green-400 font-mono">
                                                ✓ 上传成功！({uploadProgress.current}/{uploadProgress.total})
                                            </span>
                                        </>
                                    )}
                                    {uploadProgress.status === 'error' && (
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <XCircle className="text-red-400 flex-shrink-0" size={18} />
                                                <span className="text-sm text-red-400 font-bold">上传失败</span>
                                            </div>
                                            <div className="pl-6 space-y-1">
                                                <p className="text-xs text-red-300">{uploadProgress.errorMessage}</p>
                                                <div className="flex items-start gap-1.5 text-xs text-red-200/80">
                                                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="font-mono mb-1">可能原因：</p>
                                                        <ul className="space-y-0.5 list-disc list-inside text-red-200/60">
                                                            <li>网络连接不稳定</li>
                                                            <li>图片文件过大（建议&lt;5MB）</li>
                                                            <li>存储空间不足</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={isPending || uploadProgress.status === 'uploading'}
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
