"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Save, Key } from "lucide-react";

export default function SettingsPage() {
    const router = useRouter();
    const [apiKey, setApiKey] = useState("");
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedKey = localStorage.getItem("deepseek_api_key");
            if (savedKey) setApiKey(savedKey);
        }
    }, []);

    const handleTest = async () => {
        if (!apiKey.trim()) return;

        setTesting(true);
        setTestResult(null);

        try {
            const res = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "deepseek-ai/DeepSeek-V3",
                    messages: [{ role: "user", content: "Hi" }],
                    max_tokens: 5,
                }),
            });

            setTestResult(res.ok ? "success" : "error");
        } catch {
            setTestResult("error");
        } finally {
            setTesting(false);
        }
    };

    const handleSave = () => {
        if (apiKey.trim()) {
            localStorage.setItem("deepseek_api_key", apiKey);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    return (
        <main className="min-h-screen px-4 py-10 pb-32 max-w-md mx-auto">
            <header className="mb-6 flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition"
                    aria-label="返回"
                >
                    <ArrowLeft size={18} />
                </button>
                <h1 className="text-2xl font-bold text-white">设置</h1>
            </header>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-5">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <Key size={18} className="text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="font-bold text-white">DeepSeek API 密钥</h2>
                        <p className="text-xs text-white/50">用于 AI 助手功能</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white font-mono text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
                    />

                    <div className="flex gap-2">
                        <button
                            onClick={handleTest}
                            disabled={testing || !apiKey.trim()}
                            className="flex-1 h-10 rounded-xl bg-white/10 text-white/80 font-medium text-sm hover:bg-white/15 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {testing ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : testResult === "success" ? (
                                <CheckCircle size={16} className="text-green-400" />
                            ) : testResult === "error" ? (
                                <XCircle size={16} className="text-red-400" />
                            ) : null}
                            测试连接
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!apiKey.trim()}
                            className="flex-1 h-10 rounded-xl bg-cyan-500 text-black font-bold text-sm active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saved ? <CheckCircle size={16} /> : <Save size={16} />}
                            {saved ? "已保存" : "保存"}
                        </button>
                    </div>

                    {testResult === "success" && (
                        <div className="text-xs text-green-400 flex items-center gap-1">
                            <CheckCircle size={12} /> API 连接成功
                        </div>
                    )}
                    {testResult === "error" && (
                        <div className="text-xs text-red-400 flex items-center gap-1">
                            <XCircle size={12} /> API 连接失败，请检查密钥
                        </div>
                    )}
                </div>
            </section>

            <p className="text-xs text-white/30 text-center mt-4">
                设置仅保存在本地浏览器中
            </p>
        </main>
    );
}
