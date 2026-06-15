import axiosClient from "./axiosClient";
import type {
  CreateWatchlistItemRequest,
  UpdateWatchlistStatusRequest,
  WatchlistItem,
} from "../types/watchlist";

export const watchlistApi = {
  getAll: async (): Promise<WatchlistItem[]> => {
    const response = await axiosClient.get<WatchlistItem[]>("/api/watchlist");
    return response.data;
  },

  getByStockCode: async (stockCode: string): Promise<WatchlistItem> => {
    const response = await axiosClient.get<WatchlistItem>(
      `/api/watchlist/${stockCode}`
    );
    return response.data;
  },

  create: async (
    payload: CreateWatchlistItemRequest
  ): Promise<WatchlistItem> => {
    const response = await axiosClient.post<WatchlistItem>(
      "/api/watchlist",
      payload
    );
    return response.data;
  },

  updateStatus: async (
    id: number,
    payload: UpdateWatchlistStatusRequest
  ): Promise<WatchlistItem> => {
    const response = await axiosClient.put<WatchlistItem>(
      `/api/watchlist/${id}/status`,
      payload
    );
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await axiosClient.delete(`/api/watchlist/${id}`);
  },
};
