"use client";

import { motion } from "framer-motion";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumPadProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit?: () => void;
  className?: string;
}

export function NumPad({ value, onChange, onSubmit, className }: NumPadProps) {
  const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "DEL"];

  const resolveNext = (current: string, key: string) => {
    if (key === "DEL") {
      const shortened = current.length <= 1 ? "0" : current.slice(0, -1);
      return shortened === "" ? "0" : shortened;
    }

    if (key === ".") {
      if (current.includes(".")) return current;
      return current ? `${current}.` : "0.";
    }

    if (current === "0" && key !== ".") {
      return key;
    }

    const next = `${current}${key}`;
    const [, decimals] = next.split(".");
    if (decimals && decimals.length > 2) {
      return current; // keep at two decimal precision
    }

    return next;
  };

  const handlePress = (k: string) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(5);
    }

    if (k === "DEL") {
      onChange(resolveNext(value, "DEL"));
      return;
    }
    const next = resolveNext(value, k);
    onChange(next);
  };

  return (
    <div className={cn("grid grid-cols-3 gap-3 p-4", className)}>
      {keys.map((k) => {
        const isDel = k === "DEL";
        return (
          <motion.button
            key={k}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePress(k)}
            onDoubleClick={() => {
              if (!isDel && onSubmit) onSubmit();
            }}
            className={cn(
              "h-20 w-full rounded-2xl bg-white/5 text-2xl font-mono font-bold text-white shadow-sm backdrop-blur-md transition-colors active:bg-white/10 flex items-center justify-center select-none touch-manipulation",
              isDel && "text-red-400 bg-red-500/10"
            )}
          >
            {isDel ? <Delete size={28} /> : k}
          </motion.button>
        );
      })}
    </div>
  );
}
