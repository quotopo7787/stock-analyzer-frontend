import type { DecisionPlanPrefill } from "../types/decisionPlans";

export function decisionPlanCreateUrl(prefill: DecisionPlanPrefill) {
  const params = new URLSearchParams({
    create: "1",
    stockCode: prefill.stockCode.toUpperCase(),
    action: prefill.action ?? "WATCH",
    status: prefill.status ?? "ACTIVE",
    reviewDate: prefill.reviewDate ?? dateAfterDays(30),
  });
  addNumber(params, "thesisId", prefill.linkedThesisId);
  addNumber(params, "watchlistId", prefill.linkedWatchlistId);
  addNumber(params, "maxPositionPercent", prefill.maxPositionPercent);
  addList(params, "buyConditions", prefill.buyConditions);
  addList(params, "sellConditions", prefill.sellConditions);
  addList(params, "riskNotes", prefill.riskNotes);
  if (prefill.personalNotes) params.set("personalNotes", prefill.personalNotes);
  return `/decision-plans?${params.toString()}`;
}

export function decisionPlanOpenUrl(stockCode: string) {
  const params = new URLSearchParams({ open: "1", stockCode: stockCode.toUpperCase() });
  return `/decision-plans?${params.toString()}`;
}

export function dateAfterDays(days: number) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function addNumber(params: URLSearchParams, key: string, value?: number) {
  if (value != null) params.set(key, String(value));
}

function addList(params: URLSearchParams, key: string, value?: string[]) {
  if (value?.length) params.set(key, JSON.stringify(value));
}
