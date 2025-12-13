"use client";

import { useOptimistic, useTransition } from "react";
import { Transaction } from "@/types";
import { TransactionItem } from "./TransactionItem";
import { deleteTransaction, updateTransaction } from "@/app/actions";

interface TransactionListProps {
    initialTransactions: (Transaction & { signed_receipt_url?: string | null })[];
    projectId: string;
}

type OptimisticAction =
    | { type: "delete"; id: string }
    | { type: "update"; transaction: Transaction };

export function TransactionList({ initialTransactions, projectId }: TransactionListProps) {
    const [isPending, startTransition] = useTransition();
    const [optimisticTransactions, sectionsDispatch] = useOptimistic(
        initialTransactions,
        (state, action: OptimisticAction) => {
            if (action.type === "delete") {
                return state.filter((tx) => tx.id !== action.id);
            }
            if (action.type === "update") {
                return state.map((tx) =>
                    tx.id === action.transaction.id ? { ...tx, ...action.transaction } : tx
                );
            }
            return state;
        }
    );

    // Grouping logic inside component to handle optimistic state
    const grouped = groupTransactionsByDate(optimisticTransactions);

    const handleDelete = async (id: string) => {
        startTransition(async () => {
            sectionsDispatch({ type: "delete", id });
            const res = await deleteTransaction(id, projectId);
            if (res?.error) {
                alert("删除失败: " + res.error);
                // In a real app we might revert the optimistic update here
                // router.refresh(); 
            }
        });
    };

    const handleUpdate = async (updatedTx: Transaction, formData: FormData) => {
        startTransition(async () => {
            // Optimistically update UI
            sectionsDispatch({ type: "update", transaction: updatedTx });
            // Perform actual server update
            const res = await updateTransaction(formData);
            if (res?.error) {
                alert("更新失败，即将刷新页面: " + res.error);
                // In a real app we might revert logic here or router.refresh()
            }
        });
    };

    return (
        <div className="space-y-4">
            {grouped.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
                    还没有交易，去记录第一笔吧。
                </div>
            )}

            {grouped.map((group) => (
                <div
                    key={group.date}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                    <div className="mb-3 flex items-center justify-between text-xs font-mono uppercase tracking-[0.25em] text-white/60">
                        <span>
                            {new Date(group.date).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </span>
                        <span>{group.items.length} 笔记录</span>
                    </div>
                    <div className="space-y-3">
                        {group.items.map((tx) => (
                            <TransactionItem
                                key={tx.id}
                                transaction={tx}
                                projectId={projectId}
                                onOptimisticDelete={handleDelete}
                                onOptimisticUpdate={handleUpdate}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function groupTransactionsByDate(transactions: (Transaction & { signed_receipt_url?: string | null })[]) {
    const groups = new Map<string, typeof transactions>();
    transactions.forEach((tx) => {
        const key = new Date(tx.occurred_at).toISOString().slice(0, 10);
        const bucket = groups.get(key) ?? [];
        bucket.push(tx);
        groups.set(key, bucket);
    });

    return Array.from(groups.entries())
        .map(([date, items]) => ({ date, items }))
        .sort((a, b) => (a.date > b.date ? -1 : 1));
}
