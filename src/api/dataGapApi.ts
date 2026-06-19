import axiosClient from "./axiosClient";
import type { DataGapReason, ManualShareInfoResult, OpportunityDataGapPage } from "../types/dataGaps";

export const dataGapApi = {
  async getGaps(params: { reason?: DataGapReason | ""; page: number; size: number }) {
    const response = await axiosClient.get<OpportunityDataGapPage>("/api/admin/data-gaps/opportunities", {
      params: { fromYear: 2023, toYear: 2025, ...params, reason: params.reason || undefined },
    });
    return response.data;
  },
  async saveShareInfo(request: { stockCode: string; year: number; sharesOutstanding: number; sourceNote: string }) {
    const response = await axiosClient.post<ManualShareInfoResult>("/api/admin/manual-data/share-info", request);
    return response.data;
  },
};
