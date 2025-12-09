"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Clock, Search } from "lucide-react";
import Link from "next/link";
import { BurnOrbit } from "@/components/ui/BurnOrbit";

// Dummy Data (legacy preview)
const PROJECT = {
  id: "1",
  name: "NSF Grant 2024",
  budgetTotal: 50000,
  budgetSpent: 12000,
  startDate: "2024-01-01",
  deadline: "2024-12-31",
  currency: "USD",
};

const TRANSACTIONS = [
  {
    id: "t1",
    amount: 120.5,
    date: "2024-03-10",
    description: "Lab Supplies",
    tag: "#Lab",
  },
  {
    id: "t2",
    amount: 450.0,
    date: "2024-03-08",
    description: "Conference Reg",
    tag: "#Travel",
  },
  { id: "t3", amount: 12.99, date: "2024-03-05", description: "Coffee", tag: "#Food" },
  { id: "t4", amount: 1200.0, date: "2024-02-20", description: "Laptop", tag: "#Equipment" },
  { id: "t5", amount: 89.0, date: "2024-02-15", description: "Books", tag: "#Edu" },
];

export default function ProjectPage() {
  const budgetPct = PROJECT.budgetSpent / PROJECT.budgetTotal;
  const timePct = 70 / 365;

  return (
    <main className="min-h-screen bg-black px-4 py-8 pb-32 max-w-md mx-auto">
      {/* Navbar */}
      <header className="flex items-center justify-between mb-8 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-4 px-4 border-b border-white/5">
        <Link href="/" className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-white active:bg-white/10">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold text-white">{PROJECT.name}</h1>
        <button className="h-10 w-10 flex items-center justify-center rounded-full bg-transparent text-white/60">
          <Search size={20} />
        </button>
      </header>

      {/* Burn Status Header */}
      <div className="flex flex-col items-center mb-8">
        <BurnOrbit budgetPct={budgetPct} timePct={timePct} size={160} strokeWidth={12} showLabels />
        <div className="mt-6 text-center">
          <div className="text-3xl font-mono font-bold text-white">$12,000</div>
          <div className="text-xs uppercase tracking-widest text-white/50 mb-1">已花费 / $50,000</div>
        </div>
      </div>

      {/* Evidence Locker Feed */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-cyan-500" />
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-500">最近流水</span>
        </div>

        <div className="space-y-4">
          {TRANSACTIONS.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex justify-between items-start py-4 border-b border-white/5 last:border-0"
            >
              <div className="flex gap-4">
                {/* Thumbnail Stub */}
                <div className="h-12 w-12 rounded-lg bg-white/10 flex-none" />
                <div>
                  <div className="font-medium text-white">{tx.description}</div>
                  <div className="text-xs text-white/50 font-mono mt-1">
                    {tx.date} • {tx.tag}
                  </div>
                </div>
              </div>
              <div className="font-mono font-bold text-white">-${tx.amount.toFixed(2)}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
