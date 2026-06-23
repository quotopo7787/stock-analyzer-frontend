import axiosClient from "./axiosClient";
import type {
  RankingItem,
  RankingResult,
  RankingSnapshotRefreshResult,
  RankingSnapshotStatus,
  RankingSource,
} from "../types/ranking";

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
  ): Promise<RankingResult> => {
    const response = await axiosClient.get<RankingItem[]>("/api/rankings", {
      params: {
        fromYear,
        toYear,
        page,
        size,
      },
    });

    const rawSource = String(response.headers["x-ranking-source"] ?? "").toUpperCase();
    const source: RankingSource =
      rawSource === "SNAPSHOT" || rawSource === "REALTIME" ? rawSource : "UNKNOWN";
    const parsedTotal = Number(response.headers["x-ranking-total-elements"]);

    return {
      items: response.data ?? [],
      meta: {
        source,
        totalElements: Number.isFinite(parsedTotal) ? parsedTotal : undefined,
        snapshotGeneratedAt:
          response.headers["x-ranking-snapshot-generated-at"] || undefined,
      },
    };
  },

  getSnapshotStatus: async (fromYear: number, toYear: number) => {
    const response = await axiosClient.get<RankingSnapshotStatus>(
      "/api/admin/snapshots/rankings/status",
      { params: { fromYear, toYear } }
    );
    return response.data;
  },

  refreshSnapshot: async (fromYear: number, toYear: number) => {
    const response = await axiosClient.post<RankingSnapshotRefreshResult>(
      "/api/admin/recalculate/rankings",
      undefined,
      { params: { fromYear, toYear } }
    );
    return response.data;
  },
};
