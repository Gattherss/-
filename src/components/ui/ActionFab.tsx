"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionFabProps {
    onClick?: () => void;
    className?: string;
}

export function ActionFab({ onClick, className }: ActionFabProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9, y: 2 }}
            onClick={onClick}
            aria-label="Add transaction"
            className={cn(
                "fixed left-1/2 -translate-x-1/2",
                "bottom-[calc(1.75rem+env(safe-area-inset-bottom))]",
                "flex h-16 w-16 items-center justify-center rounded-full",
                "bg-gradient-to-br from-cyan-400 to-white text-black shadow-2xl shadow-cyan-500/20",
                "border-2 border-white/10 backdrop-blur-lg",
                "touch-manipulation", // Improves tap response on mobile
                className
            )}
            style={{
                boxShadow: "0 10px 30px -5px rgba(0, 240, 255, 0.3)"
            }}
        >
            <Plus size={32} strokeWidth={3} />
        </motion.button>
    );
}
