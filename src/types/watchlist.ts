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
  targetBuyPrice?: number;
  targetSellPrice?: number;
  reason?: string;
  status: WatchlistStatus;
  addedAt?: string;
  updatedAt?: string;
}

export interface CreateWatchlistItemRequest {
  stockCode: string;
  targetBuyPrice?: number;
  targetSellPrice?: number;
  reason?: string;
}

export interface UpdateWatchlistStatusRequest {
  status: WatchlistStatus;
}
