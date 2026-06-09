"use client";

import { MarketAsset, CONVERSION } from "@/lib/types";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { TrendingUp, TrendingDown, Coins, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";

export function MarketCard({ asset }: { asset: MarketAsset }) {
  const isPositive = asset.price_change_percentage_24h >= 0;

  // CoinGecko free tier sometimes returns sparkline in USD despite vs_currency=aed
  // We check the ratio of current_price (AED) to the last sparkline price to detect this.
  let sparklineMultiplier = 1;
  if (asset.sparkline_in_7d?.price?.length) {
    const lastPrice = asset.sparkline_in_7d.price[asset.sparkline_in_7d.price.length - 1];
    const ratio = asset.current_price / (lastPrice || 1);
    if (ratio > 3.0 && ratio < 4.0) sparklineMultiplier = 3.6725; // USD to AED peg
  }

  // Format Recharts data from sparkline array
  const chartData = asset.sparkline_in_7d?.price.map((p, i) => ({ value: p * sparklineMultiplier, index: i })) || [];

  // Append the exact live price to the end of the sparkline so the graph visually matches the text
  if (chartData.length > 0) {
    chartData.push({ value: asset.current_price, index: chartData.length });
  }

  return (
    <Card className="relative overflow-hidden group border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/80 transition-all duration-500 shadow-sm dark:shadow-none">
      <CardContent className="p-6 relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border border-zinc-100 dark:border-white/5 shadow-inner ${
              asset.isGold || asset.isSilver ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'bg-zinc-100 dark:bg-black/50 text-zinc-600 dark:text-zinc-300'
            }`}>
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{asset.name}</p>
              <p className="text-xl font-bold font-mono tracking-tight">{asset.symbol}</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
            isPositive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
          }`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {formatPercentage(asset.price_change_percentage_24h)}
          </div>
        </div>

        {/* Pricing & Chart */}
        <div className="flex items-end justify-between gap-4 flex-1">
          <div>
            <p className="text-sm text-zinc-500 dark:text-muted-foreground mb-1">Live Price (AED) {asset.isGold || asset.isSilver ? "/oz" : ""}</p>
            <p className="text-3xl font-bold font-mono tracking-tighter text-zinc-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">
              {formatCurrency(asset.current_price, "AED")}
            </p>
            {(asset.isGold || asset.isSilver) && (
              <p className="text-sm font-mono text-emerald-600 dark:text-emerald-500 mt-1">
                {formatCurrency(asset.current_price / CONVERSION.GRAMS_PER_TROY_OUNCE, "AED")} <span className="text-xs text-emerald-600/70 dark:text-emerald-500/70">/g</span>
              </p>
            )}
          </div>
          
          {/* Recharts 7d Sparkline */}
          <div className="h-16 w-32 opacity-70 group-hover:opacity-100 transition-opacity">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <LineChart data={chartData}>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--tooltip-bg, #09090b)', borderColor: 'var(--tooltip-border, #27272a)', fontFamily: 'monospace', fontSize: '10px', padding: '4px', color: 'var(--tooltip-text, #fff)' }}
                    formatter={(value: any) => [formatCurrency(Number(value) || 0, "AED"), ""]}
                    labelFormatter={() => ""}
                    position={{ y: -30 }}
                    cursor={{ stroke: '#a1a1aa', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={isPositive ? "#10b981" : "#ef4444"} 
                    strokeWidth={2} 
                    dot={false}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-muted-foreground animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* Advanced Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-zinc-100 dark:border-white/5">
          <div>
            <p className="text-xs text-zinc-500 dark:text-muted-foreground uppercase tracking-wider mb-1">Market Cap</p>
            <p className="text-sm font-mono font-medium text-zinc-800 dark:text-zinc-300">
              {asset.market_cap ? formatCurrency(asset.market_cap, "AED") : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-muted-foreground uppercase tracking-wider mb-1">24H Volume</p>
            <p className="text-sm font-mono font-medium text-zinc-800 dark:text-zinc-300">
              {asset.total_volume ? formatCurrency(asset.total_volume, "AED") : "N/A"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
