import axiosClient from "./axiosClient";
import type { RankingItem } from "../types/ranking";

export const rankingApi = {
  /**
   * Lấy danh sách xếp hạng doanh nghiệp theo giai đoạn.
   *
   * Backend:
   * GET /api/rankings?fromYear=2023&toYear=2025&page=0&size=20
   *
   * Response hiện tại là mảng RankingItem[], không phải Page object.
   */
  getRankings: async (
    fromYear: number,
    toYear: number,
    page: number,
    size: number
  ): Promise<RankingItem[]> => {
    const response = await axiosClient.get<RankingItem[]>("/api/rankings", {
      params: {
        fromYear,
        toYear,
        page,
        size,
      },
    });

    return response.data;
  },
};