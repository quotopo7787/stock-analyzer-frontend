import axiosClient from "./axiosClient";
import type {
  BatchJobRun,
  OpportunitySnapshotStatus,
  RecalculateResponse,
} from "../types/adminSnapshot";

const compactParams = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );

export const adminSnapshotApi = {
  getOpportunitySnapshotStatus: async (
    fromYear = 2023,
    toYear = 2025,
    recentPriceDays = 30
  ): Promise<OpportunitySnapshotStatus> => {
    const response = await axiosClient.get<OpportunitySnapshotStatus>(
      "/api/admin/snapshots/opportunities/status",
      {
        params: compactParams({ fromYear, toYear, recentPriceDays }),
      }
    );

    return response.data;
  },

  getLatestOpportunitySnapshotJob: async (): Promise<BatchJobRun | null> => {
    const response = await axiosClient.get<BatchJobRun | "">("/api/admin/jobs/opportunity-snapshot/latest");
    return response.data === "" ? null : response.data;
  },

  getOpportunitySnapshotJobHistory: async (limit = 20): Promise<BatchJobRun[]> => {
    const response = await axiosClient.get<BatchJobRun[]>("/api/admin/jobs/opportunity-snapshot/history", {
      params: { limit },
    });

    return response.data;
  },

  recalculateOpportunities: async (): Promise<RecalculateResponse> => {
    const response = await axiosClient.post<RecalculateResponse>("/api/admin/recalculate/opportunities");
    return response.data;
  },
};
