import axiosClient from "./axiosClient";
import type { MarketRegimeResponse } from "../types/marketIndex";

const BASE = "/api/admin/market-indices";

export const marketIndexApi = {
  getRegime(code: string) {
    return axiosClient
      .get<MarketRegimeResponse>(`${BASE}/${encodeURIComponent(code)}/regime`)
      .then((r) => r.data);
  },
};
