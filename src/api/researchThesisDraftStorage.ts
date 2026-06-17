import type { ResearchThesisDraft } from "../types/researchThesis";

const STORAGE_KEY = "stock_analyzer.research_thesis_drafts";

export const researchThesisDraftStorage = {
  getAll: (): ResearchThesisDraft[] => {
    if (typeof window === "undefined") return [];

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as ResearchThesisDraft[]) : [];
      return dedupeDraftsByStockCode(parsed);
    } catch {
      return [];
    }
  },

  getById: (id: string): ResearchThesisDraft | null =>
    researchThesisDraftStorage.getAll().find((item) => item.id === id) ?? null,

  getByStockCode: (stockCode: string): ResearchThesisDraft | null =>
    researchThesisDraftStorage
      .getAll()
      .find((item) => item.stockCode.trim().toUpperCase() === stockCode.trim().toUpperCase()) ?? null,

  save: (draft: ResearchThesisDraft): ResearchThesisDraft => {
    const now = new Date().toISOString();
    const existingByCode = researchThesisDraftStorage.getByStockCode(draft.stockCode);
    const nextDraft = {
      ...draft,
      id: existingByCode?.id ?? draft.id,
      createdAt: existingByCode?.createdAt ?? draft.createdAt ?? now,
      updatedAt: now,
    };
    const current = researchThesisDraftStorage.getAll();
    const next = [
      nextDraft,
      ...current.filter(
        (item) =>
          item.id !== nextDraft.id &&
          item.stockCode.trim().toUpperCase() !== nextDraft.stockCode.trim().toUpperCase()
      ),
    ];

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return nextDraft;
  },
};

export function createResearchThesisDraftId(stockCode: string) {
  return `${stockCode.toUpperCase()}-${Date.now()}`;
}

function dedupeDraftsByStockCode(drafts: ResearchThesisDraft[]) {
  const byCode = new Map<string, ResearchThesisDraft>();

  drafts.forEach((draft) => {
    const code = draft.stockCode.trim().toUpperCase();
    if (!code) return;

    const existing = byCode.get(code);
    if (!existing) {
      byCode.set(code, draft);
      return;
    }

    const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
    const draftTime = new Date(draft.updatedAt || draft.createdAt || 0).getTime();
    if (draftTime > existingTime) {
      byCode.set(code, draft);
    }
  });

  return Array.from(byCode.values());
}
