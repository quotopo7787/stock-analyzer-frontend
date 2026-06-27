export interface Stock {
  id: number;
  code: string;
  name: string;
  exchange?: string;
  industry?: string;
}

export interface StockPricePoint {
  id: number;
  stockCode: string;
  priceDate: string;
  openPrice?: number | null;
  highPrice?: number | null;
  lowPrice?: number | null;
  closePrice?: number | null;
  volume?: number | null;
  tradingValue?: number | null;
}
