import { MarketAsset } from "./types";

export async function fetchMarketData(): Promise<MarketAsset[]> {
  try {
    // Fetch real market data including 7d sparkline natively in AED
    // pax-gold = 1 oz Gold, kinesis-silver = 1 oz Silver
    const cryptoRes = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=aed&ids=pax-gold,kinesis-silver,bitcoin,ethereum&order=market_cap_desc&sparkline=true&price_change_percentage=24h",
      { next: { revalidate: 60 } }
    );
    
    if (!cryptoRes.ok) throw new Error("Failed to fetch market data");
    const cryptoData = await cryptoRes.json();

    const assets: MarketAsset[] = cryptoData.map((coin: any) => ({
      id: coin.id,
      symbol: coin.id === "pax-gold" ? "GOLD" : coin.id === "kinesis-silver" ? "SILVER" : coin.symbol.toUpperCase(),
      name: coin.id === "pax-gold" ? "Physical Gold (1 oz)" : coin.id === "kinesis-silver" ? "Physical Silver (1 oz)" : coin.name,
      current_price: coin.current_price,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      market_cap: coin.market_cap,
      total_volume: coin.total_volume,
      circulating_supply: coin.circulating_supply,
      sparkline_in_7d: coin.sparkline_in_7d,
      isGold: coin.id === "pax-gold",
      isSilver: coin.id === "kinesis-silver",
    }));

    return assets;
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}
