import axiosClient from "./axiosClient";
import type {
  MacroIndicator,
  MacroIndicatorSyncResponse,
  MacroRegime,
  MacroRegimeRequest,
} from "../types/macroAdmin";

export const macroAdminApi = {
  listIndicators: async (): Promise<MacroIndicator[]> => {
    const response = await axiosClient.get<MacroIndicator[]>("/api/admin/macro-indicators");
    return response.data;
  },

  syncWorldBank: async (): Promise<MacroIndicatorSyncResponse> => {
    const response = await axiosClient.post<MacroIndicatorSyncResponse>("/api/admin/macro-indicators/sync/world-bank");
    return response.data;
  },

  latestRegime: async (): Promise<MacroRegime> => {
    const response = await axiosClient.get<MacroRegime>("/api/admin/macro-regimes/latest");
    return response.data;
  },

  listRegimes: async (): Promise<MacroRegime[]> => {
    const response = await axiosClient.get<MacroRegime[]>("/api/admin/macro-regimes");
    return response.data;
  },

  createRegime: async (payload: MacroRegimeRequest): Promise<MacroRegime> => {
    const response = await axiosClient.post<MacroRegime>("/api/admin/macro-regimes", payload);
    return response.data;
  },

  classifyFromIndicators: async (): Promise<MacroRegime> => {
    const response = await axiosClient.post<MacroRegime>("/api/admin/macro-regimes/classify-from-indicators");
    return response.data;
  },
};
