"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProject } from "@/app/actions/projects";
import { Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ProjectFormState = { success: boolean; error?: string };
const initialState: ProjectFormState = { success: false, error: "" };

export default function NewProjectPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    ProjectFormState,
    FormData
  >(async (_prev, formData) => await createProject(formData), initialState);

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        router.push("/");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  return (
    <main className="min-h-screen px-4 py-10 pb-32 max-w-xl mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className={`rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 hover:text-white hover:border-white/30 transition ${showSuccess ? "opacity-0 pointer-events-none" : ""
            }`}
        >
          ← 返回
        </Link>
        <span className="text-xs font-mono uppercase tracking-[0.3em] text-white/60">
          新建项目
        </span>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4 min-h-[400px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-8 w-full"
            >
              <div className="h-24 w-24 rounded-full bg-cyan-500 flex items-center justify-center text-black shadow-[0_0_25px_rgba(6,182,212,0.5)]">
                <Check size={48} strokeWidth={4} />
              </div>
              <h3 className="text-xl font-bold text-white">项目已创建</h3>
              <p className="text-sm text-white/50">正在返回首页...</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <form action={formAction} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50 font-mono">
                    名称
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="例如：设备购置专项"
                    className="w-full rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/70"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50 font-mono">
                    总预算（元）
                  </label>
                  <input
                    name="total_budget"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="50000"
                    className="w-full rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/70"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-white/50 font-mono">
                      开始日期
                    </label>
                    <input
                      name="start_date"
                      type="date"
                      className="w-full rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/70"
                      placeholder="不填默认今日"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-white/50 font-mono">
                      截止日期
                    </label>
                    <input
                      name="deadline"
                      type="date"
                      placeholder="不填默认一年后"
                      className="w-full rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/70"
                    />
                  </div>
                </div>

                {state.error ? (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {state.error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full h-12 rounded-2xl bg-cyan-500 text-black font-bold text-base active:scale-[0.98] transition-transform disabled:opacity-60 disabled:pointer-events-none shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
                >
                  {pending ? <Loader2 className="animate-spin" size={18} /> : null}
                  创建项目
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}
