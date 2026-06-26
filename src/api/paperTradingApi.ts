import axiosClient from "./axiosClient";
import type {
  DailyMonitoringResponse,
  DailyCheckResponse,
  AlphaOverviewResponse,
  AlphaByDecisionItem,
  AlphaTopItem,
  SchedulerStatusResponse,
} from "../types/paperTrading";

const BASE = "/api/admin/paper-trading";

export const paperTradingApi = {
  getDaily: () =>
    axiosClient.get<DailyMonitoringResponse>(`${BASE}/monitoring/daily`).then((r) => r.data),

  getDailyCheck: () =>
    axiosClient.get<DailyCheckResponse>(`${BASE}/monitoring/daily/check`).then((r) => r.data),

  getTrackRecordQuality: () =>
    axiosClient.get<Record<string, unknown>>(`${BASE}/track-record/quality`).then((r) => r.data),

  getAlphaOverview: (sourceType = "ALL", horizonDays = 7) =>
    axiosClient
      .get<AlphaOverviewResponse>(`${BASE}/performance/alpha/overview`, {
        params: { sourceType, horizonDays },
      })
      .then((r) => r.data),

  getAlphaByDecision: (sourceType = "ALL", horizonDays = 7) =>
    axiosClient
      .get<AlphaByDecisionItem[]>(`${BASE}/performance/alpha/by-decision`, {
        params: { sourceType, horizonDays },
      })
      .then((r) => r.data),

  getAlphaTopWinners: (sourceType = "ALL", horizonDays = 7, limit = 5) =>
    axiosClient
      .get<AlphaTopItem[]>(`${BASE}/performance/alpha/top-winners`, {
        params: { sourceType, horizonDays, limit },
      })
      .then((r) => r.data),

  getAlphaTopLosers: (sourceType = "ALL", horizonDays = 7, limit = 5) =>
    axiosClient
      .get<AlphaTopItem[]>(`${BASE}/performance/alpha/top-losers`, {
        params: { sourceType, horizonDays, limit },
      })
      .then((r) => r.data),

  getSchedulerStatus: () =>
    axiosClient.get<SchedulerStatusResponse>(`${BASE}/scheduler/status`).then((r) => r.data),
};
