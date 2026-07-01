import axiosClient from "./axiosClient";
import type {
  NewsAiManualReview,
  NewsAiReviewQueueItem,
  NewsAiReviewQueueParams,
  NewsAiReviewRequest,
  NewsAiReviewSummary,
  PageResponse,
} from "../types/newsAiReview";

const basePath = "/api/admin/news-ai/reviews";

export const newsAiReviewApi = {
  summary: (gateVersion?: string) =>
    axiosClient.get<NewsAiReviewSummary>(`${basePath}/summary`, { params: { gateVersion } }).then((r) => r.data),

  queue: (params: NewsAiReviewQueueParams) =>
    axiosClient.get<PageResponse<NewsAiReviewQueueItem>>(`${basePath}/queue`, { params }).then((r) => r.data),

  detail: (impactId: number) =>
    axiosClient.get<NewsAiReviewQueueItem>(`${basePath}/${impactId}`).then((r) => r.data),

  submit: (impactId: number, payload: NewsAiReviewRequest) =>
    axiosClient.post<NewsAiManualReview>(`${basePath}/${impactId}`, payload).then((r) => r.data),

  exportCsvUrl: (includePending = false) => `${basePath}/export?includePending=${includePending}`,
};
