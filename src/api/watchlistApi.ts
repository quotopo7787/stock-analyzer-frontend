import axiosClient from "./axiosClient";
import type {
  CreateWatchlistItemRequest,
  UpdateWatchlistStatusRequest,
  WatchlistItem,
  WatchlistQuery,
  WatchlistResponse,
} from "../types/watchlist";

export const watchlistApi = {
  getAll: async (query?: WatchlistQuery): Promise<WatchlistResponse> => {
    const response = await axiosClient.get<WatchlistResponse | WatchlistItem[]>("/api/watchlist", {
      params: query,
    });
    return normalizeWatchlistResponse(response.data);
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

  addFromThesis: async (thesisId: number): Promise<WatchlistItem> => {
    const response = await axiosClient.post<WatchlistItem>(
      `/api/watchlist/from-thesis/${thesisId}`
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

function normalizeWatchlistResponse(data: WatchlistResponse | WatchlistItem[]): WatchlistResponse {
  if (!Array.isArray(data)) {
    return data;
  }

  return {
    summary: {
      total: data.length,
      dueReview: 0,
      researching: 0,
      needMoreData: 0,
      watchlist: 0,
      rejected: data.filter((item) => item.status === "REJECTED").length,
      noThesis: data.length,
    },
    items: data,
  };
}
