import axiosClient from "./axiosClient";
import type {
  OpportunityDetailItem,
  OpportunityQueryParams,
  OpportunityWrappedResponse,
} from "../types/opportunities";

const compactParams = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );

export const opportunitiesApi = {
  getOpportunities: async (
    params: OpportunityQueryParams
  ): Promise<OpportunityWrappedResponse> => {
    const response = await axiosClient.get<OpportunityWrappedResponse>("/api/opportunities", {
      params: compactParams({
        ...params,
        viewMode: "SUMMARY",
        responseMode: "WRAPPED",
      }),
    });

    return response.data;
  },

  getOpportunityDetail: async (
    code: string,
    params: Pick<OpportunityQueryParams, "fromYear" | "toYear">
  ): Promise<OpportunityDetailItem> => {
    const response = await axiosClient.get<OpportunityDetailItem>(`/api/opportunities/${code}`, {
      params: compactParams(params),
    });

    return response.data;
  },
};
