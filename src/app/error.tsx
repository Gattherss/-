"use client";

import { useEffect } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Page Error:", error);
    }, [error]);

    const isNetworkError = error.message?.includes("fetch") ||
        error.message?.includes("network") ||
        error.message?.includes("Failed") ||
        error.message?.includes("找到");

    return (
        <main className="min-h-screen px-4 py-20 flex flex-col items-center justify-center max-w-md mx-auto text-center">
            <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                <WifiOff size={28} className="text-red-400" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
                {isNetworkError ? "网络连接失败" : "出错了"}
            </h1>

            <p className="text-sm text-white/60 mb-8">
                {isNetworkError
                    ? "无法连接到数据库，请检查网络后重试"
                    : error.message || "发生未知错误"
                }
            </p>

            <div className="flex gap-3">
                <button
                    onClick={() => reset()}
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-bold rounded-xl active:scale-95 transition"
                >
                    <RefreshCw size={18} />
                    重试
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
