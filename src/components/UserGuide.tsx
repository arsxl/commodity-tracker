"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function UserGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-2 text-sm text-emerald-500 hover:text-emerald-400 font-mono transition-colors bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20 shadow-sm"
      >
        <BookOpen className="w-4 h-4" />
        {isOpen ? "Hide Quick Guide" : "How to use this tracker?"}
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <Card className="mt-4 bg-white dark:bg-black/40 border-zinc-200 dark:border-emerald-500/20 shadow-lg dark:shadow-[0_0_30px_rgba(16,185,129,0.05)] relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/50"></div>
          <CardContent className="p-6 text-sm text-zinc-600 dark:text-zinc-300 space-y-6 leading-relaxed">
            
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-bold text-base border-b border-zinc-100 dark:border-white/5 pb-4">
              <Info className="w-5 h-5" /> Quick Start Guide
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-zinc-900 dark:text-white font-bold tracking-tight">1. Buying Assets (Cost Basis)</h3>
                <p className="text-zinc-500 dark:text-muted-foreground">
                  When you purchase Gold, Silver, or Crypto, log it as a <strong>BUY</strong> transaction. Ensure you select the correct unit (Grams vs Ounces for metals). The system will securely store this data locally and calculate your exact Average Cost Basis.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-zinc-900 dark:text-white font-bold tracking-tight">2. Taking Profits (Selling)</h3>
                <p className="text-zinc-500 dark:text-muted-foreground">
                  When you cash out, log a <strong>SELL</strong> transaction. The Accounting Engine will automatically calculate your cash profit (Realized PNL) based on your historical Average Cost. 
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-zinc-900 dark:text-white font-bold tracking-tight">3. Understanding Your PNL</h3>
                <ul className="list-disc pl-5 text-zinc-500 dark:text-muted-foreground space-y-1">
                  <li><strong className="text-emerald-600 dark:text-emerald-400 font-medium">Unrealized PNL (Paper):</strong> The current profit on assets you are actively holding.</li>
                  <li><strong className="text-blue-600 dark:text-blue-400 font-medium">Realized PNL (Locked):</strong> The hard cash profit you have officially secured from past sales.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-zinc-900 dark:text-white font-bold tracking-tight">4. Target Alerts & Backups</h3>
                <p className="text-zinc-500 dark:text-muted-foreground">
                  Set a <strong className="text-emerald-600 dark:text-emerald-500 font-medium">Target Price</strong> when logging a transaction to get a visual glow when the live market crosses your target. Don't forget to periodically use the <strong>Export</strong> button to download a secure backup of your ledger!
                </p>
              </div>
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  );
}
