"use client";

import { useState, useEffect, useRef } from "react";
import { MarketAsset, Transaction, CONVERSION } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Receipt, Plus, Trash2, ArrowUpRight, ArrowDownRight, Download, UploadCloud, Target, LineChart as LineChartIcon, PieChart as PieChartIcon, Briefcase } from "lucide-react";
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";

export function TransactionLedger({ assets }: { assets: MarketAsset[] }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI State
  const [viewMode, setViewMode] = useState<"HISTORY" | "POSITIONS">("POSITIONS");

  // Form State
  const [txType, setTxType] = useState<"BUY" | "SELL">("BUY");
  const [selectedAsset, setSelectedAsset] = useState<string>("GOLD");
  const [qty, setQty] = useState<string>("");
  const [priceAED, setPriceAED] = useState<string>("");
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [unit, setUnit] = useState<"oz" | "g" | "token">("g");

  // Migration for older local storage items without a type
  useEffect(() => {
    const saved = localStorage.getItem("commodity_tracker_ledger");
    if (saved) {
      const parsed = JSON.parse(saved).map((t: any) => ({
        ...t,
        type: t.type || "BUY",
        priceAED: t.priceAED || t.buyPriceAED || 0
      }));
      setTransactions(parsed);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("commodity_tracker_ledger", JSON.stringify(transactions));
  }, [transactions, isLoaded]);

  const handleAssetChange = (sym: string) => {
    setSelectedAsset(sym);
    if (sym === "GOLD" || sym === "SILVER") setUnit("g");
    else setUnit("token");
  };

  const addTransaction = () => {
    if (!qty || !priceAED) return;
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      type: txType,
      assetSymbol: selectedAsset,
      quantity: parseFloat(qty),
      unit: unit,
      priceAED: parseFloat(priceAED),
      targetPriceAED: targetPrice ? parseFloat(targetPrice) : undefined,
      date: new Date().toISOString(),
    };
    // Add to start of array for history view
    setTransactions([newTx, ...transactions]);
    setQty("");
    setPriceAED("");
    setTargetPrice("");
  };

  const removeTx = (id: string) => setTransactions(transactions.filter(t => t.id !== id));

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "portfolio_ledger.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (Array.isArray(imported)) {
          const migrated = imported.map((t: any) => ({
            ...t, type: t.type || "BUY", priceAED: t.priceAED || t.buyPriceAED || 0
          }));
          setTransactions(migrated);
        }
      } catch (err) { alert("Invalid JSON file"); }
    };
    reader.readAsText(file);
  };

  const getLivePriceForUnit = (symbol: string, txUnit: string) => {
    const asset = assets.find(a => a.symbol === symbol);
    if (!asset) return 0;
    if (txUnit === "g") return asset.current_price / CONVERSION.GRAMS_PER_TROY_OUNCE;
    return asset.current_price;
  };

  // --------------------------------------------------------
  // ACCOUNTING ENGINE
  // --------------------------------------------------------
  
  // To calculate average cost basis and realized PNL accurately, 
  // we must process transactions in chronological order (oldest first).
  // Since we push new tx to the top of the array (index 0), chronological is reversed.
  const chronologicalTxs = [...transactions].reverse();

  // Positions map
  const positions: Record<string, {
    qtyOwned: number;
    totalCostBasis: number;
    realizedPnl: number;
    unit: string;
  }> = {};

  chronologicalTxs.forEach(tx => {
    if (!positions[tx.assetSymbol]) {
      positions[tx.assetSymbol] = { qtyOwned: 0, totalCostBasis: 0, realizedPnl: 0, unit: tx.unit };
    }
    
    const pos = positions[tx.assetSymbol];
    
    if (tx.type === "BUY") {
      pos.qtyOwned += tx.quantity;
      pos.totalCostBasis += (tx.quantity * tx.priceAED);
    } else if (tx.type === "SELL") {
      // Calculate Average Cost of the assets we are selling
      const avgCost = pos.qtyOwned > 0 ? (pos.totalCostBasis / pos.qtyOwned) : 0;
      
      // Deduct sold portion from cost basis
      pos.totalCostBasis -= (tx.quantity * avgCost);
      pos.qtyOwned -= tx.quantity;
      
      // Calculate Realized PNL on this specific sale
      const profitOnSale = (tx.priceAED - avgCost) * tx.quantity;
      pos.realizedPnl += profitOnSale;
    }
  });

  let macroTotalInvested = 0;
  let macroTotalLiveValue = 0;
  let macroRealizedPnl = 0;
  let macroUnrealizedPnl = 0;
  const allocationMap: Record<string, number> = {};

  // Build View Data for Positions
  const positionsData = Object.keys(positions).map(symbol => {
    const pos = positions[symbol];
    const livePrice = getLivePriceForUnit(symbol, pos.unit);
    
    const liveValue = pos.qtyOwned * livePrice;
    const avgCostBasis = pos.qtyOwned > 0 ? (pos.totalCostBasis / pos.qtyOwned) : 0;
    const unrealizedPnl = liveValue - pos.totalCostBasis;
    const unrealizedPnlPct = pos.totalCostBasis > 0 ? (unrealizedPnl / pos.totalCostBasis) * 100 : 0;

    // Macro Aggregations
    if (pos.qtyOwned > 0) {
      macroTotalInvested += pos.totalCostBasis;
      macroTotalLiveValue += liveValue;
      macroUnrealizedPnl += unrealizedPnl;
      allocationMap[symbol] = liveValue;
    }
    macroRealizedPnl += pos.realizedPnl;

    return {
      symbol,
      qtyOwned: pos.qtyOwned,
      unit: pos.unit,
      avgCostBasis,
      totalCostBasis: pos.totalCostBasis,
      livePrice,
      liveValue,
      realizedPnl: pos.realizedPnl,
      unrealizedPnl,
      unrealizedPnlPct
    };
  }).filter(p => p.qtyOwned > 0 || p.realizedPnl !== 0); // Hide completely empty positions unless they have historical realized PNL

  // Chart Data: Allocation Donut
  const donutData = Object.entries(allocationMap).filter(([_, val]) => val > 0).map(([key, val]) => ({ name: key, value: val }));
  const COLORS = { "GOLD": "#eab308", "SILVER": "#94a3b8", "BTC": "#f97316", "ETH": "#3b82f6" };

  // Chart Data: Aggregated 7D History
  // Only calculate for currently owned assets
  const aggregatedHistory = [];
  if (transactions.length > 0 && assets.every(a => a.sparkline_in_7d?.price?.length === 168)) {
    for (let i = 0; i < 168; i++) {
      let hourTotalValue = 0;
      Object.keys(positions).forEach(symbol => {
        const pos = positions[symbol];
        if (pos.qtyOwned > 0) {
          const asset = assets.find(a => a.symbol === symbol);
          if (asset?.sparkline_in_7d) {
            // Check if sparkline is returned in USD and convert to AED
            let sparklineMultiplier = 1;
            const lastPrice = asset.sparkline_in_7d.price[asset.sparkline_in_7d.price.length - 1];
            const ratio = asset.current_price / (lastPrice || 1);
            if (ratio > 3.0 && ratio < 4.0) sparklineMultiplier = 3.6725;

            const rawHistorical = asset.sparkline_in_7d.price[i] * sparklineMultiplier;
            const historicalUnitPrice = pos.unit === "g" ? rawHistorical / CONVERSION.GRAMS_PER_TROY_OUNCE : rawHistorical;
            hourTotalValue += (historicalUnitPrice * pos.qtyOwned);
          }
        }
      });
      aggregatedHistory.push({ index: i, value: hourTotalValue });
    }
  }

  if (!isLoaded) return null;

  return (
    <div className="space-y-6">
      
      {/* V6 Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aggregated Macro Chart */}
        <Card className="lg:col-span-2 bg-white dark:bg-black/40 border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm dark:shadow-none">
          <CardHeader className="pb-2 border-b border-zinc-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <LineChartIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              <CardTitle className="text-sm uppercase tracking-widest text-zinc-500 dark:text-muted-foreground">7-Day Macro Net Worth</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[220px]">
            {aggregatedHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <AreaChart data={aggregatedHistory}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--tooltip-bg, #09090b)', borderColor: 'var(--tooltip-border, #27272a)', fontFamily: 'monospace', color: 'var(--tooltip-text, #fff)' }}
                    formatter={(value: any) => [formatCurrency(Number(value) || 0, "AED"), "Portfolio Value"]}
                    labelFormatter={() => ""}
                  />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Add active positions to see history</div>
            )}
          </CardContent>
        </Card>

        {/* Allocation Donut */}
        <Card className="bg-white dark:bg-black/40 border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none">
          <CardHeader className="pb-2 border-b border-zinc-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              <CardTitle className="text-sm uppercase tracking-widest text-zinc-500 dark:text-muted-foreground">Capital Allocation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[220px] flex items-center justify-center relative">
            {donutData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <PieChart>
                    <Pie data={donutData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.name] || "#10b981"} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value) || 0, "AED")} contentStyle={{ backgroundColor: 'var(--tooltip-bg, #09090b)', borderColor: 'var(--tooltip-border, #27272a)', color: 'var(--tooltip-text, #fff)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Total Value</span>
                  <span className="text-lg font-bold font-mono">{formatCurrency(macroTotalLiveValue, "AED").split('.')[0]}</span>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-sm">No allocations</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Advanced PNL Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-black/40 border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none">
          <CardContent className="p-6">
            <p className="text-[10px] md:text-xs text-zinc-500 dark:text-muted-foreground uppercase tracking-widest mb-1">Active Cost Basis</p>
            <p className="text-2xl font-mono font-bold text-zinc-800 dark:text-zinc-300">{formatCurrency(macroTotalInvested, "AED")}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 dark:bg-black/40 border-emerald-200 dark:border-emerald-500/20 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.05)]">
          <CardContent className="p-6">
            <p className="text-[10px] md:text-xs text-emerald-700 dark:text-emerald-500 uppercase tracking-widest mb-1 font-bold">Live Portfolio Value</p>
            <p className="text-2xl font-mono font-bold text-emerald-950 dark:text-white">{formatCurrency(macroTotalLiveValue, "AED")}</p>
          </CardContent>
        </Card>
        <Card className={`border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none ${macroUnrealizedPnl >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <CardContent className="p-6">
            <p className="text-[10px] md:text-xs text-zinc-500 dark:text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-between">
              Unrealized PNL
              <span className="bg-zinc-200 dark:bg-white/10 px-2 py-0.5 rounded text-[10px] text-zinc-700 dark:text-white">Paper</span>
            </p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-mono font-bold ${macroUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {macroUnrealizedPnl >= 0 ? "+" : ""}{formatCurrency(macroUnrealizedPnl, "AED")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none ${macroRealizedPnl >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <CardContent className="p-6">
            <p className="text-[10px] md:text-xs text-zinc-500 dark:text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-between">
              Realized PNL
              <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">Locked</span>
            </p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-mono font-bold ${macroRealizedPnl >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {macroRealizedPnl >= 0 ? "+" : ""}{formatCurrency(macroRealizedPnl, "AED")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounting Engine Ledger */}
      <Card className="border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 shadow-sm dark:shadow-none">
        <CardHeader className="pb-6 border-b border-zinc-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex bg-zinc-100 dark:bg-black/40 p-1 rounded-md border border-zinc-200 dark:border-white/10 shadow-inner overflow-x-auto w-full sm:w-auto">
              <button 
                onClick={() => setViewMode("POSITIONS")} 
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-mono font-bold rounded whitespace-nowrap ${viewMode === "POSITIONS" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-muted-foreground hover:text-zinc-900 dark:hover:text-white"}`}
              >
                <Briefcase className="w-3.5 h-3.5" /> POSITIONS
              </button>
              <button 
                onClick={() => setViewMode("HISTORY")} 
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-mono font-bold rounded whitespace-nowrap ${viewMode === "HISTORY" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-muted-foreground hover:text-zinc-900 dark:hover:text-white"}`}
              >
                <Receipt className="w-3.5 h-3.5" /> HISTORY
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={importData} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 bg-zinc-100 dark:bg-black/40 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-md transition-colors border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-muted-foreground hover:text-zinc-900 dark:hover:text-white">
              <UploadCloud className="w-3 h-3" /> Import
            </button>
            <button onClick={exportData} className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 bg-zinc-100 dark:bg-black/40 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-md transition-colors border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-muted-foreground hover:text-zinc-900 dark:hover:text-white">
              <Download className="w-3 h-3" /> Export
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-8">
          
          {/* Add Transaction Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-4 items-end bg-zinc-50 dark:bg-black/20 p-4 rounded-xl border border-zinc-200 dark:border-white/5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 dark:text-muted-foreground uppercase">Action</label>
              <select value={txType} onChange={(e) => setTxType(e.target.value as any)} className={`w-full h-10 px-3 font-bold rounded-md border-zinc-200 dark:border-white/10 text-sm ${txType === 'BUY' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 dark:text-muted-foreground uppercase">Asset</label>
              <select value={selectedAsset} onChange={(e) => handleAssetChange(e.target.value)} className="w-full h-10 px-3 rounded-md bg-white dark:bg-zinc-800 border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-zinc-100">
                {assets.map(a => <option key={a.symbol} value={a.symbol}>{a.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 dark:text-muted-foreground uppercase">Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value as any)} className="w-full h-10 px-3 rounded-md bg-white dark:bg-zinc-800 border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-zinc-100">
                {selectedAsset === "GOLD" || selectedAsset === "SILVER" ? (
                  <><option value="g">Grams</option><option value="oz">Ounces</option></>
                ) : (<option value="token">Token</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 dark:text-muted-foreground uppercase">Quantity</label>
              <Input type="number" placeholder="0.00" value={qty} onChange={e => setQty(e.target.value)} className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-white/10 font-mono text-zinc-900 dark:text-zinc-100" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 dark:text-muted-foreground uppercase">Price AED</label>
              <Input type="number" placeholder="Cost/Sell price" value={priceAED} onChange={e => setPriceAED(e.target.value)} className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-white/10 font-mono text-zinc-900 dark:text-zinc-100" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-zinc-500 dark:text-muted-foreground uppercase flex items-center gap-1">Target <Target className="w-3 h-3 text-emerald-500"/></label>
              <Input type="number" placeholder="Opt" value={targetPrice} onChange={e => setTargetPrice(e.target.value)} className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-white/10 font-mono text-zinc-900 dark:text-zinc-100" />
            </div>
            <button onClick={addTransaction} className={`w-full text-white font-bold h-10 flex items-center justify-center rounded-md transition-colors ${txType === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}>
              <Plus className="w-4 h-4 mr-2" /> Log
            </button>
          </div>

          {/* Data Tables */}
          <div className="overflow-x-auto">
            {viewMode === "POSITIONS" ? (
              // POSITIONS VIEW
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-zinc-50 dark:bg-black/40 text-zinc-500 dark:text-muted-foreground font-mono border-b border-zinc-200 dark:border-white/5">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg whitespace-nowrap">Asset Position</th>
                    <th className="px-4 py-3 whitespace-nowrap">Total Held</th>
                    <th className="px-4 py-3 whitespace-nowrap">Avg Cost Basis</th>
                    <th className="px-4 py-3 whitespace-nowrap">Live Value</th>
                    <th className="px-4 py-3 whitespace-nowrap">Unrealized PNL</th>
                    <th className="px-4 py-3 rounded-tr-lg whitespace-nowrap">Realized PNL</th>
                  </tr>
                </thead>
                <tbody>
                  {positionsData.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-zinc-500 dark:text-muted-foreground">No active positions.</td></tr>
                  ) : (
                    positionsData.map(pos => (
                      <tr key={pos.symbol} className="border-b border-zinc-100 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4 font-bold text-zinc-900 dark:text-white text-lg">{pos.symbol}</td>
                        <td className="px-4 py-4 font-mono text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          {pos.qtyOwned.toFixed(4)} <span className="text-zinc-500 dark:text-muted-foreground text-xs">{pos.unit}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-mono text-zinc-700 dark:text-zinc-300">{formatCurrency(pos.totalCostBasis, "AED")}</div>
                          {pos.qtyOwned > 0 && <div className="text-xs text-zinc-500 dark:text-muted-foreground font-mono">Avg @{formatCurrency(pos.avgCostBasis, "AED")}/{pos.unit}</div>}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-mono text-zinc-900 dark:text-white font-bold">{formatCurrency(pos.liveValue, "AED")}</div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-500 font-mono">Live @{formatCurrency(pos.livePrice, "AED")}/{pos.unit}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {pos.qtyOwned > 0 ? (
                            <>
                              <div className={`font-mono font-bold ${pos.unrealizedPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                {pos.unrealizedPnl >= 0 ? "+" : ""}{formatCurrency(pos.unrealizedPnl, "AED")}
                              </div>
                              <div className={`text-xs font-bold ${pos.unrealizedPnl >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                                {pos.unrealizedPnl >= 0 ? "+" : ""}{pos.unrealizedPnlPct.toFixed(2)}%
                              </div>
                            </>
                          ) : <span className="text-zinc-400 dark:text-muted-foreground">-</span>}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                           <div className={`font-mono font-bold ${pos.realizedPnl >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                            {pos.realizedPnl >= 0 ? "+" : ""}{formatCurrency(pos.realizedPnl, "AED")}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              // HISTORY RAW LEDGER
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-zinc-50 dark:bg-black/40 text-zinc-500 dark:text-muted-foreground font-mono border-b border-zinc-200 dark:border-white/5">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg whitespace-nowrap">Type / Asset</th>
                    <th className="px-4 py-3 whitespace-nowrap">Quantity</th>
                    <th className="px-4 py-3 whitespace-nowrap">Price Executed</th>
                    <th className="px-4 py-3 whitespace-nowrap">Target</th>
                    <th className="px-4 py-3 whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 rounded-tr-lg"></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-zinc-500 dark:text-muted-foreground">No transactions recorded.</td></tr>
                  ) : (
                    transactions.map(tx => {
                      const livePrice = getLivePriceForUnit(tx.assetSymbol, tx.unit);
                      const hitTarget = tx.targetPriceAED && livePrice >= tx.targetPriceAED;
                      
                      return (
                        <tr key={tx.id} className={`border-b border-zinc-100 dark:border-white/5 transition-colors ${hitTarget ? 'bg-emerald-50 dark:bg-emerald-500/10 shadow-[inset_4px_0_0_0_#10b981]' : 'hover:bg-zinc-50 dark:hover:bg-white/5'}`}>
                          <td className="px-4 py-4 font-bold whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${tx.type === 'BUY' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'}`}>
                                {tx.type}
                              </span>
                              <span className="text-zinc-900 dark:text-white">{tx.assetSymbol}</span>
                            </div>
                            {hitTarget && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1 font-mono block">Target Hit</span>}
                          </td>
                          <td className="px-4 py-4 font-mono whitespace-nowrap text-zinc-700 dark:text-zinc-300">{tx.quantity} <span className="text-zinc-500 dark:text-muted-foreground text-xs">{tx.unit}</span></td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-mono text-zinc-700 dark:text-zinc-300">@{formatCurrency(tx.priceAED, "AED")}/{tx.unit}</div>
                            <div className="text-xs text-zinc-500 dark:text-muted-foreground font-mono">Total: {formatCurrency(tx.quantity * tx.priceAED, "AED")}</div>
                          </td>
                          <td className="px-4 py-4 font-mono text-zinc-500 dark:text-muted-foreground whitespace-nowrap">
                            {tx.targetPriceAED ? formatCurrency(tx.targetPriceAED, "AED") : "-"}
                          </td>
                          <td className="px-4 py-4 text-xs text-zinc-500 dark:text-muted-foreground font-mono whitespace-nowrap">
                            {new Date(tx.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button onClick={() => removeTx(tx.id)} className="text-zinc-400 dark:text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors p-2">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
