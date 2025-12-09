"use client";

import { RefreshCw, FileQuestion } from "lucide-react";

export default function NotFound() {
    return (
        <main className="min-h-screen px-4 py-20 flex flex-col items-center justify-center max-w-md mx-auto text-center">
            <div className="h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-6">
                <FileQuestion size={28} className="text-amber-400" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
                页面未找到
            </h1>

            <p className="text-sm text-white/60 mb-8">
                可能是网络问题或页面不存在
            </p>

            <div className="flex gap-3">
                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-bold rounded-xl active:scale-95 transition"
                >
                    <RefreshCw size={18} />
                    刷新页面
                </button>
                <button
                    onClick={() => window.location.href = "/"}
                    className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-medium rounded-xl active:scale-95 transition"
                >
                    返回首页
                </button>
            </div>
        </main>
    );
}
