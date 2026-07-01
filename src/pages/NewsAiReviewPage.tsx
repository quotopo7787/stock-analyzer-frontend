import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { newsAiReviewApi } from "../api/newsAiReviewApi";
import type {
  NewsAiHumanContextLabel,
  NewsAiHumanEventType,
  NewsAiHumanImpactLevel,
  NewsAiHumanSentiment,
  NewsAiReviewQueueItem,
  NewsAiReviewSummary,
  NewsAiReviewStatus,
  NewsAiSymbolCorrect,
} from "../types/newsAiReview";

type FilterForm = {
  reviewStatus: NewsAiReviewStatus | "";
  stockCode: string;
  source: string;
  gateVersion: string;
  fromDate: string;
  toDate: string;
};

type ReviewForm = {
  symbolCorrect: NewsAiSymbolCorrect | "";
  humanContextLabel: NewsAiHumanContextLabel | "";
  humanEventType: NewsAiHumanEventType | "";
  humanSentiment: NewsAiHumanSentiment | "";
  humanImpactLevel: NewsAiHumanImpactLevel | "";
  reviewStatus: NewsAiReviewStatus;
  reviewerNote: string;
  reviewedBy: string;
};

const defaultGateVersion = "NEWS_EVIDENCE_GATE_V6";
const pageSize = 20;
const defaultFilters: FilterForm = {
  reviewStatus: "",
  stockCode: "",
  source: "",
  gateVersion: defaultGateVersion,
  fromDate: "",
  toDate: "",
};
const emptyReviewForm: ReviewForm = {
  symbolCorrect: "",
  humanContextLabel: "",
  humanEventType: "",
  humanSentiment: "",
  humanImpactLevel: "",
  reviewStatus: "REVIEWED",
  reviewerNote: "",
  reviewedBy: "",
};

const statusLabel: Record<NewsAiReviewStatus, string> = {
  PENDING: "Chờ review",
  REVIEWED: "Đã review",
  SKIPPED: "Bỏ qua",
  NEED_MORE_EVIDENCE: "Cần thêm bằng chứng",
};

const contextLabel: Record<NewsAiHumanContextLabel, string> = {
  STOCK_DIRECT: "Tin trực tiếp về mã",
  MARKET_CONTEXT: "Bối cảnh thị trường",
  INDUSTRY_CONTEXT: "Bối cảnh ngành",
  LEGITIMATE_OTHER_SYMBOL: "Đúng là mã khác",
  RELATED_COMPANY_AMBIGUITY: "Mơ hồ công ty liên quan",
  INSUFFICIENT_EVIDENCE: "Thiếu bằng chứng",
  WRONG_SYMBOL: "Gán sai mã",
};

const symbolCorrectLabel: Record<NewsAiSymbolCorrect, string> = {
  TRUE: "Đúng mã",
  FALSE: "Sai mã",
  PARTIAL: "Một phần",
  UNKNOWN: "Chưa rõ",
};

const sentimentLabel: Record<NewsAiHumanSentiment, string> = {
  POSITIVE: "Tích cực",
  NEGATIVE: "Tiêu cực",
  NEUTRAL: "Trung lập",
  MIXED: "Hỗn hợp",
  UNKNOWN: "Chưa rõ",
};

const impactLevelLabel: Record<NewsAiHumanImpactLevel, string> = {
  HIGH: "Cao",
  MEDIUM: "Trung bình",
  LOW: "Thấp",
  NONE: "Không có",
  UNKNOWN: "Chưa rõ",
};

const eventTypeLabel: Record<NewsAiHumanEventType, string> = {
  MARKET_FLOW: "Dòng tiền thị trường",
  ENTERPRISE_CONTEXT: "Bối cảnh doanh nghiệp",
  FINANCE_CONTEXT: "Tài chính",
  BANKING_CONTEXT: "Ngân hàng",
  INSURANCE_CONTEXT: "Bảo hiểm",
  REAL_ESTATE_CONTEXT: "Bất động sản",
  CORPORATE_ACTION: "Sự kiện doanh nghiệp",
  LEGAL_RISK: "Rủi ro pháp lý",
  OTHER: "Khác",
  UNKNOWN: "Chưa rõ",
};

export default function NewsAiReviewPage() {
  const [summary, setSummary] = useState<NewsAiReviewSummary | null>(null);
  const [items, setItems] = useState<NewsAiReviewQueueItem[]>([]);
  const [selected, setSelected] = useState<NewsAiReviewQueueItem | null>(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [form, setForm] = useState<ReviewForm>(emptyReviewForm);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        reviewStatus: filters.reviewStatus || undefined,
        stockCode: filters.stockCode.trim() || undefined,
        source: filters.source.trim() || undefined,
        gateVersion: filters.gateVersion.trim() || defaultGateVersion,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        page,
        size: pageSize,
      };
      const [summaryResult, queueResult] = await Promise.all([
        newsAiReviewApi.summary(params.gateVersion),
        newsAiReviewApi.queue(params),
      ]);
      setSummary(summaryResult);
      setItems(queueResult.content);
      setTotalPages(Math.max(queueResult.totalPages, 1));
      if (selected && !queueResult.content.some((item) => item.impactId === selected.impactId)) {
        setSelected(null);
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters, page, selected]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const selectItem = async (item: NewsAiReviewQueueItem) => {
    try {
      setLoading(true);
      setError("");
      const detail = await newsAiReviewApi.detail(item.impactId);
      setSelected(detail);
      setForm(formFromItem(detail));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      setError("");
      const payload = buildPayload(form);
      await newsAiReviewApi.submit(selected.impactId, payload);
      setMessage("Đã lưu nhãn review. Nhãn này chỉ dùng cho kiểm định dữ liệu tin tức.");
      const detail = await newsAiReviewApi.detail(selected.impactId);
      setSelected(detail);
      setForm(formFromItem(detail));
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const summaryCards = useMemo(() => [
    { label: "Chờ review", value: summary?.pending ?? 0, color: "warning" as const },
    { label: "Đã review", value: summary?.reviewed ?? 0, color: "success" as const },
    { label: "Bỏ qua", value: summary?.skipped ?? 0, color: "default" as const },
    { label: "Cần thêm bằng chứng", value: summary?.needMoreEvidence ?? 0, color: "info" as const },
  ], [summary]);

  return (
    <Box sx={{ textAlign: "left" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Review nhãn tin tức AI</Typography>
          <Typography color="text.secondary">
            Kiểm tra các tin bị đánh dấu cần review. Nhãn người dùng chỉ là lớp audit/huấn luyện sau này, không phải khuyến nghị đầu tư.
          </Typography>
        </Box>
        <Button component="a" href={newsAiReviewApi.exportCsvUrl(false)} variant="outlined">
          Xuất CSV đã review
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" onClose={() => setMessage("")} sx={{ mb: 2 }}>{message}</Alert>}

      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {summaryCards.map((card) => (
            <Card key={card.label} variant="outlined" sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  <Chip label={card.value} color={card.color} sx={{ fontWeight: 800 }} />
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Bộ lọc queue</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField select label="Trạng thái" value={filters.reviewStatus} onChange={(e) => setFilters({ ...filters, reviewStatus: e.target.value as NewsAiReviewStatus | "" })} sx={{ minWidth: 180 }}>
                <MenuItem value="">Tất cả</MenuItem>
                {enumOptions(statusLabel).map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
              <TextField label="Mã" value={filters.stockCode} onChange={(e) => setFilters({ ...filters, stockCode: e.target.value })} />
              <TextField label="Nguồn" value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })} />
              <TextField label="Gate version" value={filters.gateVersion} onChange={(e) => setFilters({ ...filters, gateVersion: e.target.value })} sx={{ minWidth: 230 }} />
              <TextField label="Từ ngày" type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Đến ngày" type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <Button variant="outlined" onClick={() => { setFilters(defaultFilters); setPage(0); }}>Reset</Button>
            </Stack>
          </CardContent>
        </Card>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
          <Card variant="outlined" sx={{ flex: 1, width: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Danh sách cần review</Typography>
              {items.length === 0 ? (
                <Alert severity="info">Không có tin nào khớp bộ lọc hiện tại.</Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tin tức</TableCell>
                        <TableCell>Mã</TableCell>
                        <TableCell>Gate</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell align="right">Hành động</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.impactId} selected={selected?.impactId === item.impactId} hover>
                          <TableCell sx={{ maxWidth: 420 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap title={item.title ?? ""}>{item.title ?? "—"}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.source ?? "—"} · {formatDate(item.publishedAt)}
                            </Typography>
                          </TableCell>
                          <TableCell><Chip size="small" label={item.stockCode ?? "—"} variant="outlined" /></TableCell>
                          <TableCell>
                            <Chip size="small" label="Cần review" color="warning" variant="outlined" />
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }} noWrap title={item.evidenceGateReason ?? ""}>
                              {item.evidenceGateReason ?? "—"}
                            </Typography>
                          </TableCell>
                          <TableCell><Chip size="small" label={statusLabel[item.reviewStatus]} /></TableCell>
                          <TableCell align="right">
                            <Button size="small" onClick={() => void selectItem(item)}>Mở review</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: "flex-end", alignItems: "center" }}>
                <Button disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Trước</Button>
                <Typography variant="body2">Trang {page + 1}/{totalPages}</Typography>
                <Button disabled={page + 1 >= totalPages} onClick={() => setPage((current) => current + 1)}>Sau</Button>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ width: { xs: "100%", lg: 460 } }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Chi tiết & gán nhãn</Typography>
              {!selected ? (
                <Alert severity="info">Chọn một tin trong danh sách để review nhãn.</Alert>
              ) : (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{selected.title ?? "—"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selected.source ?? "—"} · {formatDate(selected.publishedAt)} · {selected.stockCode ?? "—"}
                    </Typography>
                  </Box>
                  <Alert severity="warning" variant="outlined">
                    {selected.evidenceGateReason ?? "Tin này cần người dùng kiểm tra lại bằng chứng."}
                  </Alert>
                  <DetailLine label="AI event" value={selected.eventType} />
                  <DetailLine label="AI sentiment" value={selected.sentiment} />
                  <DetailLine label="Impact score" value={numberText(selected.impactScore)} />
                  <DetailLine label="Gate version" value={selected.gateVersion} />
                  {selected.directEvidenceMatchedText && <DetailLine label="Bằng chứng khớp" value={selected.directEvidenceMatchedText} />}
                  <Box>
                    <Typography variant="caption" color="text.secondary">Evidence</Typography>
                    <Stack spacing={0.8} sx={{ mt: 0.5 }}>
                      {(selected.evidence ?? []).length === 0 && <Typography variant="body2">—</Typography>}
                      {(selected.evidence ?? []).map((evidence, index) => (
                        <Typography key={`${selected.impactId}-evidence-${index}`} variant="body2" sx={{ p: 1, bgcolor: "#f6f9fc", borderRadius: 1 }}>
                          {evidence}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                  <Divider />
                  <TextField select label="Mã có đúng không?" value={form.symbolCorrect} onChange={(e) => setForm({ ...form, symbolCorrect: e.target.value as NewsAiSymbolCorrect | "" })}>
                    <MenuItem value="">Chưa chọn</MenuItem>
                    {enumOptions(symbolCorrectLabel).map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                  </TextField>
                  <TextField select label="Nhãn ngữ cảnh" value={form.humanContextLabel} onChange={(e) => setForm({ ...form, humanContextLabel: e.target.value as NewsAiHumanContextLabel | "" })}>
                    <MenuItem value="">Chưa chọn</MenuItem>
                    {enumOptions(contextLabel).map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                  </TextField>
                  <TextField select label="Nhóm sự kiện" value={form.humanEventType} onChange={(e) => setForm({ ...form, humanEventType: e.target.value as NewsAiHumanEventType | "" })}>
                    <MenuItem value="">Chưa chọn</MenuItem>
                    {enumOptions(eventTypeLabel).map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                  </TextField>
                  <Stack direction="row" spacing={1}>
                    <TextField select fullWidth label="Sắc thái" value={form.humanSentiment} onChange={(e) => setForm({ ...form, humanSentiment: e.target.value as NewsAiHumanSentiment | "" })}>
                      <MenuItem value="">Chưa chọn</MenuItem>
                      {enumOptions(sentimentLabel).map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                    </TextField>
                    <TextField select fullWidth label="Mức ảnh hưởng" value={form.humanImpactLevel} onChange={(e) => setForm({ ...form, humanImpactLevel: e.target.value as NewsAiHumanImpactLevel | "" })}>
                      <MenuItem value="">Chưa chọn</MenuItem>
                      {enumOptions(impactLevelLabel).map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                    </TextField>
                  </Stack>
                  <TextField select label="Trạng thái review" value={form.reviewStatus} onChange={(e) => setForm({ ...form, reviewStatus: e.target.value as NewsAiReviewStatus })}>
                    {enumOptions(statusLabel).map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                  </TextField>
                  <TextField label="Người review" value={form.reviewedBy} onChange={(e) => setForm({ ...form, reviewedBy: e.target.value })} placeholder="manual" />
                  <TextField multiline minRows={3} label="Ghi chú reviewer" value={form.reviewerNote} onChange={(e) => setForm({ ...form, reviewerNote: e.target.value })} />
                  <Button variant="contained" disabled={saving} onClick={() => void submit()}>
                    Lưu nhãn review
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Stack>
    </Box>
  );
}

function formFromItem(item: NewsAiReviewQueueItem): ReviewForm {
  return {
    symbolCorrect: item.review?.symbolCorrect ?? "",
    humanContextLabel: item.review?.humanContextLabel ?? "",
    humanEventType: item.review?.humanEventType ?? "",
    humanSentiment: item.review?.humanSentiment ?? "",
    humanImpactLevel: item.review?.humanImpactLevel ?? "",
    reviewStatus: item.review?.reviewStatus ?? "REVIEWED",
    reviewerNote: item.review?.reviewerNote ?? "",
    reviewedBy: item.review?.reviewedBy ?? "",
  };
}

function buildPayload(form: ReviewForm) {
  return {
    reviewStatus: form.reviewStatus,
    ...(form.symbolCorrect ? { symbolCorrect: form.symbolCorrect } : {}),
    ...(form.humanContextLabel ? { humanContextLabel: form.humanContextLabel } : {}),
    ...(form.humanEventType ? { humanEventType: form.humanEventType } : {}),
    ...(form.humanSentiment ? { humanSentiment: form.humanSentiment } : {}),
    ...(form.humanImpactLevel ? { humanImpactLevel: form.humanImpactLevel } : {}),
    ...(form.reviewerNote.trim() ? { reviewerNote: form.reviewerNote.trim() } : {}),
    ...(form.reviewedBy.trim() ? { reviewedBy: form.reviewedBy.trim() } : {}),
  };
}

function enumOptions<T extends string>(labels: Record<T, string>) {
  return (Object.entries(labels) as Array<[T, string]>).map(([value, label]) => ({ value, label }));
}

function DetailLine({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, textAlign: "right" }}>{value ?? "—"}</Typography>
    </Stack>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function numberText(value: number | null) {
  return value == null ? "—" : value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

function apiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? error.message;
  }
  return error instanceof Error ? error.message : "Không thể tải dữ liệu review";
}
