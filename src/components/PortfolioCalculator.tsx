"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { YIELD_RATES, EXCHANGE_RATE_USD_TO_AED } from "@/lib/types";
import { Calculator, PieChart } from "lucide-react";
import { YieldChart } from "./YieldChart";
import { DonutChart } from "./DonutChart";

export function PortfolioCalculator() {
  const [initialCapital, setInitialCapital] = useState<number>(12000);
  const [duration, setDuration] = useState<1 | 3 | 5>(3);
  
  // Raw allocation points (normalized to 100 later)
  const [allocRaw, setAllocRaw] = useState({ gold: 50, btc: 30, eth: 20 });
  const totalRaw = allocRaw.gold + allocRaw.btc + allocRaw.eth || 1;
  
  const goldPct = (allocRaw.gold / totalRaw) * 100;
  const btcPct = (allocRaw.btc / totalRaw) * 100;
  const ethPct = (allocRaw.eth / totalRaw) * 100;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setInitialCapital(isNaN(val) ? 0 : val);
  };

  // Blended yield rate based on allocation (mock assumptions: Gold=5%, BTC=12%, ETH=8%)
  const blendedYield = ((goldPct * 0.05) + (btcPct * 0.12) + (ethPct * 0.08)) / 100;
  // Apply duration multiplier
  const effectiveYield = blendedYield + (duration > 1 ? (duration * 0.01) : 0);

  const finalValueAED = initialCapital * Math.pow(1 + effectiveYield, duration);
  const finalValueUSD = finalValueAED / EXCHANGE_RATE_USD_TO_AED;

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-white/10 glass-card relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
      
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-emerald-500" />
          <CardTitle className="text-xl">Advanced Asset Builder</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Controls */}
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Deployment (AED)
              </label>
              <Input
                type="number"
                value={initialCapital || ""}
                onChange={handleInputChange}
                className="text-2xl h-14 bg-black/40 shadow-inner"
                placeholder="12000"
              />
            </div>

            {/* Allocation Sliders */}
            <div className="space-y-5 p-5 bg-black/20 rounded-xl border border-white/5">
              <h4 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Target Allocation</h4>
              
              <div className="space-y-4">
                {/* Gold */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-yellow-500 font-bold">XAU</span>
                    <span className="text-muted-foreground">{goldPct.toFixed(1)}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={allocRaw.gold} 
                    onChange={(e) => setAllocRaw(p => ({...p, gold: parseInt(e.target.value)}))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500" />
                </div>
                {/* BTC */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-orange-500 font-bold">BTC</span>
                    <span className="text-muted-foreground">{btcPct.toFixed(1)}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={allocRaw.btc} 
                    onChange={(e) => setAllocRaw(p => ({...p, btc: parseInt(e.target.value)}))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                </div>
                {/* ETH */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-blue-500 font-bold">ETH</span>
                    <span className="text-muted-foreground">{ethPct.toFixed(1)}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={allocRaw.eth} 
                    onChange={(e) => setAllocRaw(p => ({...p, eth: parseInt(e.target.value)}))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Holding Horizon
              </label>
              <div className="flex p-1 bg-black/40 rounded-lg border border-white/5 shadow-inner">
                {[1, 3, 5].map((year) => (
                  <button
                    key={year}
                    onClick={() => setDuration(year as 1 | 3 | 5)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                      duration === year
                        ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    {year} Year{year > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visualization */}
          <div className="bg-black/20 rounded-xl p-6 border border-white/5 flex flex-col min-h-[350px]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Projected Output (AED)</p>
                <p className="text-4xl font-bold font-mono tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                  {formatCurrency(finalValueAED, "AED")}
                </p>
                <p className="text-sm text-emerald-400 font-mono mt-1">Blended Yield: {(effectiveYield * 100).toFixed(2)}% APY</p>
              </div>
              <div className="hidden sm:block">
                <DonutChart goldPct={goldPct} btcPct={btcPct} ethPct={ethPct} />
              </div>
            </div>
            
            <div className="flex-1 mt-auto">
              {/* Note: YieldChart here still accepts static rate lookup, we pass blended rate conceptually by modifying initial */}
              <YieldChart initial={initialCapital} final={finalValueAED} duration={duration} customRate={effectiveYield} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
