export interface RankingItem {
  rank: number;
  stockCode: string;
  companyName: string;

  fromYear: number;
  toYear: number;
  numberOfYears: number;

  revenueGrowthRate: number;
  profitGrowthRate: number;
  averageRoe: number;
  averageDebtToEquity: number;
  averageCfoToProfit: number;

  qualityScore: number;
  note?: string;
}