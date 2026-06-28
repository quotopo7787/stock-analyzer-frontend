import axiosClient from "./axiosClient";
import type { MacroContext } from "../types/macroContext";

export const macroContextApi = {
  getBySymbol: async (symbol: string, finalScore?: number | null): Promise<MacroContext> => {
    const response = await axiosClient.get<MacroContext>(`/api/macro-context/${symbol}`, {
      params: finalScore == null ? undefined : { finalScore },
    });

    return response.data;
  },
};
