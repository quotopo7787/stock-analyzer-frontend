import axiosClient from "./axiosClient";
import type { NewsMarketContext, NewsSentimentSummary, NewsStockContext } from "../types/newsSignal";

export const newsSignalApi = {
  stockContext: (stockCode: string, days = 30, limit = 10) =>
    axiosClient.get<NewsStockContext>(`/api/news-signals/context/${stockCode}`, { params: { days, limit } }).then(r => r.data),

  marketContext: (days = 7, limit = 20) =>
    axiosClient.get<NewsMarketContext>("/api/news-signals/context/market", { params: { days, limit } }).then(r => r.data),

  symbolSentiment: (stockCode: string) =>
    axiosClient.get<NewsSentimentSummary>(`/api/news-signals/sentiment/${stockCode}`).then(r => r.data),
};
