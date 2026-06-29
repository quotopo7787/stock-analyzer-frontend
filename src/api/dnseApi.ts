import axiosClient from "./axiosClient";

export interface MqttCredentials {
  available: boolean;
  wsUrl?: string;
  investorId?: string;
  token?: string;
  reason?: string;
}

export interface DnseChartQuote {
  symbol: string;
  lastPrice?: number | null;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
  volume?: number | null;
  priceUnit?: string | null;
  tradingDate?: string | null;
  source?: string | null;
  fetchedAt?: string | null;
  status?: string | null;
}

export const dnseApi = {
  getMqttCredentials: () =>
    axiosClient.get<MqttCredentials>("/api/admin/dnse/mqtt-credentials").then((r) => r.data),
  getChartQuote: (symbol: string) =>
    axiosClient
      .get<DnseChartQuote>("/api/admin/dnse/chart-quote", { params: { symbol } })
      .then((r) => r.data),
};
