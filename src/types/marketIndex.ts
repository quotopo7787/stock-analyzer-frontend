export type MarketRegime = "BULL" | "BEAR" | "SIDEWAYS" | "NOT_ENOUGH_DATA" | "BULL_SHORT_TERM" | "BEAR_SHORT_TERM";

export interface MarketRegimeResponse {
  indexCode: string;
  latestClose: number | null;
  latestDate: string | null;
  ma50: number | null;
  ma200: number | null;
  regime: MarketRegime;
  reason: string;
  return7d: number | null;
  return30d: number | null;
  return90d: number | null;
}
