import axiosClient from "./axiosClient";
import type { ForwardTrackingStatus } from "../types/forwardTracking";

const BASE = "/api/admin/forward-tracking";

export const forwardTrackingApi = {
  getStatus: () =>
    axiosClient.get<ForwardTrackingStatus>(`${BASE}/status`).then((r) => r.data),
};
