import { fetchMarketData } from "@/lib/api";
import { Dashboard } from "@/components/Dashboard";

export const revalidate = 60; // Revalidate data every 60 seconds

export default async function Home() {
  const assets = await fetchMarketData();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      <Dashboard initialAssets={assets} />
    </div>
  );
}
