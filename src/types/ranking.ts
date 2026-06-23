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

export type RankingSource = "SNAPSHOT" | "REALTIME" | "UNKNOWN";

export interface RankingMeta {
  source: RankingSource;
  totalElements?: number;
  snapshotGeneratedAt?: string;
}

export interface RankingResult {
  items: RankingItem[];
  meta: RankingMeta;
}

export interface RankingSnapshotStatus {
  fromYear: number;
  toYear: number;
  snapshotCount: number;
  duplicateCount: number;
  latestGeneratedAt?: string | null;
  oldestGeneratedAt?: string | null;
  sourceUpdatedAt?: string | null;
  dataFreshnessStatus: "FRESH" | "STALE" | "UNKNOWN" | string;
  latestJobStatus?: string | null;
  warning?: string | null;
}

export interface RankingSnapshotRefreshResult {
  status: string;
  snapshotCount: number;
  duplicateCount: number;
  durationMs: number;
}
