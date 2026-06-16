import axiosClient from "./axiosClient";
import type {
  DataQualitySummary,
  PriceSourceMismatch,
  ReferenceCoverage,
} from "../types/dataQuality";

export interface DataQualityQuery {
  exchange?: string;
  fromYear: number;
  toYear: number;
  recentPriceDays: number;
  compareFromDate: string;
  compareToDate: string;
}

const toParams = (query: DataQualityQuery) => ({
  exchange: query.exchange || undefined,
  fromYear: query.fromYear,
  toYear: query.toYear,
  recentPriceDays: query.recentPriceDays,
  compareFromDate: query.compareFromDate,
  compareToDate: query.compareToDate,
});

export const dataQualityApi = {
  getSummary: async (query: DataQualityQuery): Promise<DataQualitySummary> => {
    const response = await axiosClient.get<DataQualitySummary>("/api/data-quality/summary", {
      params: toParams(query),
    });
    return response.data;
  },

  getPriceMismatches: async (
    query: DataQualityQuery,
    limit = 100,
    offset = 0
  ): Promise<PriceSourceMismatch[]> => {
    const response = await axiosClient.get<PriceSourceMismatch[]>(
      "/api/data-quality/price-mismatches",
      {
        params: {
          exchange: query.exchange || undefined,
          fromDate: query.compareFromDate,
          toDate: query.compareToDate,
          limit,
          offset,
        },
      }
    );
    return response.data;
  },

  getReferenceCoverage: async (
    exchange: string,
    type = "ANY_MISSING",
    limit = 100,
    offset = 0
  ): Promise<ReferenceCoverage[]> => {
    const response = await axiosClient.get<ReferenceCoverage[]>(
      "/api/data-quality/reference-coverage",
      {
        params: {
          exchange: exchange || undefined,
          type,
          limit,
          offset,
        },
      }
    );
    return response.data;
  },
};
