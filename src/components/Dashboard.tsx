import { MarketAsset } from "@/lib/types";
import { MarketCard } from "./MarketCard";
import { TransactionLedger } from "./TransactionLedger";
import { ThemeToggle } from "./ThemeToggle";
import { UserGuide } from "./UserGuide";

export function Dashboard({ initialAssets }: { initialAssets: MarketAsset[] }) {
  return (
    <main className="flex-1 p-4 sm:p-6 md:p-12 lg:p-24 max-w-7xl mx-auto w-full space-y-8 md:space-y-12">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative">
        <div className="space-y-4 pt-8 md:pt-0 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] tracking-widest uppercase w-fit">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span>Live AED Data Feed</span>
            </div>
            <ThemeToggle />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Digital Asset <span className="text-emerald-600 dark:text-emerald-500 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">Portfolio</span>
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-2xl leading-relaxed mb-4">
            Track real-time valuations, historical performance, and your exact profit & loss natively in AED.
          </p>
          <UserGuide />
        </div>
      </header>

      {/* Market Ticker Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {initialAssets.map((asset) => (
          <MarketCard key={asset.id} asset={asset} />
        ))}
      </section>

      {/* Holdings Ledger */}
      <section>
        <TransactionLedger assets={initialAssets} />
      </section>
    </main>
  );
}
