"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent default link navigation if we want custom router behavior, but actually Link is fine.
        // However, for pure back behavior, router.back() is often better than Link to "/" if we want history traversal.
        // User asked for "Return" functionality. Typically "Return" implies up-level (Home).
        // Let's stick to Home Link for stability but add Vibrate.

        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(10);
        }
        router.push("/");
    };

    return (
        <button
            onClick={handleClick}
            className="self-start rounded-full p-2 -ml-2 text-white/50 hover:bg-white/10 hover:text-white transition active:scale-95 flex items-center gap-1 touch-manipulation"
        >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">返回</span>
        </button>
    );
}
