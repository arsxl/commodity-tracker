"use client";

import { motion } from "framer-motion";
import { YIELD_RATES } from "@/lib/types";

interface YieldChartProps {
  initial: number;
  final: number;
  duration: 1 | 3 | 5;
  customRate?: number;
}

export function YieldChart({ initial, final, duration, customRate }: YieldChartProps) {
  const years = Array.from({ length: duration + 1 }, (_, i) => i);
  const rate = customRate !== undefined ? customRate : YIELD_RATES[duration];

  const data = years.map((year) => {
    return initial * Math.pow(1 + rate, year);
  });

  const maxVal = Math.max(...data, 1); // Avoid division by zero

  return (
    <div className="h-full w-full flex items-end justify-between gap-2 pt-8">
      {data.map((val, idx) => {
        const heightPct = (val / maxVal) * 100;
        const isFirst = idx === 0;
        const isLast = idx === data.length - 1;

        return (
          <div key={idx} className="flex flex-col items-center flex-1 gap-2 group">
            <div className="w-full relative flex items-end justify-center h-40 bg-white/5 rounded-t-sm overflow-hidden border border-white/5 shadow-inner">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 0.8, delay: idx * 0.1, ease: "easeOut" }}
                className={`w-full rounded-t-sm relative overflow-hidden ${
                  isLast ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" : isFirst ? "bg-zinc-700" : "bg-emerald-500/30"
                }`}
              >
                {/* Glossy overlay effect for the bars */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/10 pointer-events-none" />
              </motion.div>
            </div>
            <span className="text-xs font-mono font-semibold text-muted-foreground group-hover:text-white transition-colors">
              Yr {idx}
            </span>
          </div>
        );
      })}
    </div>
  );
}
