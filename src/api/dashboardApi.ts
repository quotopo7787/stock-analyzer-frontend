import axiosClient from "./axiosClient";
import type { DashboardSummary } from "../types/dashboard";

export const dashboardApi = {
  /**
   * Lấy dữ liệu tổng quan dashboard.
   *
   * Nếu backend của bạn đang dùng endpoint khác,
   * chỉ cần sửa "/api/dashboard" ở đây.
   */
  getDashboard: async (): Promise<DashboardSummary> => {
    const response = await axiosClient.get<DashboardSummary>("/api/dashboard");
    return response.data;
  },
};