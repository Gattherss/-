"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Loader2, ArrowLeft } from "lucide-react";
import { searchTransactions } from "@/app/actions";
import { Transaction } from "@/types";

export default function SearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Transaction[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSearch = () => {
        if (!query.trim()) return;

        startTransition(async () => {
            const res = await searchTransactions(query);
            if (res.data) {
                setResults(res.data);
            }
            setHasSearched(true);
        });
    };

    const currencyFormatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    return (
        <main className="min-h-screen px-4 py-10 pb-32 max-w-md mx-auto">
            <header className="mb-6 flex items-center gap-3">
                <Link
                    href="/"
                    className="p-2 rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition"
                >
                    <ArrowLeft size={18} />
                </Link>
                <h1 className="text-2xl font-bold text-white">搜索交易</h1>
            </header>

            <div className="flex gap-2 mb-6">
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="搜索商家、备注..."
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    disabled={isPending || !query.trim()}
                    className="h-12 px-5 bg-cyan-500 text-black font-bold rounded-xl disabled:opacity-50 flex items-center gap-2 active:scale-95 transition"
                >
                    {isPending ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                </button>
            </div>

            {hasSearched && (
                <div className="space-y-3">
                    {results.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/50">
                            没有找到相关记录
                        </div>
                    ) : (
                        <>
                            <div className="text-xs text-white/50 font-mono mb-2">
                                找到 {results.length} 条记录
                            </div>
                            {results.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-white font-semibold">
                                            {tx.vendor || "未知商家"}
                                        </span>
                                        <span className="text-white font-mono font-bold">
                                            {currencyFormatter.format(tx.amount)}
                                        </span>
                                    </div>
                                    {tx.notes && (
                                        <p className="text-sm text-white/60 line-clamp-2">{tx.notes}</p>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-white/40">
                                        <span suppressHydrationWarning>
                                            {new Date(tx.occurred_at).toLocaleDateString()}
                                        </span>
                                        {tx.category && (
                                            <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded">
                                                {tx.category}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </main>
    );
}
