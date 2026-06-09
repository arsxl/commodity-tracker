"use client";

import { motion } from "framer-motion";

interface DonutChartProps {
  goldPct: number;
  btcPct: number;
  ethPct: number;
}

export function DonutChart({ goldPct, btcPct, ethPct }: DonutChartProps) {
  // SVG Donut math
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  const goldStroke = (goldPct / 100) * circumference;
  const btcStroke = (btcPct / 100) * circumference;
  const ethStroke = (ethPct / 100) * circumference;

  const goldOffset = 0;
  const btcOffset = -goldStroke;
  const ethOffset = btcOffset - btcStroke;

  return (
    <div className="relative w-48 h-48 flex items-center justify-center drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background Track */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        
        {/* ETH (Blue) */}
        <motion.circle
          cx="50" cy="50" r={radius} fill="none" 
          stroke="#3b82f6" strokeWidth="12"
          strokeDasharray={`${ethStroke} ${circumference}`}
          strokeDashoffset={ethOffset}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${ethStroke} ${circumference}`, strokeDashoffset: ethOffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="transition-all duration-300"
        />
        
        {/* BTC (Orange) */}
        <motion.circle
          cx="50" cy="50" r={radius} fill="none" 
          stroke="#f97316" strokeWidth="12"
          strokeDasharray={`${btcStroke} ${circumference}`}
          strokeDashoffset={btcOffset}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${btcStroke} ${circumference}`, strokeDashoffset: btcOffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="transition-all duration-300"
        />
        
        {/* Gold (Yellow) */}
        <motion.circle
          cx="50" cy="50" r={radius} fill="none" 
          stroke="#eab308" strokeWidth="12"
          strokeDasharray={`${goldStroke} ${circumference}`}
          strokeDashoffset={goldOffset}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${goldStroke} ${circumference}`, strokeDashoffset: goldOffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="transition-all duration-300"
        />
      </svg>
      
      {/* Center Label */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Total</span>
        <span className="text-xl font-bold font-mono">100%</span>
      </div>
    </div>
  );
}
