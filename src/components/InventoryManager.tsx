"use client";

import { useState } from "react";
import { MarketAsset, InventoryHoldings } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Wallet, Scale } from "lucide-react";

export function InventoryManager({ assets }: { assets: MarketAsset[] }) {
  const [inventory, setInventory] = useState<Record<string, number>>({
    "GOLD": 0,
    "SILVER": 0,
    "BTC": 0,
    "ETH": 0,
  });

  const handleUpdate = (symbol: string, value: string) => {
    const parsed = parseFloat(value);
    setInventory(prev => ({
      ...prev,
      [symbol]: isNaN(parsed) ? 0 : parsed,
    }));
  };

  // Calculate Net Worth
  let totalNetWorthAED = 0;
  
  const assetBreakdown = assets.map(asset => {
    const amount = inventory[asset.symbol] || 0;
    const valueAED = amount * asset.current_price;
    totalNetWorthAED += valueAED;
    return { ...asset, amount, valueAED };
  });

  return (
    <Card className="border-white/10 glass-card bg-zinc-900/40">
      <CardHeader className="pb-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-500" />
          <CardTitle className="text-xl">True Inventory Tracker</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Input Section */}
          <div className="lg:col-span-7 space-y-6">
            <h4 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
              <Scale className="w-4 h-4" /> Physical & Digital Balances
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {assetBreakdown.map((item) => (
                <div key={item.id} className="space-y-2 p-4 bg-black/20 rounded-lg border border-white/5">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-white">{item.symbol}</label>
                    <span className="text-xs font-mono text-muted-foreground">{formatCurrency(item.current_price, "AED")}</span>
                  </div>
                  <Input
                    type="number"
                    value={inventory[item.symbol] || ""}
                    onChange={(e) => handleUpdate(item.symbol, e.target.value)}
                    placeholder="0.00"
                    className="font-mono bg-black/40 border-white/5 focus-visible:ring-emerald-500/30"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Output / Net Worth Section */}
          <div className="lg:col-span-5 bg-black/30 rounded-xl p-8 border border-white/5 flex flex-col justify-center items-center text-center shadow-inner">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Total Portfolio Value</p>
            <p className="text-5xl md:text-6xl font-bold font-mono tracking-tighter text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              {formatCurrency(totalNetWorthAED, "AED")}
            </p>
            
            {totalNetWorthAED > 0 && (
              <div className="mt-8 w-full space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 text-left">Allocation Breakdown</p>
                {assetBreakdown.map(item => {
                  if (item.valueAED <= 0) return null;
                  const pct = (item.valueAED / totalNetWorthAED) * 100;
                  return (
                    <div key={item.id} className="w-full">
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-zinc-300">{item.symbol}</span>
                        <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${item.isGold || item.isSilver ? 'bg-yellow-500' : 'bg-blue-500'}`} 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
}
