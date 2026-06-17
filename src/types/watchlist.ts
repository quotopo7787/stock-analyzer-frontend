export type WatchlistStatus =
  | "WATCHING"
  | "READY_TO_BUY"
  | "HOLDING"
  | "SOLD"
  | "REJECTED";

export interface WatchlistItem {
  id: number;
  stockCode: string;
  companyName?: string;
  industry?: string;
  exchange?: string;
  year?: number;
  targetBuyPrice?: number;
  targetSellPrice?: number;
  reason?: string;
  status: WatchlistStatus;
  hasThesis?: boolean;
  thesisId?: number | null;
  thesisStatus?: string | null;
  thesisStatusLabel?: string | null;
  source?: "THESIS" | "OPPORTUNITIES" | "MANUAL" | string;
  sourceLabel?: string;
  nextReviewDate?: string | null;
  isDueReview?: boolean;
  bullCaseSummary?: string[];
  keyRisksSummary?: string[];
  missingDataSummary?: string[];
  buyConditionsSummary?: string[];
  rejectConditionsSummary?: string[];
  addedAt?: string;
  updatedAt?: string;
}

export interface WatchlistSummary {
  total: number;
  dueReview: number;
  researching: number;
  needMoreData: number;
  watchlist: number;
  rejected: number;
  noThesis: number;
}

export interface WatchlistResponse {
  summary: WatchlistSummary;
  items: WatchlistItem[];
}

export interface WatchlistQuery {
  stockCode?: string;
  year?: number;
  status?: string;
  hasThesis?: boolean;
  dueOnly?: boolean;
  sort?: string;
}

export interface CreateWatchlistItemRequest {
  stockCode: string;
  year?: number;
  source?: "MANUAL" | "OPPORTUNITIES" | "THESIS";
  targetBuyPrice?: number;
  targetSellPrice?: number;
  reason?: string;
}

export interface UpdateWatchlistStatusRequest {
  status: WatchlistStatus;
}
