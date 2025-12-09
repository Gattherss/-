"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { NumPad } from "./NumPad";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Check, Loader2, Upload } from "lucide-react";
import { createTransaction } from "@/app/actions";
import { type Project } from "@/types";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface CaptureSheetProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: Project[];
  projectId?: string;
}

export function CaptureSheet({
  isOpen,
  onClose,
  projects = [],
  projectId,
}: CaptureSheetProps) {
  const [amount, setAmount] = useState("0");
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [step, setStep] = useState<"amount" | "success">("amount");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { playCashRegister } = useSoundEffects();

  const defaultProjectId = useMemo(
    () => projectId ?? projects[0]?.id ?? "",
    [projectId, projects]
  );
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProjectId);

  useEffect(() => {
    if (isOpen) {
      setSelectedProjectId(defaultProjectId);
      setError(null);
    }
  }, [defaultProjectId, isOpen]);

  const normalizedAmount =
    amount.endsWith(".") && amount.length > 1
      ? amount.slice(0, -1)
      : amount;

  const handleClose = () => {
    setAmount("0");
    setVendor("");
    setNotes("");
    setCategory("");
    setReceipt(null);
    setStep("amount");
    setError(null);
    onClose();
  };

  const handleSubmit = () => {
    if (projects.length > 0 && !selectedProjectId) {
      setError("请先选择项目");
      return;
    }
    if (!Number(normalizedAmount) || Number(normalizedAmount) <= 0) {
      setError("请输入有效金额");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const payload = new FormData();
        payload.append("projectId", selectedProjectId);
        payload.append("amount", normalizedAmount);
        payload.append("occurredAt", new Date().toISOString());
        payload.append("status", "spent");
        if (vendor) payload.append("vendor", vendor);
        if (notes) payload.append("notes", notes);
        if (category) payload.append("category", category);
        if (receipt) payload.append("receipt", receipt);

        await createTransaction(payload);
        playCashRegister(); // Play success sound
        setStep("success");
        setTimeout(() => handleClose(), 900);
      } catch (err) {
        const message = err instanceof Error ? err.message : "保存失败";
        setError(message);
        setStep("amount");
      }
    });
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={step === "amount" ? "录入支出" : "已保存"}
    >
      <div className="flex flex-col min-h-[520px]">
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
          <AnimatePresence mode="wait">
            {step === "amount" ? (
              <motion.div
                key="amount"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full space-y-4"
              >
                <div className="text-center">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50 font-mono mb-2">
                    金额
                  </div>
                  <div className="text-6xl font-mono font-bold tracking-tighter text-white">
                    <span className="text-white/40">$</span>
                    {normalizedAmount}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {projects.length > 0 ? (
                    <div className="flex items-center gap-3">
                      <label className="text-xs uppercase tracking-[0.2em] text-white/50 font-mono">
                        项目
                      </label>
                      <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="flex-1 rounded-2xl bg-[#1a1a1a] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/60"
                        style={{ colorScheme: "dark" }}
                      >
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="text-xs text-white/50 font-mono">
                      无项目时自动使用「通用账本」
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <label className="text-xs uppercase tracking-[0.2em] text-white/50 font-mono">
                      商家
                    </label>
                    <input
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      placeholder="在哪里消费的？"
                      className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/60"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-xs uppercase tracking-[0.2em] text-white/50 font-mono">
                      备注
                    </label>
                    <input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="添加备注信息..."
                      className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/60"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-xs uppercase tracking-[0.2em] text-white/50 font-mono">
                      分类
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex-1 rounded-2xl bg-[#1a1a1a] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/60"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="">未分类</option>
                      <option value="books">书籍资料</option>
                      <option value="dining">餐饮接待</option>
                      <option value="lecture">专家讲座</option>
                      <option value="conference">会议差旅</option>
                      <option value="stationery">办公文具</option>
                      <option value="printing">印刷复印</option>
                      <option value="research">调研访谈</option>
                      <option value="other">其他</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-xs uppercase tracking-[0.2em] text-white/50 font-mono">
                      收据
                    </label>
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15 active:scale-[0.98] transition"
                      >
                        <Camera size={16} />
                        <span>拍照</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15 active:scale-[0.98] transition"
                      >
                        <Upload size={16} />
                        <span>上传</span>
                      </button>
                      <span className="text-xs text-white/50 truncate max-w-[120px]">
                        {receipt ? receipt.name : "暂无文件"}
                      </span>
                      {/* Camera capture input */}
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) =>
                          setReceipt(e.target.files?.[0] ?? null)
                        }
                      />
                      {/* File upload input (no capture) */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          setReceipt(e.target.files?.[0] ?? null)
                        }
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {error}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-8"
              >
                <div className="h-24 w-24 rounded-full bg-cyan-500 flex items-center justify-center text-black shadow-[0_0_25px_rgba(6,182,212,0.5)]">
                  <Check size={48} strokeWidth={4} />
                </div>
                <h3 className="text-xl font-bold text-white">支出已记录</h3>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step === "amount" && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <NumPad value={amount} onChange={setAmount} />

            <div className="p-4 pt-0 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="w-full h-16 rounded-2xl bg-cyan-500 text-black font-bold text-xl active:scale-[0.98] transition-transform disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_24px_rgba(6,182,212,0.45)] flex items-center justify-center gap-2 touch-manipulation"
              >
                {isPending ? <Loader2 className="animate-spin" size={20} /> : null}
                确认记账
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </BottomSheet>
  );
}
