"use client";

import { useState, useEffect } from "react";
import { Palette } from "lucide-react";

const THEMES = [
    { id: "dark", name: "深黑", color: "#000000" },
    { id: "light", name: "亮白", color: "#f8fafc" },
    { id: "warm", name: "暖棕", color: "#1a1410" },
    { id: "blue", name: "深蓝", color: "#0c1222" },
] as const;

type ThemeId = typeof THEMES[number]["id"];

export function ThemeSelector() {
    const [theme, setTheme] = useState<ThemeId>("dark");
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("theme") as ThemeId | null;
        if (saved && THEMES.some((t) => t.id === saved)) {
            setTheme(saved);
            document.documentElement.setAttribute("data-theme", saved);
        }
    }, []);

    const handleSelect = (id: ThemeId) => {
        setTheme(id);
        document.documentElement.setAttribute("data-theme", id);
        localStorage.setItem("theme", id);
        setOpen(false);
    };

    const current = THEMES.find((t) => t.id === theme);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="p-2 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition flex items-center gap-1"
                title="切换主题"
            >
                <Palette size={16} />
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 z-50 rounded-xl border border-white/10 bg-[#1a1a1a] shadow-xl overflow-hidden min-w-[120px]">
                        {THEMES.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => handleSelect(t.id)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/10 transition ${theme === t.id ? "bg-white/5" : ""
                                    }`}
                            >
                                <div
                                    className="h-4 w-4 rounded-full border border-white/20"
                                    style={{ backgroundColor: t.color }}
                                />
                                <span className="text-white/90">{t.name}</span>
                                {theme === t.id && (
                                    <span className="ml-auto text-cyan-400 text-xs">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
