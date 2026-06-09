export type Currency = "USD" | "AED" | "EUR";

export interface MarketAsset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap?: number;
  total_volume?: number;
  circulating_supply?: number;
  sparkline_in_7d?: { price: number[] };
  isGold?: boolean;
  isSilver?: boolean;
}

export interface Transaction {
  id: string;
  type: "BUY" | "SELL";
  assetSymbol: string;
  quantity: number;
  unit: "oz" | "g" | "token";
  priceAED: number; // The price paid or received per unit
  targetPriceAED?: number; // Optional take-profit alert price
  date: string;
}

export const CONVERSION = {
  GRAMS_PER_TROY_OUNCE: 31.1034768,
};
