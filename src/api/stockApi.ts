import axiosClient from "./axiosClient";
import type { Stock, StockPricePoint } from "../types/stock";

/**
 * Nhóm API liên quan đến cổ phiếu.
 */
export const stockApi = {
  /**
   * Lấy toàn bộ danh sách cổ phiếu.
   *
   * Backend cần có:
   * GET /api/stocks
   */
  getAll: async (): Promise<Stock[]> => {
    const response = await axiosClient.get<Stock[]>("/api/stocks");
    return response.data;
  },

  /**
   * Lấy cổ phiếu theo mã.
   *
   * Backend cần có:
   * GET /api/stocks/{code}
   */
  getByCode: async (code: string): Promise<Stock> => {
    const response = await axiosClient.get<Stock>(`/api/stocks/${code}`);
    return response.data;
  },

  getPriceHistory: async (code: string, days = 365): Promise<StockPricePoint[]> => {
    const response = await axiosClient.get<StockPricePoint[]>(`/api/stock-prices/${code}/history`, {
      params: { days },
    });
    return response.data;
  },
};
