"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    isOpen,
    title = "确认操作",
    message,
    confirmText = "确定",
    cancelText = "取消",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={onCancel}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#1A1A1A] border border-white/10 rounded-2xl w-full max-w-xs p-5 shadow-2xl space-y-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle size={20} className="text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white">{title}</h3>
                        </div>

                        <p className="text-sm text-white/70">{message}</p>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onCancel}
                                className="flex-1 h-10 rounded-xl bg-white/10 text-white/80 font-medium text-sm hover:bg-white/15 active:scale-[0.98] transition"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 h-10 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 active:scale-[0.98] transition shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
