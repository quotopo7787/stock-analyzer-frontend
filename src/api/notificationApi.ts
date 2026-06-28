import axiosClient from "./axiosClient";
import type {
  AlertResult,
  AlertRule,
  Notification,
  OptimizationReport,
  ScoreMovement,
  ScoreTimeline,
} from "../types/notifications";

export const notificationApi = {
  getRecent: async (limit = 50): Promise<Notification[]> => {
    const r = await axiosClient.get<Notification[]>("/api/notifications/recent", { params: { limit } });
    return r.data;
  },

  getStatus: async (): Promise<{ activeSubscribers: number; recentCount: number }> => {
    const r = await axiosClient.get("/api/notifications/status");
    return r.data;
  },

  subscribe: (): EventSource => new EventSource("/api/notifications/subscribe"),

  // Watchlist
  addRule: async (rule: Partial<AlertRule>): Promise<AlertRule> => {
    const r = await axiosClient.post<AlertRule>("/api/watchlist/rules", rule);
    return r.data;
  },

  listRules: async (): Promise<AlertRule[]> => {
    const r = await axiosClient.get<AlertRule[]>("/api/watchlist/rules");
    return r.data;
  },

  removeRule: async (id: string): Promise<void> => {
    await axiosClient.delete(`/api/watchlist/rules/${id}`);
  },

  evaluate: async (): Promise<AlertResult[]> => {
    const r = await axiosClient.post<AlertResult[]>("/api/watchlist/evaluate");
    return r.data;
  },

  scan: async (): Promise<AlertResult[]> => {
    const r = await axiosClient.post<AlertResult[]>("/api/watchlist/scan");
    return r.data;
  },

  // Score history
  getScoreHistory: async (stockCode: string, days = 90): Promise<ScoreTimeline> => {
    const r = await axiosClient.get<ScoreTimeline>(`/api/admin/scoring/history/${stockCode}`, { params: { days } });
    return r.data;
  },

  getMovements: async (threshold = 0.5): Promise<ScoreMovement[]> => {
    const r = await axiosClient.get<ScoreMovement[]>("/api/admin/scoring/movements", { params: { threshold } });
    return r.data;
  },

  // Weight optimizer
  optimizeWeights: async (forwardMonths = 3): Promise<OptimizationReport> => {
    const r = await axiosClient.get<OptimizationReport>("/api/admin/scoring/optimize-weights", { params: { forwardMonths } });
    return r.data;
  },
};
