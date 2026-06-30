import { useCallback, useEffect, useState } from "react";
import {
  Alert, Box, Card, CardContent, Chip, FormControl, InputLabel, LinearProgress,
  MenuItem, Select, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import {
  TrendingUp, TrendingDown, TrendingFlat,
  CheckCircleOutlined, ErrorOutlined, HelpOutlined,
} from "@mui/icons-material";
import { newsSignalApi } from "../api/newsSignalApi";
import type { NewsEvidenceGateLabel, NewsMarketContext, NewsStockContext, NewsStockImpact } from "../types/newsSignal";

const SENTIMENT_COLOR: Record<string, "success" | "error" | "default" | "warning"> = {
  POSITIVE: "success",
  NEGATIVE: "error",
  NEUTRAL: "default",
  UNKNOWN: "warning",
};

const CONFIDENCE_COLOR: Record<string, "success" | "warning" | "error" | "default"> = {
  HIGH: "success",
  MEDIUM: "warning",
  LOW: "error",
  VERY_LOW: "error",
};

const CONTEXT_LABEL_VI: Record<string, string> = {
  POSITIVE_NEWS_CONTEXT: "Tin tích cực",
  NEGATIVE_NEWS_CONTEXT: "Tin tiêu cực",
  MIXED_NEWS_CONTEXT: "Tin hỗn hợp",
  LOW_SAMPLE: "Ít mẫu",
  NO_RECENT_NEWS_CONTEXT: "Chưa có tin",
};

const SOURCE_LABEL: Record<string, string> = {
  agree: "Đồng thuận",
  agree_et: "Đồng thuận loại",
  phobert_only: "PhoBERT",
  bge_only: "BGE",
  phobert_preferred: "PhoBERT (ưu tiên)",
  phobert_confident: "PhoBERT (tin cậy)",
  bge_confident: "BGE (tin cậy)",
  phobert_fallback: "PhoBERT (fallback)",
  skip: "Bỏ qua",
};

const EVIDENCE_GATE_LABEL: Record<NewsEvidenceGateLabel, string> = {
  STOCK_DIRECT: "Tin trực tiếp",
  MARKET_CONTEXT: "Tin thị trường",
  INDUSTRY_CONTEXT: "Tin ngành",
  NEEDS_REVIEW: "Cần review",
  INSUFFICIENT_EVIDENCE: "Thiếu bằng chứng",
};

const EVIDENCE_GATE_COLOR: Record<NewsEvidenceGateLabel, "success" | "info" | "warning" | "error" | "default"> = {
  STOCK_DIRECT: "success",
  MARKET_CONTEXT: "info",
  INDUSTRY_CONTEXT: "info",
  NEEDS_REVIEW: "warning",
  INSUFFICIENT_EVIDENCE: "error",
};

function SentimentIcon({ sentiment }: { sentiment: string }) {
  if (sentiment === "POSITIVE") return <TrendingUp fontSize="small" color="success" />;
  if (sentiment === "NEGATIVE") return <TrendingDown fontSize="small" color="error" />;
  return <TrendingFlat fontSize="small" color="disabled" />;
}

function EnsembleChip({ source }: { source: string | null }) {
  if (!source) return null;
  const isAgree = source === "agree" || source === "agree_et";
  return (
    <Chip
      size="small"
      icon={isAgree ? <CheckCircleOutlined /> : source === "skip" ? <ErrorOutlined /> : <HelpOutlined />}
      label={SOURCE_LABEL[source] ?? source}
      color={isAgree ? "success" : "default"}
      variant="outlined"
      sx={{ fontSize: "0.7rem" }}
    />
  );
}

function EvidenceGateChip({ impact }: { impact: NewsStockImpact }) {
  const label = impact.evidenceGateLabel ?? null;
  const displayLabel = label ? EVIDENCE_GATE_LABEL[label] ?? "Chưa đánh giá" : "Chưa đánh giá";
  const color = label ? EVIDENCE_GATE_COLOR[label] ?? "default" : "default";
  const details = [
    impact.evidenceGateReason,
    impact.directEvidenceMatchedText ? `Bằng chứng: ${impact.directEvidenceMatchedText}` : null,
    impact.evidenceGateConfidence ? `Độ tin cậy: ${impact.evidenceGateConfidence}` : null,
  ].filter((item): item is string => Boolean(item && item.trim()));

  const chip = (
    <Chip
      size="small"
      label={displayLabel}
      color={color}
      variant={label ? "outlined" : "filled"}
      sx={{ fontSize: "0.7rem", maxWidth: 140 }}
    />
  );

  if (details.length === 0) return chip;
  return (
    <Tooltip title={details.join(" · ")}>
      {chip}
    </Tooltip>
  );
}

function ImpactRow({ impact }: { impact: NewsStockImpact }) {
  const publishedDate = impact.publishedAt
    ? new Date(impact.publishedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <TableRow hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
      <TableCell sx={{ maxWidth: 320 }}>
        <Typography variant="body2" noWrap title={impact.title ?? ""}>
          {impact.url ? (
            <a href={impact.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
              {impact.title ?? "—"}
            </a>
          ) : (
            impact.title ?? "—"
          )}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {impact.source ?? ""} &middot; {publishedDate}
        </Typography>
      </TableCell>
      <TableCell>
        {impact.stockCode && <Chip size="small" label={impact.stockCode} variant="outlined" sx={{ fontSize: "0.7rem" }} />}
      </TableCell>
      <TableCell>
        <Chip size="small" label={impact.eventType} variant="filled" sx={{ fontSize: "0.7rem" }} />
      </TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "center" }}>
          <SentimentIcon sentiment={impact.sentiment} />
          <Chip size="small" label={impact.sentiment} color={SENTIMENT_COLOR[impact.sentiment] ?? "default"} sx={{ fontSize: "0.7rem" }} />
        </Stack>
      </TableCell>
      <TableCell align="center">{impact.impactScore ?? "—"}</TableCell>
      <TableCell align="center">
        <Chip
          size="small"
          label={impact.confidenceLabel ?? "—"}
          color={CONFIDENCE_COLOR[impact.confidenceLabel ?? ""] ?? "default"}
          variant="outlined"
          sx={{ fontSize: "0.7rem" }}
        />
      </TableCell>
      <TableCell align="center">
        <EnsembleChip source={impact.ensembleSource} />
      </TableCell>
      <TableCell align="center">
        <EvidenceGateChip impact={impact} />
      </TableCell>
      <TableCell align="center">
        {impact.needsReview && (
          <Tooltip title={impact.reviewReasons?.join(", ") ?? ""}>
            <Chip size="small" label="Review" color="warning" sx={{ fontSize: "0.7rem" }} />
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}

function SummaryCards({ data }: { data: NewsMarketContext | NewsStockContext | null }) {
  if (!data) return null;
  const items = [
    { label: "Tổng tin", value: data.totalImpacts, color: "#1976d2" },
    { label: "Tích cực", value: data.positiveCount, color: "#2e7d32" },
    { label: "Tiêu cực", value: data.negativeCount, color: "#d32f2f" },
    { label: "Trung lập", value: data.neutralCount, color: "#757575" },
    { label: "Sentiment", value: data.weightedSentiment?.toFixed(2) ?? "—", color: (data.weightedSentiment ?? 0) >= 0 ? "#2e7d32" : "#d32f2f" },
    { label: "Ngữ cảnh", value: CONTEXT_LABEL_VI[data.contextLabel] ?? data.contextLabel, color: "#555" },
  ];
  return (
    <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
      {items.map(item => (
        <Card key={item.label} variant="outlined" sx={{ minWidth: 120, flex: "1 1 120px" }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">{item.label}</Typography>
            <Typography variant="h6" sx={{ color: item.color, fontWeight: 700 }}>{item.value}</Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

function impactKey(impact: NewsStockImpact, index: number) {
  return [
    impact.signalId ?? "no-signal",
    impact.articleId ?? "no-article",
    impact.stockCode ?? "market",
    impact.eventType,
    impact.publishedAt ?? "no-published",
    impact.processedAt ?? "no-processed",
    index,
  ].join("-");
}

export default function NewsSignalsPage() {
  const [mode, setMode] = useState<"market" | "stock">("market");
  const [stockCode, setStockCode] = useState("");
  const [days, setDays] = useState(7);
  const [marketData, setMarketData] = useState<NewsMarketContext | null>(null);
  const [stockData, setStockData] = useState<NewsStockContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      if (mode === "market") {
        const data = await newsSignalApi.marketContext(days, 50);
        setMarketData(data);
      } else if (stockCode.trim()) {
        const data = await newsSignalApi.stockContext(stockCode.trim().toUpperCase(), days, 50);
        setStockData(data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi tải dữ liệu";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [mode, stockCode, days]);

  useEffect(() => {
    if (mode !== "market") return undefined;
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [mode, load]);

  const impacts: NewsStockImpact[] =
    mode === "market" ? (marketData?.topImpacts ?? []) : (stockData?.recentImpacts ?? []);

  const summaryData = mode === "market" ? marketData : stockData;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
        Tín hiệu tin tức (Ensemble AI)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Phân tích tin tức bằng PhoBERT + BGE-M3 cross-validation. Không phải khuyến nghị đầu tư.
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: "center" }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Chế độ</InputLabel>
          <Select value={mode} label="Chế độ" onChange={e => setMode(e.target.value as "market" | "stock")}>
            <MenuItem value="market">Thị trường</MenuItem>
            <MenuItem value="stock">Theo mã</MenuItem>
          </Select>
        </FormControl>

        {mode === "stock" && (
          <TextField
            size="small"
            label="Mã cổ phiếu"
            value={stockCode}
            onChange={e => setStockCode(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === "Enter") load(); }}
            sx={{ width: 120 }}
          />
        )}

        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Khoảng</InputLabel>
          <Select value={days} label="Khoảng" onChange={e => setDays(Number(e.target.value))}>
            <MenuItem value={3}>3 ngày</MenuItem>
            <MenuItem value={7}>7 ngày</MenuItem>
            <MenuItem value={14}>14 ngày</MenuItem>
            <MenuItem value={30}>30 ngày</MenuItem>
            <MenuItem value={90}>90 ngày</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <SummaryCards data={summaryData} />

      {impacts.length > 0 ? (
        <TableContainer component={Card} variant="outlined" sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Tin tức</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mã</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Loại sự kiện</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Sentiment</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Impact</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Confidence</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Ensemble</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Ngữ cảnh tin</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Review</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {impacts.map((impact, i) => (
                <ImpactRow key={impactKey(impact, i)} impact={impact} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        !loading && <Alert severity="info" sx={{ mt: 2 }}>Chưa có tín hiệu tin tức trong khoảng thời gian này.</Alert>
      )}
    </Box>
  );
}
