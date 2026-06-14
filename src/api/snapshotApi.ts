import axiosClient from "./axiosClient";
import type { CompanySnapshotResponse } from "../types/snapshot";

export const snapshotApi = {
  /**
   * Lấy snapshot tổng hợp của một mã cổ phiếu theo năm.
   *
   * Backend:
   * GET /api/company-snapshots/{stockCode}?year=2025
   */
  getSnapshot: async (
    stockCode: string,
    year: number
  ): Promise<CompanySnapshotResponse> => {
    const response = await axiosClient.get<CompanySnapshotResponse>(
      `/api/company-snapshots/${stockCode}`,
      {
        params: {
          year,
        },
      }
    );

    return response.data;
  },
};