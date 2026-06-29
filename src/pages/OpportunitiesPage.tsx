import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DonutSmallOutlinedIcon from "@mui/icons-material/DonutSmallOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import { Link, useNavigate } from "react-router-dom";
import { macroContextApi } from "../api/macroContextApi";
import { opportunitiesApi } from "../api/opportunitiesApi";
import { sectorContextApi } from "../api/sectorContextApi";
import {
  createResearchThesisDraftId,
  researchThesisDraftStorage,
} from "../api/researchThesisDraftStorage";
import { watchlistApi } from "../api/watchlistApi";
import { stockApi } from "../api/stockApi";
import MetricTooltip from "../components/MetricTooltip";
import type {
  OpportunityDetailItem,
  OpportunityQueryParams,
  SectorDecisionContext,
  OpportunitySummaryItem,
  OpportunityWrappedResponse,
} from "../types/opportunities";
import type { MacroContext } from "../types/macroContext";
import type { ResearchThesisDraft, ResearchThesisStatus } from "../types/researchThesis";
import type { StockPricePoint } from "../types/stock";

type BadgeColor = "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info";
type MetricTone = "primary" | "success" | "warning" | "error";
type PriceChartRange = "1M" | "3M" | "6M" | "1Y" | "3Y" | "MAX";
type PriceChartGranularity = "DAY" | "MONTH" | "YEAR";

const compactChipSx = {
  height: 20,
  "& .MuiChip-label": { px: 0.65, fontSize: "0.64rem" },
};

const currentYear = new Date().getFullYear();
const detailRequestTimeoutMs = 15000;

function macroContextFromOpportunity(item: OpportunitySummaryItem | OpportunityDetailItem | null): MacroContext | null {
  if (!item || item.macroScore == null) {
    return null;
  }

  return {
    symbol: item.code,
    industry: item.industry,
    industryGroup: item.industryGroup,
    finalScore: item.finalScore,
    macroScore: item.macroScore,
    macroAdjustment: item.macroAdjustment,
    adjustedScore: item.adjustedScore,
    macroLevel: item.macroLevel,
    macroSignals: item.macroSignals ?? [],
    macroWarnings: item.macroWarnings ?? [],
    assumptions: item.macroAssumptions ?? [],
    contextDate: item.macroContextDate,
    note: item.macroNote,
  };
}

const priceChartRanges: Array<{ value: PriceChartRange; label: string; days?: number }> = [
  { value: "1M", label: "1T", days: 31 },
  { value: "3M", label: "3T", days: 93 },
  { value: "6M", label: "6T", days: 186 },
  { value: "1Y", label: "1N", days: 365 },
  { value: "3Y", label: "3N", days: 1095 },
  { value: "MAX", label: "Max" },
];

const priceChartGranularities: Array<{ value: PriceChartGranularity; label: string }> = [
  { value: "DAY", label: "Ngày" },
  { value: "MONTH", label: "Tháng" },
  { value: "YEAR", label: "Năm" },
];

const defaultFilters: OpportunityQueryParams = {
  fromYear: 2023,
  toYear: Math.max(2025, currentYear - 1),
  page: 0,
  size: 20,
  exchange: "",
  excludeLowLiquidity: true,
  decision: "",
  decisionReasonCode: "",
  industryGroup: "",
  researchReadiness: "",
  executionReadiness: "",
  sort: "finalScoreDesc",
};

const decisionOptions = ["RESEARCH_NOW", "WATCHLIST", "WAIT_FOR_PRICE", "REVIEW", "AVOID"];
const industryOptions = [
  "BANK",
  "FINANCIAL_SERVICES",
  "INSURANCE",
  "TECHNOLOGY",
  "FOOD_BEVERAGE",
  "REAL_ESTATE",
  "INDUSTRIALS",
  "UTILITIES",
  "RETAIL",
  "CONSTRUCTION_MATERIALS",
  "BASIC_RESOURCES",
  "CHEMICALS",
  "ENERGY",
  "HEALTHCARE",
];
const reasonOptions = [
  "LOW_LIQUIDITY",
  "DATA_NOT_ENOUGH",
  "NEGATIVE_MOMENTUM",
  "OLD_PRICE_DATA",
  "VALUATION_HIGH",
  "BANK_DATA_MISSING",
  "FINANCIAL_SERVICES_DATA_MISSING",
  "INSURANCE_DATA_MISSING",
  "FINANCIAL_RISK",
  "LOW_ROE",
  "VALUE_TRAP_RISK",
  "CYCLICAL_RISK",
  "REVENUE_DECLINE",
];
const researchOptions = [
  "READY_FOR_RESEARCH",
  "WATCH_ONLY",
  "PRELIMINARY_ONLY",
  "LOW_CONFIDENCE_DATA",
  "AVOID_FOR_NOW",
];
const executionOptions = [
  "READY_TO_TRADE",
  "TRADE_WITH_SIZE_LIMIT",
  "LOW_LIQUIDITY_CAUTION",
  "NOT_RECOMMENDED_TO_TRADE",
];
const sortOptions = [
  { value: "finalScoreDesc", label: "Điểm tổng hợp giảm dần" },
  { value: "qualityScoreDesc", label: "Chất lượng giảm dần" },
  { value: "valuationScoreDesc", label: "Định giá hấp dẫn" },
  { value: "liquidityScoreDesc", label: "Thanh khoản tốt" },
  { value: "dataConfidenceDesc", label: "Dữ liệu tin cậy" },
  { value: "conclusionConfidenceDesc", label: "Kết luận tin cậy" },
  { value: "latestPriceDateDesc", label: "Giá mới nhất" },
  { value: "priceMomentumDesc", label: "Xu hướng giá" },
];

export default function OpportunitiesPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<OpportunityQueryParams>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<OpportunityQueryParams>(defaultFilters);
  const [data, setData] = useState<OpportunityWrappedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState<"" | "watchlist" | "reject">("");
  const [selectedCode, setSelectedCode] = useState("");
  const [detail, setDetail] = useState<OpportunityDetailItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [priceHistory, setPriceHistory] = useState<StockPricePoint[]>([]);
  const [priceHistoryLoading, setPriceHistoryLoading] = useState(false);
  const [priceHistoryError, setPriceHistoryError] = useState("");
  const [macroContext, setMacroContext] = useState<MacroContext | null>(null);
  const [macroContextLoading, setMacroContextLoading] = useState(false);
  const [macroContextError, setMacroContextError] = useState("");
  const [sectorContext, setSectorContext] = useState<SectorDecisionContext | null>(null);
  const [sectorContextLoading, setSectorContextLoading] = useState(false);
  const [sectorContextError, setSectorContextError] = useState("");

  const items = data?.items ?? [];
  const summary = data?.summary;
  const meta = data?.meta;
  const pagination = data?.pagination;
  const isInvalidRange = filters.fromYear > filters.toYear;

  const topIndustries = useMemo(() => topEntries(summary?.industryCounts, 5), [summary]);

  const loadOpportunities = useCallback(async (nextFilters: OpportunityQueryParams) => {
    if (nextFilters.fromYear > nextFilters.toYear) {
      setErrorMessage("Giai đoạn lọc không hợp lệ.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      const response = await opportunitiesApi.getOpportunities(nextFilters);
      setData(response);
      setAppliedFilters(nextFilters);
      setFilters(nextFilters);
    } catch (error) {
      console.error(error);
      setErrorMessage("Không tải được danh sách cơ hội đầu tư. Kiểm tra backend hoặc endpoint /api/opportunities.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOpportunities(defaultFilters);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOpportunities]);

  const updateFilter = (field: keyof OpportunityQueryParams, value: string | number | boolean) => {
    setFilters((prev) => ({
      ...prev,
      page: 0,
      [field]: value,
    }));
  };

  useEffect(() => {
    if (filterSignature(filters) === filterSignature(appliedFilters) || isInvalidRange) return;
    const timer = window.setTimeout(() => {
      void loadOpportunities(filters);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [appliedFilters, filters, isInvalidRange, loadOpportunities]);

  const resetFilters = () => {
    loadOpportunities(defaultFilters);
  };

  const applyFilters = () => {
    loadOpportunities(filters);
  };

  const changePage = (nextPage: number) => {
    loadOpportunities({
      ...appliedFilters,
      page: nextPage,
    });
  };

  const changeSize = (nextSize: number) => {
    loadOpportunities({
      ...appliedFilters,
      page: 0,
      size: nextSize,
    });
  };

  const openDetail = async (item: OpportunitySummaryItem) => {
    setSelectedCode(item.code);
    setDetail(null);
    setDetailError("");
    setPriceHistory([]);
    setPriceHistoryError("");
    setMacroContext(null);
    setMacroContextError("");
    setSectorContext(null);
    setSectorContextError("");
    setActionMessage("");
    setActionError("");
    setDetailLoading(true);
    setPriceHistoryLoading(true);
    setMacroContextLoading(true);
    setSectorContextLoading(true);

    let embeddedMacroLoaded = false;

    try {
      const response = await withTimeout(
        opportunitiesApi.getOpportunityDetail(item.code, {
          fromYear: appliedFilters.fromYear,
          toYear: appliedFilters.toYear,
        }),
        detailRequestTimeoutMs
      );
      setDetail(response);
      const embeddedMacro = macroContextFromOpportunity(response);
      if (embeddedMacro) {
        setMacroContext(embeddedMacro);
        setMacroContextLoading(false);
        embeddedMacroLoaded = true;
      }
    } catch (error) {
      console.warn("Opportunity detail fallback", error);
      setDetailError("Không tải được chi tiết mã này. Tạm thời hiển thị dữ liệu tóm tắt trên bảng.");
      setDetail(item as OpportunityDetailItem);
      const embeddedMacro = macroContextFromOpportunity(item);
      if (embeddedMacro) {
        setMacroContext(embeddedMacro);
        setMacroContextLoading(false);
        embeddedMacroLoaded = true;
      }
    } finally {
      setDetailLoading(false);
    }

    try {
      const history = await stockApi.getPriceHistory(item.code, 1500);
      setPriceHistory(history);
    } catch (error) {
      console.warn("Opportunity price history unavailable", error);
      setPriceHistoryError("Chưa tải được lịch sử giá.");
    } finally {
      setPriceHistoryLoading(false);
    }

    if (!embeddedMacroLoaded) {
      try {
        const context = await macroContextApi.getBySymbol(item.code, item.finalScore);
        setMacroContext(context);
    } catch (error) {
      console.warn("Macro context unavailable", error);
      setMacroContextError("Chưa tải được bối cảnh vĩ mô cho mã này.");
      } finally {
        setMacroContextLoading(false);
      }
    }

    try {
      const context = await sectorContextApi.getBySymbol(item.code);
      setSectorContext(context);
    } catch (error) {
      console.warn("Sector context unavailable", error);
      setSectorContextError("Chưa tải được bối cảnh ngành cho mã này.");
    } finally {
      setSectorContextLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedCode("");
    setDetail(null);
    setDetailError("");
    setPriceHistory([]);
    setPriceHistoryError("");
    setMacroContext(null);
    setMacroContextError("");
    setSectorContext(null);
    setSectorContextError("");
    setActionMessage("");
    setActionError("");
  };

  const createThesisFromOpportunity = (item: OpportunityDetailItem) => {
    const existing = researchThesisDraftStorage.getByStockCode(item.code);
    if (existing) {
      navigate(`/investment-thesis/new?draftId=${encodeURIComponent(existing.id)}`);
      return;
    }

    const draft = buildResearchThesisDraft(item);
    const saved = researchThesisDraftStorage.save(draft);
    navigate(`/investment-thesis/new?draftId=${encodeURIComponent(saved.id)}`);
  };

  const addToWatchlist = async (item: OpportunityDetailItem) => {
    try {
      setActionLoading("watchlist");
      setActionError("");
      setActionMessage("");

      const created = await watchlistApi.create({
        stockCode: item.code,
        reason: watchlistReason(item),
      });

      setActionMessage(`Đã thêm ${created.stockCode} vào watchlist.`);
    } catch (error) {
      console.error(error);
      setActionError("Không thêm được mã vào watchlist. Có thể backend chưa sẵn sàng hoặc mã đã lỗi dữ liệu.");
    } finally {
      setActionLoading("");
    }
  };

  const rejectOpportunity = async (item: OpportunityDetailItem) => {
    try {
      setActionLoading("reject");
      setActionError("");
      setActionMessage("");

      const created = await watchlistApi.create({
        stockCode: item.code,
        reason: `Loại bỏ từ Opportunities: ${watchlistReason(item)}`,
      });
      await watchlistApi.updateStatus(created.id, { status: "REJECTED" });

      setActionMessage(`Đã đánh dấu ${created.stockCode} là đã loại bỏ.`);
    } catch (error) {
      console.error(error);
      setActionError("Không đánh dấu loại bỏ được mã này.");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <Box sx={{ textAlign: "left" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 2, justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}
      >
        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontSize: { xs: 28, md: 34 }, lineHeight: 1.12 }}>
              Cơ hội đầu tư
            </Typography>
            <Chip size="small" label="Sàng lọc mô phỏng" variant="outlined" sx={{ bgcolor: "white" }} />
          </Stack>
          <Typography color="text.secondary" sx={{ maxWidth: 920, fontSize: 13.5 }}>
            Danh sách cổ phiếu được sàng lọc bằng dữ liệu tài chính, định giá, thanh khoản và rủi ro.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
          {meta && (
            <Chip
              size="small"
              label={`Cập nhật: ${formatDateTime(meta.snapshotGeneratedAt)}`}
              variant="outlined"
              sx={{ bgcolor: "white" }}
            />
          )}
          {meta && <Chip size="small" label={`Đã quét: ${formatNumber(meta.totalBeforeFilters, 0)} mã`} color="primary" variant="outlined" sx={{ bgcolor: "white" }} />}
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={() => loadOpportunities(appliedFilters)}
            disabled={loading}
          >
            Tải lại
          </Button>
        </Stack>
      </Stack>

      {meta && <SnapshotStatusBar meta={meta} compact />}

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <SummaryCards response={data} />

      <Card sx={{ mb: 2, borderRadius: 3 }}>
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Stack spacing={1.5}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(3, minmax(0, 1fr))",
                  xl: "repeat(6, minmax(0, 1fr)) auto",
                },
                gap: 1.2,
                alignItems: "center",
                "& .MuiOutlinedInput-root": { bgcolor: "#fbfdff" },
              }}
            >
              <TextField
                label="Từ năm"
                type="number"
                size="small"
                value={filters.fromYear}
                onChange={(event) => updateFilter("fromYear", Number(event.target.value))}
                error={isInvalidRange}
              />
              <TextField
                label="Đến năm"
                type="number"
                size="small"
                value={filters.toYear}
                onChange={(event) => updateFilter("toYear", Number(event.target.value))}
                error={isInvalidRange}
              />
              <TextField
                label="Sàn"
                size="small"
                value={filters.exchange ?? ""}
                onChange={(event) => updateFilter("exchange", event.target.value.toUpperCase())}
                placeholder="Tất cả sàn"
              />
              <TextField
                select
                label="Ngành"
                size="small"
                value={filters.industryGroup ?? ""}
                onChange={(event) => updateFilter("industryGroup", event.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {industryOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {industryGroupLabel(option)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Sắp xếp"
                size="small"
                value={filters.sort ?? "finalScoreDesc"}
                onChange={(event) => updateFilter("sort", event.target.value)}
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Số dòng"
                size="small"
                value={filters.size}
                onChange={(event) => updateFilter("size", Number(event.target.value))}
              >
                {[10, 20, 50, 100].map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <Stack direction="row" spacing={1} sx={{ justifyContent: { xs: "flex-start", xl: "flex-end" } }}>
                <Button variant="contained" onClick={applyFilters} disabled={loading || isInvalidRange}>
                  Áp dụng
                </Button>
                <Button variant="outlined" onClick={resetFilters} disabled={loading}>
                  Reset
                </Button>
              </Stack>
            </Box>

            <Accordion disableGutters elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: "12px !important", bgcolor: "#fbfdff", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, "& .MuiAccordionSummary-content": { my: 0.8 } }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <TuneOutlinedIcon color="primary" fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Bộ lọc nâng cao</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 1.5 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))", lg: "repeat(4,minmax(0,1fr))", xl: "repeat(5,minmax(0,1fr))" }, gap: 1.5 }}>
                  <TextField select label="Trạng thái" size="small" value={filters.decision ?? ""} onChange={(event) => updateFilter("decision", event.target.value)}>
                    <MenuItem value="">Tất cả</MenuItem>{decisionOptions.map((option) => <MenuItem key={option} value={option}>{decisionLabel(option)}</MenuItem>)}
                  </TextField>
                  <TextField select label="Lý do" size="small" value={filters.decisionReasonCode ?? ""} onChange={(event) => updateFilter("decisionReasonCode", event.target.value)}>
                    <MenuItem value="">Tất cả</MenuItem>{reasonOptions.map((option) => <MenuItem key={option} value={option}>{reasonLabel(option)}</MenuItem>)}
                  </TextField>
                  <TextField select label="Mức nghiên cứu" size="small" value={filters.researchReadiness ?? ""} onChange={(event) => updateFilter("researchReadiness", event.target.value)}>
                    <MenuItem value="">Tất cả</MenuItem>{researchOptions.map((option) => <MenuItem key={option} value={option}>{readinessLabel(option)}</MenuItem>)}
                  </TextField>
                  <TextField select label="Khả năng giao dịch" size="small" value={filters.executionReadiness ?? ""} onChange={(event) => updateFilter("executionReadiness", event.target.value)}>
                    <MenuItem value="">Tất cả</MenuItem>{executionOptions.map((option) => <MenuItem key={option} value={option}>{executionLabel(option)}</MenuItem>)}
                  </TextField>
                  <FormControlLabel sx={{ alignSelf: "center", ml: 0 }} control={<Checkbox size="small" checked={Boolean(filters.excludeLowLiquidity)} onChange={(event) => updateFilter("excludeLowLiquidity", event.target.checked)} />} label={<Typography variant="body2">Loại mã thanh khoản thấp</Typography>} />
                </Box>
              </AccordionDetails>
            </Accordion>

            <Typography variant="caption" color="text.secondary">
              Bộ lọc tự cập nhật sau khi thay đổi, hoặc bấm Áp dụng để chạy ngay.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {errorMessage && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={resetFilters}>
              Reset bộ lọc
            </Button>
          }
          sx={{ mb: 3 }}
        >
          {errorMessage}
        </Alert>
      )}

      <TopIndustries topIndustries={topIndustries} summary={summary} />

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ pb: 1 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, mb: 2 }}
          >
            <Box>
              <Typography variant="h6">Danh sách mã</Typography>
              <Typography variant="body2" color="text.secondary">
                {meta
                  ? listSubtitle(meta)
                  : "Chưa có dữ liệu"}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Tooltip title="Dạng lưới">
                <IconButton
                  size="small"
                  aria-label="Dạng lưới"
                  sx={{ bgcolor: "#e9f2ff", color: "primary.main", border: 1, borderColor: "primary.light" }}
                >
                  <GridViewOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Dạng danh sách">
                <IconButton
                  size="small"
                  aria-label="Dạng danh sách"
                  sx={{ bgcolor: "white", border: 1, borderColor: "divider" }}
                >
                  <FormatListBulletedOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                Giá hiển thị theo đơn vị nghìn đồng/cp.
              </Typography>
            </Stack>
          </Stack>

          {!loading && items.length === 0 ? (
            <Alert
              severity="warning"
              action={
                <Button color="inherit" size="small" onClick={resetFilters}>
                  Reset bộ lọc
                </Button>
              }
            >
              Không có mã nào phù hợp bộ lọc hiện tại.
            </Alert>
          ) : (
            <OpportunityTable items={items} onOpenDetail={openDetail} />
          )}
        </CardContent>

        <Divider />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ p: 2, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" } }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <IconButton
              onClick={() => changePage(Math.max(0, (pagination?.page ?? 0) - 1))}
              disabled={loading || !pagination?.hasPrevious}
              aria-label="Trang trước"
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2">
              Trang {(pagination?.page ?? 0) + 1}/{Math.max(pagination?.totalPages ?? 1, 1)}
            </Typography>
            <IconButton
              onClick={() => changePage((pagination?.page ?? 0) + 1)}
              disabled={loading || !pagination?.hasNext}
              aria-label="Trang sau"
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </Stack>

          <TextField
            select
            label="Số dòng"
            size="small"
            value={appliedFilters.size}
            onChange={(event) => changeSize(Number(event.target.value))}
            sx={{ width: { xs: "100%", sm: 140 } }}
          >
            {[10, 20, 50, 100].map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Card>

      <OpportunityDetailDrawer
        open={Boolean(selectedCode)}
        code={selectedCode}
        detail={detail}
        priceHistory={priceHistory}
        priceHistoryLoading={priceHistoryLoading}
        priceHistoryError={priceHistoryError}
        macroContext={macroContext}
        macroContextLoading={macroContextLoading}
        macroContextError={macroContextError}
        sectorContext={sectorContext}
        sectorContextLoading={sectorContextLoading}
        sectorContextError={sectorContextError}
        loading={detailLoading}
        error={detailError}
        actionMessage={actionMessage}
        actionError={actionError}
        actionLoading={actionLoading}
        onCreateThesis={createThesisFromOpportunity}
        onAddWatchlist={addToWatchlist}
        onReject={rejectOpportunity}
        onClose={closeDetail}
      />
    </Box>
  );
}

function MacroContextCard({
  context,
  loading,
  error,
  fallbackFinalScore,
}: {
  context: MacroContext | null;
  loading: boolean;
  error: string;
  fallbackFinalScore?: number | null;
}) {
  const finalScore = context?.finalScore ?? fallbackFinalScore;
  const signals = context?.macroSignals ?? [];
  const warnings = context?.macroWarnings ?? [];

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "flex-start" } }}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.75 }}>
              <TrendingUpOutlinedIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 850 }}>
                Bối cảnh vĩ mô
              </Typography>
              {context?.macroLevel && (
                <Chip size="small" color={macroLevelColor(context.macroLevel)} label={macroLevelLabel(context.macroLevel)} sx={{ fontWeight: 700 }} />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Lớp điều chỉnh tham khảo cho timing/rủi ro, không thay đổi điểm cơ bản.
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(104px, 1fr))" }, gap: 1, minWidth: { md: 520 } }}>
            <MacroMetric label="Điểm cơ bản" value={formatScore(finalScore)} />
            <MacroMetric label="Điểm macro" value={formatScore(context?.macroScore)} />
            <MacroMetric label="Điều chỉnh" value={formatSignedScore(context?.macroAdjustment)} />
            <MacroMetric label="Sau macro" value={formatScore(context?.adjustedScore)} emphasize />
          </Box>
        </Stack>

        {loading && <LinearProgress sx={{ mt: 1.5 }} />}
        {error && !loading && (
          <Alert severity="warning" sx={{ mt: 1.5, py: 0.75 }}>
            {error}
          </Alert>
        )}

        {context && !loading && (
          <Box sx={{ mt: 1.5, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.25 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 700 }}>
                Tín hiệu hỗ trợ
              </Typography>
              <Stack spacing={0.6}>
                {(signals.length ? signals : ["Chưa có tín hiệu macro hỗ trợ rõ ràng."]).map((text) => (
                  <Alert key={text} severity="success" sx={{ py: 0.55, px: 1 }}>
                    {text}
                  </Alert>
                ))}
              </Stack>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 700 }}>
                Cảnh báo
              </Typography>
              <Stack spacing={0.6}>
                {(warnings.length ? warnings : ["Chưa có cảnh báo macro lớn."]).map((text) => (
                  <Alert key={text} severity={warnings.length ? "warning" : "info"} sx={{ py: 0.55, px: 1 }}>
                    {text}
                  </Alert>
                ))}
              </Stack>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function MacroMetric({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, px: 1, py: 0.85, bgcolor: emphasize ? "rgba(25, 118, 210, 0.06)" : "background.default" }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {label}
      </Typography>
      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: emphasize ? "primary.main" : "text.primary" }}>
        {value}
      </Typography>
    </Box>
  );
}

function SectorDecisionContextCard({
  detail,
  context,
  loading,
  error,
}: {
  detail: OpportunityDetailItem;
  context: SectorDecisionContext | null;
  loading: boolean;
  error: string;
}) {
  const resolvedContext = context ?? detail.sectorContext;
  const bias = resolvedContext?.sectorDecisionBias ?? "INSUFFICIENT_DATA";
  const signals = resolvedContext?.sectorSignals ?? [];
  const warnings = resolvedContext?.sectorWarnings ?? [];

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "flex-start" } }}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.75 }}>
              <TrendingUpOutlinedIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 850 }}>
                Bối cảnh ngành
              </Typography>
              <Chip size="small" color={sectorBiasColor(bias)} label={sectorBiasLabel(bias)} sx={{ fontWeight: 750 }} />
              {resolvedContext?.sectorMomentum && (
                <Chip size="small" variant="outlined" color={sectorMomentumColor(resolvedContext.sectorMomentum)} label={sectorMomentumLabel(resolvedContext.sectorMomentum)} />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Lớp đọc sức mạnh ngành và sức mạnh tương đối của mã, chỉ hỗ trợ timing/quyết định, không đổi finalScore.
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(104px, 1fr))" }, gap: 1, minWidth: { md: 520 } }}>
            <MacroMetric label="Điểm ngành" value={formatScore(resolvedContext?.sectorScore)} emphasize />
            <MacroMetric label="RS 20D" value={formatSignedPercent(resolvedContext?.relativeStrength20D)} />
            <MacroMetric label="RS 60D" value={formatSignedPercent(resolvedContext?.relativeStrength60D)} />
            <MacroMetric label="Mẫu ngành" value={resolvedContext?.sampleSize != null ? `${resolvedContext.sampleSize} mã` : "-"} />
          </Box>
        </Stack>

        {loading && <LinearProgress sx={{ mt: 1.5 }} />}
        {error && !loading && (
          <Alert severity="warning" sx={{ mt: 1.5, py: 0.75 }}>
            {error}
          </Alert>
        )}

        {resolvedContext?.decisionSupportNote && (
          <Alert severity={bias === "SUPPORTIVE" ? "success" : bias === "CAUTION" || bias === "RISK_OFF" ? "warning" : "info"} sx={{ mt: 1.5, py: 0.75 }}>
            {resolvedContext.decisionSupportNote}
          </Alert>
        )}

        <Box sx={{ mt: 1.5, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.25 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 700 }}>
              Tín hiệu hỗ trợ
            </Typography>
            <Stack spacing={0.6}>
              {(signals.length ? signals : ["Chưa có tín hiệu ngành hỗ trợ rõ ràng."]).map((text) => (
                <Alert key={text} severity={signals.length ? "success" : "info"} sx={{ py: 0.55, px: 1 }}>
                  {text}
                </Alert>
              ))}
            </Stack>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 700 }}>
              Cảnh báo
            </Typography>
            <Stack spacing={0.6}>
              {(warnings.length ? warnings : ["Chưa có cảnh báo ngành lớn."]).map((text) => (
                <Alert key={text} severity={warnings.length ? "warning" : "info"} sx={{ py: 0.55, px: 1 }}>
                  {text}
                </Alert>
              ))}
            </Stack>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function formatSignedPercent(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "-";
  return `${value > 0 ? "+" : ""}${formatNumber(value)}%`;
}

function sectorBiasLabel(code?: string | null): string {
  const labels: Record<string, string> = {
    SUPPORTIVE: "Ủng hộ",
    NEUTRAL: "Trung tính",
    CAUTION: "Cần thận trọng",
    RISK_OFF: "Rủi ro cao",
    INSUFFICIENT_DATA: "Thiếu dữ liệu",
  };
  return code ? labels[code] ?? code : "Thiếu dữ liệu";
}

function sectorBiasColor(code?: string | null): "success" | "warning" | "error" | "info" | "default" {
  const colors: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
    SUPPORTIVE: "success",
    NEUTRAL: "info",
    CAUTION: "warning",
    RISK_OFF: "error",
    INSUFFICIENT_DATA: "default",
  };
  return code ? colors[code] ?? "default" : "default";
}

function SnapshotStatusBar({ meta, compact = false }: { meta: OpportunityWrappedResponse["meta"]; compact?: boolean }) {
  const isFallback = meta.source === "REALTIME_FALLBACK";
  const isStale = meta.isSourceNewerThanSnapshot === true;
  const latestJobStatus = meta.latestJobStatus;

  return (
    <Paper
      variant="outlined"
      sx={{
        mb: compact ? 1.5 : 3,
        p: compact ? 1 : 1.5,
        borderColor: isFallback || isStale ? "warning.main" : "divider",
        bgcolor: "rgba(255,255,255,0.76)",
        backdropFilter: "blur(12px)",
        boxShadow: compact ? "0 8px 22px rgba(16, 24, 40, 0.045)" : undefined,
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 1.25, md: 2 }}
        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 1, md: 2 }} sx={{ alignItems: { xs: "flex-start", md: "center" }, flex: 1 }}>
          {!compact && <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <CalendarMonthOutlinedIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Cập nhật: <Box component="span" sx={{ color: "text.primary", fontWeight: 600 }}>{formatDateTime(meta.snapshotGeneratedAt)}</Box>
            </Typography>
          </Stack>}
          {!compact && <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />}
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <LayersOutlinedIcon color="action" fontSize="small" />
            <Box>
              <Typography variant="caption" color="text.secondary">Tổng số mã sau lọc</Typography>
              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                {formatNumber(meta.totalAfterFilters, 0)}
              </Typography>
            </Box>
          </Stack>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <SettingsOutlinedIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">Job:</Typography>
            {latestJobStatus ? (
              <Tooltip title={jobStatusTooltip(latestJobStatus)}>
                <Chip size="small" label={jobStatusLabel(latestJobStatus)} color={jobStatusColor(latestJobStatus)} />
              </Tooltip>
            ) : (
              <Chip size="small" label={snapshotSourceLabel(meta.source)} color={isFallback ? "warning" : "success"} variant="outlined" />
            )}
            {isStale && <Chip size="small" label="Nguồn mới hơn snapshot" color="warning" />}
          </Stack>
        </Stack>

        <Button component={Link} to="/admin/data-status" size="small" variant="text" endIcon={<ArrowForwardIcon />} sx={{ whiteSpace: "nowrap" }}>
          Xem trạng thái dữ liệu
        </Button>
      </Stack>

      {isStale && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          Dữ liệu nguồn đã thay đổi sau lần cập nhật snapshot. Hãy vào{" "}
          <Link to="/admin/data-status" style={{ color: "inherit", fontWeight: 600 }}>
            Trạng thái dữ liệu
          </Link>{" "}
          và nhấn Recalculate Opportunities để xem kết quả mới nhất.
        </Alert>
      )}

      {!isStale && (isFallback || meta.warning) && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {meta.warning ?? "Chưa có snapshot phù hợp, hệ thống đang tính realtime nên có thể chậm."}
        </Alert>
      )}
    </Paper>
  );
}

function SummaryCards({ response }: { response: OpportunityWrappedResponse | null }) {
  const meta = response?.meta;
  const summary = response?.summary;

  return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", md: "repeat(3,minmax(0,1fr))", xl: "repeat(6,minmax(0,1fr))" },
          gap: 1.5,
          mb: 2,
        }}
      >
        <MetricCard
          icon={<FilterAltOutlinedIcon />}
          tone="primary"
          label="Sau lọc"
          value={formatNumber(meta?.totalAfterFilters, 0)}
          helper={`Ban đầu: ${formatNumber(meta?.totalBeforeFilters, 0)} mã`}
        />
        <MetricCard
          icon={<FilterAltOffOutlinedIcon />}
          tone="error"
          label="Đã loại thanh khoản thấp"
          value={formatNumber(meta?.excludedByLowLiquidity, 0)}
          helper={meta?.excludeLowLiquidity ? "Đang bật bộ lọc" : "Bộ lọc đang tắt"}
        />
        <MetricCard
          icon={<DonutSmallOutlinedIcon />}
          tone="primary"
          label="Trạng thái"
          value={<><Box component="span" color="primary.main">{count(summary?.decisionCounts, "WATCHLIST")}</Box> / <Box component="span" color="warning.main">{count(summary?.decisionCounts, "REVIEW")}</Box> / <Box component="span" color="text.secondary">{count(summary?.decisionCounts, "AVOID")}</Box></>}
          helper="Theo dõi / Review / Tránh"
        />
        <MetricCard
          icon={<ScienceOutlinedIcon />}
          tone="success"
          label="Sẵn sàng nghiên cứu"
          value={formatNumber(count(summary?.researchReadinessCounts, "READY_FOR_RESEARCH"), 0)}
          helper={`Theo dõi thêm: ${formatNumber(count(summary?.researchReadinessCounts, "WATCH_ONLY"), 0)}`}
        />
        <MetricCard
          icon={<TrendingUpOutlinedIcon />}
          tone="primary"
          label="Thanh khoản giao dịch"
          value={formatNumber(count(summary?.executionReadinessCounts, "READY_TO_TRADE"), 0)}
          helper={`Giới hạn quy mô: ${formatNumber(
            count(summary?.executionReadinessCounts, "TRADE_WITH_SIZE_LIMIT"),
            0
          )}`}
        />
        <MetricCard
          icon={<ShieldOutlinedIcon />}
          tone="primary"
          label="Độ tin cậy kết luận"
          value={<><Box component="span" color="success.main">{count(summary?.conclusionConfidenceCounts, "HIGH")}</Box> / <Box component="span" color="warning.main">{count(summary?.conclusionConfidenceCounts, "MEDIUM")}</Box> / <Box component="span" color="error.main">{count(summary?.conclusionConfidenceCounts, "LOW")}</Box></>}
          helper="Cao / TB / Thấp"
        />
      </Box>
  );
}

function TopIndustries({ topIndustries, summary }: { topIndustries: Array<[string, number]>; summary?: OpportunityWrappedResponse["summary"] }) {
  return <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", alignItems: "center", rowGap: 1, mb: 2 }}>
    <Typography variant="body2" sx={{ fontWeight: 700, mr: 0.5 }}>Top ngành</Typography>
    {topIndustries.length > 0 ? topIndustries.map(([name, value]) => (
      <Chip key={name} size="small" label={`${industryGroupLabel(name)}: ${formatNumber(value, 0)}`} variant="outlined" />
    )) : <Chip size="small" label="Chưa có dữ liệu ngành" variant="outlined" />}
    <Chip size="small" label={`Không cảnh báo lớn: ${formatNumber(summary?.noReasonCount, 0)}`} color="success" variant="outlined" />
  </Stack>;
}

function OpportunityTable({
  items,
  onOpenDetail,
}: {
  items: OpportunitySummaryItem[];
  onOpenDetail: (item: OpportunitySummaryItem) => void;
}) {
  const rankWidth = 48;
  const codeWidth = 300;
  const stickyRankSx = {
    position: "sticky",
    left: 0,
    zIndex: 2,
    minWidth: rankWidth,
    width: rankWidth,
    bgcolor: "background.paper",
  };
  const stickyCodeSx = {
    position: "sticky",
    left: rankWidth,
    zIndex: 2,
    minWidth: codeWidth,
    width: codeWidth,
    bgcolor: "background.paper",
    boxShadow: "2px 0 0 rgba(0,0,0,0.06)",
  };
  const stickyActionSx = {
    position: "sticky",
    right: 0,
    zIndex: 2,
    minWidth: 72,
    width: 72,
    bgcolor: "background.paper",
    boxShadow: "-2px 0 0 rgba(0,0,0,0.06)",
  };
  const stickyHeadSx = { bgcolor: "background.default", zIndex: 4 };

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 660, overflow: "auto" }}>
      <Table
        stickyHeader
        size="small"
        sx={{
          minWidth: 1250,
          "& .MuiTableCell-root": { px: 1, py: 0.8 },
          "& .MuiTableCell-head": { fontWeight: 700, whiteSpace: "nowrap" },
          "& .MuiTableRow-root:hover .MuiTableCell-root": { bgcolor: "#f7fbff" },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...stickyRankSx, ...stickyHeadSx }}>#</TableCell>
            <TableCell sx={{ ...stickyCodeSx, ...stickyHeadSx }}>Mã / Tên / Sàn / Ngành</TableCell>
            <TableCell align="right">
              <MetricTooltip
                label="Điểm"
                title="Điểm sàng lọc tổng hợp từ chất lượng, tăng trưởng, định giá và dữ liệu. Đây không phải khuyến nghị mua/bán."
              />
            </TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell>Lý do</TableCell>
            <TableCell>
              <MetricTooltip
                label="Độ tin cậy"
                title="Mức tin cậy của dữ liệu và kết luận. Điểm thấp thường do thiếu dữ liệu, giá cũ hoặc chất lượng dữ liệu chưa đủ."
              />
            </TableCell>
            <TableCell>Sẵn sàng</TableCell>
            <TableCell align="right">
              <MetricTooltip
                label="Định giá"
                title="P/E là giá trên lợi nhuận mỗi cổ phiếu; P/B là giá trên giá trị sổ sách mỗi cổ phiếu. Chỉ số thấp cần đọc cùng chất lượng doanh nghiệp."
              />
            </TableCell>
            <TableCell align="right">
              <MetricTooltip
                label="Tăng trưởng"
                title="DT là tăng trưởng doanh thu; LN là tăng trưởng lợi nhuận. Tăng trưởng cao cần kiểm tra tính bền vững."
              />
            </TableCell>
            <TableCell>
              <MetricTooltip
                label="Thanh khoản"
                title="Khả năng mua/bán cổ phiếu theo giá hợp lý. Thanh khoản thấp làm tăng rủi ro trượt giá và khó thoát vị thế."
              />
            </TableCell>
            <TableCell>
              <MetricTooltip
                label="Dòng ngành"
                title="Tín hiệu sector rotation: dòng tiền vào/ra ngành dựa trên hiệu suất giá và khối lượng tương đối. Đây là tín hiệu mô phỏng."
              />
            </TableCell>
            <TableCell align="right" sx={{ ...stickyActionSx, ...stickyHeadSx }}>
              Hành động
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={`${item.code}-${item.rank}`} hover>
              <TableCell sx={stickyRankSx}>
                <Typography variant="body2" sx={{ textAlign: "center" }}>{item.rank}</Typography>
              </TableCell>
              <TableCell sx={stickyCodeSx}>
                <Stack direction="row" spacing={0.65} sx={{ alignItems: "center", whiteSpace: "nowrap", overflow: "hidden" }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, minWidth: 38 }}>{item.code}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 132 }}>
                    {item.name}
                  </Typography>
                  {item.exchange && <Chip size="small" label={item.exchange} sx={compactChipSx} />}
                  {item.industryGroup && <Chip size="small" label={industryGroupLabel(item.industryGroup)} variant="outlined" sx={compactChipSx} />}
                </Stack>
              </TableCell>
              <TableCell align="right" sx={{ minWidth: 72 }}>
                <Tooltip title="Điểm sàng lọc tổng hợp, không phải khuyến nghị mua.">
                  <Chip
                    size="small"
                    label={formatNumber(item.finalScore)}
                    color={scoreColor(item.finalScore)}
                    sx={{ fontWeight: 700 }}
                  />
                </Tooltip>
              </TableCell>
              <TableCell sx={{ minWidth: 94 }}>
                <Chip label={decisionLabel(item.decision, item.decisionLabel)} color={decisionColor(item.decision)} size="small" />
              </TableCell>
              <TableCell sx={{ minWidth: 144 }}>
                <ReasonChips item={item} />
              </TableCell>
              <TableCell sx={{ minWidth: 100 }}>
                <Tooltip title={`Dữ liệu: ${item.dataConfidenceScore ? Math.round(item.dataConfidenceScore) : "?"}/100 (${confidenceLevelLabel(item.dataConfidenceLevel)}) · Kết luận: ${shortConfidenceLevel(item.conclusionConfidenceLevel)}`}>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                    <Chip
                      size="small"
                      label={item.dataConfidenceScore ? `${Math.round(item.dataConfidenceScore)}` : "?"}
                      color={dataConfidenceColor(item.dataConfidenceLevel)}
                      variant="outlined"
                      sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                    />
                    <Chip
                      size="small"
                      label={shortConfidenceLevel(item.conclusionConfidenceLevel)}
                      color={confidenceColor(item.conclusionConfidenceLevel)}
                    />
                  </Stack>
                </Tooltip>
              </TableCell>
              <TableCell sx={{ minWidth: 126 }}>
                <Tooltip title="Mức độ đáng mở hồ sơ nghiên cứu sâu.">
                  <Chip
                    size="small"
                    label={shortResearchLabel(item.researchReadiness)}
                    color={readinessColor(item.researchReadiness)}
                    sx={{ mb: 0.5 }}
                  />
                </Tooltip>
              </TableCell>
              <TableCell align="right" sx={{ minWidth: 122 }}>
                <Typography variant="caption" sx={{ display: "block" }}>P/E {formatNumber(item.pe)}</Typography>
                <Typography variant="caption" sx={{ display: "block" }}>P/B {formatNumber(item.pb)}</Typography>
              </TableCell>
              <TableCell align="right" sx={{ minWidth: 96 }}>
                <Typography variant="caption" sx={{ display: "block" }}>DT {formatPercent(item.revenueCagr)}</Typography>
                <Typography variant="caption" sx={{ display: "block" }}>LN {formatPercent(item.profitCagr)}</Typography>
              </TableCell>
              <TableCell sx={{ minWidth: 96 }}>
                <Tooltip title={item.liquidityWarning ? "Thanh khoản thấp, cần thận trọng khi mở hoặc thoát vị thế." : "Mức thanh khoản giao dịch."}>
                  <Chip size="small" label={liquidityLabel(item.liquidityLevel)} color={liquidityColor(item.liquidityLevel)} />
                </Tooltip>
              </TableCell>
              <TableCell sx={{ minWidth: 80 }}>
                {item.sectorMomentum ? (
                  <Tooltip title={`Sector rotation: ${item.sectorMomentum}${item.sectorRotationAdjustment != null ? ` (${item.sectorRotationAdjustment >= 0 ? "+" : ""}${item.sectorRotationAdjustment})` : ""}`}>
                    <Chip size="small" label={sectorMomentumLabel(item.sectorMomentum)} color={sectorMomentumColor(item.sectorMomentum)} variant="outlined" />
                  </Tooltip>
                ) : <Typography variant="caption" color="text.disabled">—</Typography>}
              </TableCell>
              <TableCell align="right" sx={stickyActionSx}>
                <Tooltip title="Xem chi tiết">
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => onOpenDetail(item)}
                    aria-label={`Xem chi tiết ${item.code}`}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function OpportunityDetailDrawer({
  open,
  code,
  detail,
  priceHistory,
  priceHistoryLoading,
  priceHistoryError,
  macroContext,
  macroContextLoading,
  macroContextError,
  sectorContext,
  sectorContextLoading,
  sectorContextError,
  loading,
  error,
  actionMessage,
  actionError,
  actionLoading,
  onCreateThesis,
  onAddWatchlist,
  onReject,
  onClose,
}: {
  open: boolean;
  code: string;
  detail: OpportunityDetailItem | null;
  priceHistory: StockPricePoint[];
  priceHistoryLoading: boolean;
  priceHistoryError: string;
  macroContext: MacroContext | null;
  macroContextLoading: boolean;
  macroContextError: string;
  sectorContext: SectorDecisionContext | null;
  sectorContextLoading: boolean;
  sectorContextError: string;
  loading: boolean;
  error: string;
  actionMessage: string;
  actionError: string;
  actionLoading: "" | "watchlist" | "reject";
  onCreateThesis: (item: OpportunityDetailItem) => void;
  onAddWatchlist: (item: OpportunityDetailItem) => void;
  onReject: (item: OpportunityDetailItem) => void;
  onClose: () => void;
}) {
  const primaryReasons = primaryDetailReasons(detail);
  const technicalReasons = technicalDetailReasons(detail);
  const riskReasons = detail ? mergeTextLists(detail.mainRisks, detail.risks).map(humanizeDetailText) : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      scroll="paper"
      slotProps={{
        paper: {
          sx: {
          width: "min(1480px, calc(100vw - 24px))",
          maxHeight: "calc(100vh - 18px)",
          borderRadius: 1.25,
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogTitle sx={{ p: 0, position: "sticky", top: 0, zIndex: 3, bgcolor: "background.paper" }}>
        <Box
          sx={{
            p: { xs: 1.25, sm: 1.5 },
            pr: { xs: 6, sm: 7 },
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            position: "relative",
          }}
        >
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", lg: "center" } }}>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1.1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    color: "primary.main",
                    bgcolor: "#eef6ff",
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  {code.slice(0, 3)}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                    <Typography variant="h4" sx={{ fontSize: { xs: 24, md: 30 }, lineHeight: 1 }}>
                      {code}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                      {detail?.name ?? "Đang tải chi tiết"}
                    </Typography>
                    <Chip
                      size="small"
                      color="warning"
                      variant="outlined"
                      label="Sàng lọc sơ bộ, không phải khuyến nghị mua/bán"
                    />
                  </Stack>
                  {detail && (
                    <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: "wrap", rowGap: 0.75 }}>
                      {detail.exchange && <Chip size="small" label={detail.exchange} variant="outlined" />}
                      {detail.industryGroup && <Chip size="small" label={`Ngành: ${industryGroupLabel(detail.industryGroup)}`} variant="outlined" />}
                    </Stack>
                  )}
                </Box>
              </Stack>
            </Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: { xs: "flex-start", lg: "flex-end" }, flexWrap: "wrap" }}>
              {detail && (
                <>
                  <Button variant="contained" size="small" onClick={() => onCreateThesis(detail)} sx={{ minHeight: 34 }}>
                    Tạo hồ sơ
                  </Button>
                  <Button variant="outlined" size="small" component={Link} to={`/stocks/${detail.code}`} sx={{ minHeight: 34 }}>
                    Xem hồ sơ cổ phiếu
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    component={Link}
                    to={`/valuation-scenarios?stockCode=${encodeURIComponent(detail.code)}`}
                    disabled={!detail.code}
                    sx={{ minHeight: 34 }}
                  >
                    Xem định giá
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={Boolean(actionLoading)}
                    onClick={() => onAddWatchlist(detail)}
                    sx={{ minHeight: 34 }}
                  >
                    {actionLoading === "watchlist" ? "Đang thêm..." : "Thêm vào watchlist"}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    disabled={Boolean(actionLoading)}
                    onClick={() => onReject(detail)}
                    sx={{ minHeight: 34 }}
                  >
                    {actionLoading === "reject" ? "Đang loại..." : "Loại bỏ"}
                  </Button>
                </>
              )}
              <IconButton
                onClick={onClose}
                aria-label="Đóng"
                sx={{ position: "absolute", top: 10, right: 10 }}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.25, sm: 1.5 }, bgcolor: "background.default" }}>
          {loading && <LinearProgress sx={{ mb: 2 }} />}
          {error && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {actionMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {actionMessage}
            </Alert>
          )}
          {actionError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {actionError}
            </Alert>
          )}

          {detail && (
          <Stack spacing={1.5}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "340px minmax(0, 1fr)" }, gap: 1.25, alignItems: "start" }}>
              <Stack spacing={1.25}>
                <AlphaSnapshotCard detail={detail} />
                <DetailMiniMetricStrip detail={detail} />
              </Stack>
              <Stack spacing={1.25}>
                <PriceMovementCard
                  detail={detail}
                  prices={priceHistory}
                  loading={priceHistoryLoading}
                  error={priceHistoryError}
                />
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 1.25 }}>
                  <NarrativePanel title="Luận điểm chính" tone="success" values={primaryReasons} fallback="Chưa có luận điểm chính." />
                  <NarrativePanel title="Rủi ro cần kiểm tra" tone="error" values={riskReasons} fallback="Chưa ghi nhận rủi ro chính." />
                </Box>
              </Stack>
            </Box>

            <MacroContextCard
              context={macroContext}
              loading={macroContextLoading}
              error={macroContextError}
              fallbackFinalScore={detail.finalScore}
            />

            <SectorDecisionContextCard
              detail={detail}
              context={sectorContext}
              loading={sectorContextLoading}
              error={sectorContextError}
            />

            <ValuationV2CompactTable detail={detail} />

            <DetailDashboardMetrics detail={detail} />

            <Accordion disableGutters sx={{ border: 1, borderColor: "divider", borderRadius: "12px !important", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Chi tiết đầy đủ Định giá V2
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <ValuationV2Card detail={detail} />
              </AccordionDetails>
            </Accordion>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                  Độ tin cậy dữ liệu
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.5, mb: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                      Điểm tin cậy
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={detail.dataConfidenceScore ? `${Math.round(detail.dataConfidenceScore)}/100` : "Chưa có"}
                        size="small"
                        color={dataConfidenceColor(detail.dataConfidenceLevel)}
                        sx={{ fontWeight: 700 }}
                      />
                      <Typography variant="body2" color={dataConfidenceColor(detail.dataConfidenceLevel)}>
                        {confidenceLevelLabel(detail.dataConfidenceLevel)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                      Mục đích
                    </Typography>
                    <Typography variant="body2">
                      Đánh giá mức độ nên tin vào các số liệu, không phải chất lượng doanh nghiệp
                    </Typography>
                  </Box>
                </Box>

                {detail.dataConfidenceWarnings && detail.dataConfidenceWarnings.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                      Cảnh báo dữ liệu
                    </Typography>
                    <Stack spacing={0.75}>
                      {detail.dataConfidenceWarnings.map((warning) => (
                        <Alert key={warning} severity="warning" sx={{ py: 0.75, px: 1, fontSize: "0.85rem" }}>
                          {dataConfidenceWarningLabel(warning)}
                        </Alert>
                      ))}
                    </Stack>
                  </Box>
                )}

                {(!detail.dataConfidenceWarnings || detail.dataConfidenceWarnings.length === 0) && (
                  <Alert severity="success" sx={{ mb: 2, py: 0.75, px: 1, fontSize: "0.85rem" }}>
                    Chưa phát hiện cảnh báo dữ liệu lớn.
                  </Alert>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                  Mức sẵn sàng
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.5 }}>
                  <MetricLine label="Độ tin cậy kết luận" value={confidenceLevelLabel(detail.conclusionConfidenceLevel)} />
                  <MetricLine label="Mức nghiên cứu" value={readinessLabel(detail.researchReadiness ?? "")} />
                  <MetricLine label="Khả năng giao dịch" value={executionLabel(detail.executionReadiness ?? "")} />
                </Box>

                {detail.dataConfidenceLevel === "LOW" || detail.dataConfidenceLevel === "VERY_LOW" ? (
                  <Alert severity="warning" sx={{ mt: 2, py: 0.75, px: 1, fontSize: "0.85rem" }}>
                    Không nên dùng riêng điểm cơ hội để ra quyết định khi độ tin cậy dữ liệu thấp.
                  </Alert>
                ) : null}
              </CardContent>
            </Card>

            {detail.cautionMessage && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {detail.cautionMessage}
              </Alert>
            )}

            {detail.industryProfileLabel && (
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                    Hồ sơ ngành: {detail.industryProfileLabel}
                  </Typography>
                  <Chip label={detail.industryProfileCategory ?? "GENERIC"} size="small" sx={{ mb: 1 }} />

                  {detail.industryInvalidMetrics && detail.industryInvalidMetrics.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">Chỉ số không áp dụng:</Typography>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                        {detail.industryInvalidMetrics.map((m) => (
                          <Chip key={m} label={m} size="small" color="default" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {detail.industryMissingMetrics && detail.industryMissingMetrics.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="warning.main">Chỉ số chuyên ngành chưa có:</Typography>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                        {detail.industryMissingMetrics.map((m) => (
                          <Chip key={m} label={m} size="small" color="warning" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {detail.industryWarnings && detail.industryWarnings.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {detail.industryWarnings.map((w, i) => (
                        <Alert key={i} severity="info" sx={{ mb: 0.5, py: 0 }}>
                          <Typography variant="caption">{w}</Typography>
                        </Alert>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
                  Giải thích quyết định
                </Typography>

                {detail.oneLineVerdict && (
                  <Alert severity="info" icon={false} sx={{ mb: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {detail.oneLineVerdict}
                    </Typography>
                  </Alert>
                )}

                {detail.explanationBullets && detail.explanationBullets.length > 0 && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                      Vì sao:
                    </Typography>
                    <ul style={{ margin: "0.5rem 0 0 1rem", paddingLeft: 0 }}>
                      {detail.explanationBullets.map((bullet, idx) => (
                        <li key={idx} style={{ marginBottom: "0.25rem" }}>
                          <Typography variant="caption" color="text.secondary">
                            {bullet}
                          </Typography>
                        </li>
                      ))}
                    </ul>
                  </Box>
                )}

                {detail.watchConditions && detail.watchConditions.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                      Cần theo dõi:
                    </Typography>
                    <ul style={{ margin: "0.5rem 0 0 1rem", paddingLeft: 0 }}>
                      {detail.watchConditions.map((condition, idx) => (
                        <li key={idx} style={{ marginBottom: "0.25rem" }}>
                          <Typography variant="caption" color="text.secondary">
                            {condition}
                          </Typography>
                        </li>
                      ))}
                    </ul>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
                  Tách lớp phân tích
                </Typography>

                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                  "Doanh nghiệp tốt không đồng nghĩa giá hiện tại hấp dẫn. Giá rẻ không đồng nghĩa đủ an toàn nếu chất lượng/dữ liệu yếu."
                </Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5, mb: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Chất lượng doanh nghiệp</Typography>
                    <Stack direction="row" spacing={0.75} sx={{ mt: 0.5, alignItems: "center", flexWrap: "wrap" }}>
                      <Chip
                        label={formatNumber(detail.businessQualityScore)}
                        color={businessQualityColor(detail.businessQualityLabel)}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                      <Typography variant="body2" sx={{ fontSize: "0.9rem" }}>
                        {businessQualityLabel(detail.businessQualityLabel)}
                      </Typography>
                    </Stack>
                    {detail.businessQualitySummary && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, lineHeight: 1.4 }}>
                        {detail.businessQualitySummary}
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">Định giá</Typography>
                    <Stack direction="row" spacing={0.75} sx={{ mt: 0.5, alignItems: "center", flexWrap: "wrap" }}>
                      <Chip
                        label={formatNumber(detail.valuationAttractivenessScore)}
                        color={valuationColor(detail.valuationLabel)}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                      <Typography variant="body2" sx={{ fontSize: "0.9rem" }}>
                        {valuationLabelDisplay(detail.valuationLabel)}
                      </Typography>
                    </Stack>
                    {detail.valuationSummary && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, lineHeight: 1.4 }}>
                        {detail.valuationSummary}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {detail.finalDecisionSummary && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                      Kết luận
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0, lineHeight: 1.6 }}>
                      {detail.finalDecisionSummary}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                  Định giá chi tiết
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.5 }}>
                  <MetricLine label="Giá" value={`${formatNumber(detail.latestPrice)}k`} />
                  <MetricLine label="Ngày giá" value={detail.latestPriceDate ?? "-"} />
                  <MetricLine
                    label="P/E"
                    tooltip="P/E = giá cổ phiếu chia cho lợi nhuận mỗi cổ phiếu. P/E thấp có thể rẻ, nhưng cũng có thể là bẫy nếu lợi nhuận suy giảm."
                    value={formatNumber(detail.pe)}
                  />
                  <MetricLine
                    label="P/B"
                    tooltip="P/B = giá cổ phiếu chia cho giá trị sổ sách mỗi cổ phiếu. Hữu ích với ngân hàng, bảo hiểm và doanh nghiệp tài sản lớn."
                    value={formatNumber(detail.pb)}
                  />
                  <MetricLine
                    label="ROIC"
                    tooltip="Return on Invested Capital — lợi nhuận trên vốn đầu tư. ROIC > 15% thường cho thấy lợi thế cạnh tranh bền vững."
                    value={detail.roic != null ? formatPercent(detail.roic) : "-"}
                  />
                  <MetricLine
                    label="FCF Yield"
                    tooltip="Free Cash Flow Yield — tỷ suất dòng tiền tự do trên vốn hóa. FCF Yield > 8% thường hấp dẫn."
                    value={detail.fcfYield != null ? formatPercent(detail.fcfYield) : "-"}
                  />
                  <MetricLine label="Điểm định giá" value={formatNumber(detail.valueScore)} />
                  <MetricLine label="Biên an toàn" value={formatNumber(detail.marginOfSafetyScore)} />
                </Box>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                  Tăng trưởng & chất lượng
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.5 }}>
                  <MetricLine label="Tăng trưởng doanh thu" value={formatPercent(detail.revenueCagr)} />
                  <MetricLine label="Tăng trưởng lợi nhuận" value={formatPercent(detail.profitCagr)} />
                  <MetricLine label="ROE" value={formatPercent(detail.averageRoe)} />
                  <MetricLine label="Biên lợi nhuận ròng" value={formatPercent(detail.latestNetProfitMargin)} />
                  <MetricLine label="CFO/LNST" value={formatNumber(detail.averageCfoToNetProfit)} />
                  <MetricLine label="Nợ/VCSH" value={formatNumber(detail.averageDebtToEquity)} />
                </Box>
              </CardContent>
            </Card>
            </Box>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                  Dữ liệu & ngành
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.5 }}>
                  <MetricLine label="Điểm dữ liệu" value={formatNumber(detail.dataCompletenessScore)} />
                  <MetricLine label="Thanh khoản" value={liquidityLabel(detail.liquidityLevel)} />
                  <MetricLine label="Ngành" value={industryGroupLabel(detail.industryGroup)} />
                  <MetricLine label="Chi tiết ngành" value={industryLabel(detail.industry)} />
                </Box>
              </CardContent>
            </Card>

            <DetailList title="Lý do chính" values={primaryReasons} />
            <TechnicalDetailAccordion title="Chi tiết kỹ thuật" values={technicalReasons} />
            <DetailList title="Rủi ro chính" values={mergeTextLists(detail.mainRisks, detail.risks).map(humanizeDetailText)} />
            <DetailList title="Cảnh báo dữ liệu" values={detail.dataQualityWarnings} />
            {detail.missingRequiredMetrics && detail.missingRequiredMetrics.length > 0 && (
              <DetailList title="Chỉ số chuyên ngành còn thiếu" values={detail.missingRequiredMetrics.map(metricLabel)} />
            )}
          </Stack>
          )}
      </DialogContent>
    </Dialog>
  );
}

function AlphaSnapshotCard({ detail }: { detail: OpportunityDetailItem }) {
  const score = Number.isFinite(detail.finalScore ?? NaN) ? Math.max(0, Math.min(10, detail.finalScore ?? 0)) : 0;
  const scorePercent = score * 10;
  const healthRows = [
    { label: "Trạng thái", value: decisionLabel(detail.decision, detail.decisionLabel), color: decisionColor(detail.decision) },
    { label: "Mức sẵn sàng", value: readinessLabel(detail.researchReadiness ?? ""), color: readinessColor(detail.researchReadiness) },
    { label: "Giao dịch", value: executionLabel(detail.executionReadiness ?? ""), color: executionColor(detail.executionReadiness) },
    { label: "Độ tin cậy dữ liệu", value: confidenceLevelLabel(detail.dataConfidenceLevel), color: dataConfidenceColor(detail.dataConfidenceLevel) },
    { label: "Thanh khoản", value: liquidityLabel(detail.liquidityLevel), color: liquidityColor(detail.liquidityLevel) },
    { label: "Loại cơ hội", value: opportunityTypeLabel(detail.opportunityType), color: "default" as BadgeColor },
  ];
  const scoreBars = [
    { label: "Chất lượng", value: detail.qualityScore, color: "success.main" },
    { label: "Tăng trưởng", value: detail.growthScore, color: "success.main" },
    { label: "Định giá", value: detail.valuationScore, color: "warning.main" },
    { label: "Tín hiệu", value: detail.signalScore, color: "warning.main" },
  ];

  return (
    <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
      <CardContent sx={{ p: "12px !important" }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mb: 1.2 }}>
          <DonutSmallOutlinedIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Alpha snapshot
          </Typography>
          <MetricTooltip
            label=""
            title="Tóm tắt nhanh điểm cơ hội, trạng thái, chất lượng dữ liệu và các lớp điểm chính. Đây là dữ liệu sàng lọc, không phải khuyến nghị đầu tư."
          />
        </Stack>

        <Stack spacing={1.1}>
          <Box sx={{ textAlign: "center" }}>
            <Box sx={{ position: "relative", width: 126, height: 126, mx: "auto" }}>
              <CircularProgress
                variant="determinate"
                value={100}
                size="100%"
                thickness={4.2}
                sx={{ color: "#edf1f7", position: "absolute", inset: 0 }}
              />
              <CircularProgress
                variant="determinate"
                value={scorePercent}
                size="100%"
                thickness={4.2}
                sx={{
                  color: score >= 8 ? "success.main" : score >= 6.5 ? "warning.main" : "error.main",
                  position: "absolute",
                  inset: 0,
                  transform: "rotate(-120deg) !important",
                  "& .MuiCircularProgress-circle": { strokeLinecap: "round" },
                }}
              />
              <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                <Box>
                  <Typography variant="h3" sx={{ fontSize: 42, fontWeight: 850, color: score >= 8 ? "success.main" : "text.primary", lineHeight: 1 }}>
                    {formatNumber(detail.finalScore)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    /10
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              Điểm tổng hợp
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 0.65 }}>
            {healthRows.map((row) => (
              <Box
                key={row.label}
                sx={{
                  p: 0.75,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "#fbfdff",
                  minWidth: 0,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.05, mb: 0.45, whiteSpace: "nowrap" }}>
                  {row.label}
                </Typography>
                <Chip
                  size="small"
                  label={row.value}
                  color={row.color}
                  variant={row.color === "default" ? "outlined" : "filled"}
                  sx={{
                    ...compactChipSx,
                    width: "100%",
                    maxWidth: "100%",
                    justifyContent: "center",
                    "& .MuiChip-label": {
                      ...compactChipSx["& .MuiChip-label"],
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    },
                  }}
                />
              </Box>
            ))}
          </Box>

          {detail.decisionSubLabel && (
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", fontStyle: "italic" }}>
              {detail.decisionSubLabel}
            </Typography>
          )}

          {detail.positiveReasonLabels && detail.positiveReasonLabels.length > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", justifyContent: "center", gap: 0.5 }}>
              {detail.positiveReasonLabels.map((label: string) => (
                <Chip key={label} label={label} size="small" color="success" variant="outlined" sx={compactChipSx} />
              ))}
            </Stack>
          )}

          <Stack spacing={0.75}>
            {scoreBars.map((item) => {
              const value = Number.isFinite(item.value ?? NaN) ? Math.max(0, Math.min(10, item.value ?? 0)) : 0;
              return (
                <Box key={item.label}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.45 }}>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      {formatNumber(item.value)}
                    </Typography>
                  </Stack>
                  <Box sx={{ height: 6, borderRadius: 99, bgcolor: "#edf1f7", overflow: "hidden" }}>
                    <Box sx={{ width: `${value * 10}%`, height: "100%", borderRadius: 99, bgcolor: item.color }} />
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function NarrativePanel({
  title,
  values,
  fallback,
  tone,
}: {
  title: string;
  values: string[];
  fallback: string;
  tone: "success" | "error";
}) {
  const visible = values.slice(0, 4);
  const color = tone === "success" ? "success.main" : "error.main";
  const bg = tone === "success" ? "rgba(18, 130, 74, 0.08)" : "rgba(216, 58, 66, 0.08)";

  return (
    <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
      <CardContent sx={{ p: "12px !important" }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mb: 0.85 }}>
          <Box sx={{ width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: bg, color }}>
            {tone === "success" ? "✓" : "!"}
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {title}
          </Typography>
        </Stack>
        <Stack spacing={0.62}>
          {visible.length > 0 ? (
            visible.map((value, index) => (
              <Stack key={`${value}-${index}`} direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: color, mt: 0.75, flexShrink: 0 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                  {value}
                </Typography>
              </Stack>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              {fallback}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function DetailDashboardMetrics({ detail }: { detail: OpportunityDetailItem }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 1.5 }}>
      <CompactDashboardCard
        title="Dữ liệu & ngành"
        rows={[
          ["Điểm dữ liệu", formatNumber(detail.dataCompletenessScore)],
          ["Thanh khoản", liquidityLabel(detail.liquidityLevel)],
          ["Ngành", industryGroupLabel(detail.industryGroup)],
          ["Chi tiết ngành", industryLabel(detail.industry)],
        ]}
        action="Xem thêm dữ liệu ngành"
      />
      <CompactDashboardCard
        title="Độ tin cậy dữ liệu"
        highlight={detail.dataConfidenceScore ? `${Math.round(detail.dataConfidenceScore)}/100` : "Chưa có"}
        highlightTone={dataConfidenceColor(detail.dataConfidenceLevel)}
        badge={confidenceLevelLabel(detail.dataConfidenceLevel)}
        rows={[
          ["Độ tin cậy mô hình", confidenceLevelLabel(detail.conclusionConfidenceLevel)],
          ["Cảnh báo dữ liệu", detail.dataConfidenceWarnings?.length ? `${detail.dataConfidenceWarnings.length} cảnh báo` : "Không phát hiện"],
        ]}
      />
      <CompactDashboardCard
        title="Tăng trưởng & chất lượng"
        rows={[
          ["Tăng trưởng doanh thu", formatPercent(detail.revenueCagr)],
          ["Tăng trưởng lợi nhuận", formatPercent(detail.profitCagr)],
          ["ROE", formatPercent(detail.averageRoe)],
          ["Biên lợi nhuận ròng", formatPercent(detail.latestNetProfitMargin)],
        ]}
        action="Xem chi tiết"
      />
      <CompactDashboardCard
        title="Tách lớp phân tích"
        rows={[
          ["CFO/LNST", formatNumber(detail.averageCfoToNetProfit)],
          ["Nợ/VCSH", formatNumber(detail.averageDebtToEquity)],
          ["Chất lượng", businessQualityLabel(detail.businessQualityLabel)],
          ["Định giá", valuationLabelDisplay(detail.valuationLabel)],
        ]}
        action="Xem chi tiết"
      />
    </Box>
  );
}

function DetailMiniMetricStrip({ detail }: { detail: OpportunityDetailItem }) {
  const items = [
    ["P/E", formatNumber(detail.pe)],
    ["P/B", formatNumber(detail.pb)],
    ["ROE", formatPercent(detail.averageRoe)],
    ["LN YoY", formatPercent(detail.profitCagr)],
  ];

  return (
    <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
      <CardContent sx={{ p: "10px !important" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 0.75 }}>
          {items.map(([label, value]) => (
            <Box key={label} sx={{ p: 0.8, borderRadius: 1, bgcolor: "#f7fbff", border: 1, borderColor: "divider" }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1 }}>
                {label}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.25 }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

function ValuationV2CompactTable({ detail }: { detail: OpportunityDetailItem }) {
  const rows = [
    {
      layer: "So với lịch sử",
      status: historicalLabelVi(detail.historicalValuationLabel),
      color: historicalLabelColor(detail.historicalValuationLabel),
      score: fmtScore(detail.historicalValuationScore),
      pe: fmtX(detail.pe),
      pb: fmtX(detail.pb),
      note: detail.historicalValuationExplanation ?? "So sánh P/E, P/B hiện tại với vùng định giá lịch sử.",
      show: detail.historicalValuationLabel != null,
    },
    {
      layer: "So với ngành",
      status: industryLabelVi(detail.industryMedianLabel),
      color: industryLabelColor(detail.industryMedianLabel),
      score: fmtScore(detail.industryMedianScore),
      pe: fmtX(detail.industryMedianPe),
      pb: fmtX(detail.industryMedianPb),
      note: detail.industryMedianExplanation ?? "So sánh với trung vị các mã cùng ngành.",
      show: detail.industryMedianLabel != null,
    },
    {
      layer: "Sau khi xét chất lượng",
      status: qualityAdjustedLabelVi(detail.qualityAdjustedValuationLabel),
      color: qualityAdjustedLabelColor(detail.qualityAdjustedValuationLabel),
      score: fmtScore(detail.qualityAdjustedValuationScore),
      pe: detail.qualityPremiumStatus ?? "-",
      pb: detail.valueTrapRiskLevel ?? "-",
      note: detail.qualityAdjustedValuationExplanation ?? "Đọc định giá cùng chất lượng doanh nghiệp.",
      show: detail.qualityAdjustedValuationLabel != null,
    },
    {
      layer: "PEG & tăng trưởng",
      status: growthLabelVi(detail.growthAlignmentLabel),
      color: growthLabelColor(detail.growthAlignmentLabel),
      score: fmtScore(detail.growthAlignmentScore),
      pe: detail.pegRatio != null ? formatNumber(detail.pegRatio) : "-",
      pb: detail.expectedPeMin != null && detail.expectedPeMax != null ? `${formatNumber(detail.expectedPeMin, 0)}-${formatNumber(detail.expectedPeMax, 0)}x` : "-",
      note: detail.growthAdjustedExplanation ?? "Kiểm tra P/E có hợp lý với tăng trưởng hay không.",
      show: detail.growthAlignmentLabel != null,
    },
  ].filter((row) => row.show);

  if (rows.length === 0) return null;

  return (
    <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
      <CardContent sx={{ p: "12px !important" }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 850 }}>
            Định giá V2
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Tách lớp định giá, không phải khuyến nghị mua/bán tự động.
          </Typography>
        </Stack>
        <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: "none", borderRadius: 1.5 }}>
          <Table size="small" sx={{ "& .MuiTableCell-root": { py: 0.65, px: 1 }, "& .MuiTableCell-head": { fontWeight: 800, bgcolor: "#f7fbff" } }}>
            <TableHead>
              <TableRow>
                <TableCell>Lớp phân tích</TableCell>
                <TableCell>Đánh giá</TableCell>
                <TableCell align="right">Điểm</TableCell>
                <TableCell align="right">P/E / PEG</TableCell>
                <TableCell align="right">P/B / Kỳ vọng</TableCell>
                <TableCell>Diễn giải nhanh</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.layer}>
                  <TableCell sx={{ fontWeight: 750 }}>{row.layer}</TableCell>
                  <TableCell>
                    <Chip size="small" label={row.status} color={row.color} sx={compactChipSx} />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>{row.score}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 750 }}>{row.pe}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 750 }}>{row.pb}</TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", maxWidth: 520, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row.note}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

function CompactDashboardCard({
  title,
  rows,
  highlight,
  highlightTone = "primary",
  badge,
  action,
}: {
  title: string;
  rows: Array<[string, string]>;
  highlight?: string;
  highlightTone?: BadgeColor;
  badge?: string;
  action?: string;
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
      <CardContent sx={{ p: "14px !important" }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
            {title}
          </Typography>
          {badge && <Chip size="small" label={badge} color={highlightTone} sx={compactChipSx} />}
        </Stack>
        {highlight && (
          <Typography
            variant="h4"
            sx={{ mb: 1, fontSize: 28, fontWeight: 850, color: highlightTone === "default" ? "text.primary" : `${highlightTone}.main` }}
          >
            {highlight}
          </Typography>
        )}
        <Stack spacing={0.85}>
          {rows.map(([label, value]) => (
            <Stack key={label} direction="row" spacing={1} sx={{ justifyContent: "space-between", borderBottom: 1, borderColor: "divider", pb: 0.65 }}>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, textAlign: "right" }}>
                {value}
              </Typography>
            </Stack>
          ))}
        </Stack>
        {action && (
          <Typography variant="caption" color="primary.main" sx={{ display: "block", mt: 1.2, fontWeight: 800 }}>
            {action} →
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function PriceMovementCard({
  detail,
  prices,
  loading,
  error,
}: {
  detail: OpportunityDetailItem;
  prices: StockPricePoint[];
  loading: boolean;
  error: string;
}) {
  const [range, setRange] = useState<PriceChartRange>("1Y");
  const [granularity, setGranularity] = useState<PriceChartGranularity>("DAY");
  const validPrices = useMemo(
    () =>
      prices.filter(
        (point): point is StockPricePoint & { closePrice: number } =>
          typeof point.closePrice === "number" && Number.isFinite(point.closePrice)
      ),
    [prices]
  );
  const visiblePrices = useMemo(
    () => aggregatePriceHistory(filterPriceHistory(validPrices, range), granularity),
    [validPrices, range, granularity]
  );
  const chart = buildPriceHistoryChart(visiblePrices);
  const rangeLabel = priceChartRanges.find((item) => item.value === range)?.label ?? range;
  const granularityLabel = priceChartGranularities.find((item) => item.value === granularity)?.label ?? granularity;

  return (
    <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
      <CardContent sx={{ p: "12px !important" }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 0.8 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Biểu đồ giá
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Lịch sử 1 năm từ stock_prices
            </Typography>
          </Box>
          <Chip
            size="small"
            color={priceTrendColor(detail.priceTrendLevel)}
            label={priceTrendLabel(detail.priceTrendLevel)}
            variant="outlined"
          />
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, mb: 0.9 }}
        >
          <SegmentedControl options={priceChartRanges} value={range} onChange={setRange} />
          <SegmentedControl options={priceChartGranularities} value={granularity} onChange={setGranularity} />
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.7 }}>
          Đang xem: {rangeLabel} · {granularityLabel} · {visiblePrices.length} điểm dữ liệu
        </Typography>

        {loading && <LinearProgress sx={{ mb: 1.5 }} />}
        {error && (
          <Alert severity="warning" sx={{ mb: 1.5, py: 0.75 }}>
            {error}
          </Alert>
        )}

        {chart ? (
          <Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 126px" }, gap: 1, alignItems: "stretch" }}>
              <Box
                component="svg"
                viewBox="0 0 640 260"
                role="img"
                aria-label={`Biểu đồ giá ${detail.code}`}
                sx={{
                  width: "100%",
                  height: { xs: 260, md: 330 },
                  display: "block",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  bgcolor: "background.paper",
                }}
              >
              <rect x="0" y="0" width="640" height="260" fill="#fff" />
              {[0, 1, 2, 3].map((index) => {
                const y = chart.top + (chart.priceHeight / 3) * index;
                return <line key={index} x1="52" y1={y} x2="610" y2={y} stroke="#edf1f7" />;
              })}
              {chart.volumeBars.map((bar, index) => (
                <rect key={`${bar.x}-${index}`} x={bar.x} y={bar.y} width={bar.width} height={bar.height} fill="#d9e8ff" />
              ))}
              <polyline
                points={chart.closePolyline}
                fill="none"
                stroke="#0d47a1"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {chart.hoverPoints.map((point) => (
                <circle key={point.date} cx={point.x} cy={point.y} r="7" fill="transparent">
                  <title>{`${formatFullDate(point.date)} | Giá ${formatNumber(point.close)}k | KL ${formatNumber(point.volume, 0)}`}</title>
                </circle>
              ))}
              {chart.markers.map((marker) => (
                <g key={marker.label}>
                  <circle cx={marker.x} cy={marker.y} r="4" fill={marker.color} />
                  <text x={marker.x} y={marker.labelY} textAnchor="middle" fontSize="11" fill="#152033" fontWeight="700">
                    {marker.label}
                  </text>
                </g>
              ))}
              <text x="52" y="22" fontSize="11" fill="#526070">
                {formatNumber(chart.maxClose)}k
              </text>
              <text x="52" y="154" fontSize="11" fill="#526070">
                {formatNumber(chart.minClose)}k
              </text>
              <text x="52" y="244" fontSize="11" fill="#526070">
                Vol
              </text>
              {chart.dateLabels.map((label) => (
                <text key={label.text} x={label.x} y="184" textAnchor={label.anchor} fontSize="11" fill="#526070">
                  {label.text}
                </text>
              ))}
              </Box>
              <Box
                sx={{
                  display: { xs: "none", xl: "grid" },
                  gap: 0.55,
                  p: 0.8,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1.5,
                  bgcolor: "#fbfdff",
                  alignContent: "start",
                }}
              >
                <CompactMetric label="Giá hiện tại" value={`${formatNumber(detail.latestPrice)}k`} />
                <CompactMetric label="Thay đổi 52W" value={formatPercent(detail.drawdownFrom52wHigh)} />
                <CompactMetric label="Cao nhất" value={`${formatNumber(chart.maxClose)}k`} />
                <CompactMetric label="Ngày cao nhất" value={formatFullDate(chart.highDate)} />
                <CompactMetric label="Thấp nhất" value={`${formatNumber(chart.minClose)}k`} />
                <CompactMetric label="Ngày thấp nhất" value={formatFullDate(chart.lowDate)} />
              </Box>
            </Box>
            <Box sx={{ display: { xs: "grid", xl: "none" }, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(6, minmax(0, 1fr))" }, gap: 0.75, mt: 0.9 }}>
              <CompactMetric label="Đầu kỳ" value={`${formatNumber(chart.firstClose)}k`} />
              <CompactMetric label="Cuối kỳ" value={`${formatNumber(chart.lastClose)}k`} />
              <CompactMetric label="Cao nhất" value={`${formatNumber(chart.maxClose)}k`} />
              <CompactMetric label="Thấp nhất" value={`${formatNumber(chart.minClose)}k`} />
              <CompactMetric label="Ngày cao nhất" value={formatFullDate(chart.highDate)} />
              <CompactMetric label="Ngày thấp nhất" value={formatFullDate(chart.lowDate)} />
            </Box>
          </Box>
        ) : (
          <Alert severity="info">
            Chưa đủ lịch sử giá để vẽ biểu đồ.
          </Alert>
        )}

        <Box sx={{ display: { xs: "grid", md: "none" }, gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1, mt: 1 }}>
          <CompactMetric label="Giá gần nhất" value={`${formatNumber(detail.latestPrice)}k`} />
          <CompactMetric label="Ngày giá" value={detail.latestPriceDate ?? "-"} />
          <CompactMetric label="Cách đỉnh 52W" value={formatPercent(detail.drawdownFrom52wHigh)} />
        </Box>
      </CardContent>
    </Card>
  );
}

function filterPriceHistory(prices: Array<StockPricePoint & { closePrice: number }>, range: PriceChartRange) {
  const option = priceChartRanges.find((item) => item.value === range);
  if (!option?.days || prices.length === 0) return prices;
  const latest = new Date(prices[prices.length - 1].priceDate);
  if (Number.isNaN(latest.getTime())) return prices;
  const fromTime = latest.getTime() - option.days * 24 * 60 * 60 * 1000;
  return prices.filter((point) => {
    const date = new Date(point.priceDate);
    return !Number.isNaN(date.getTime()) && date.getTime() >= fromTime;
  });
}

function aggregatePriceHistory(
  prices: Array<StockPricePoint & { closePrice: number }>,
  granularity: PriceChartGranularity
): Array<StockPricePoint & { closePrice: number }> {
  if (granularity === "DAY") return prices;
  const groups = new Map<string, Array<StockPricePoint & { closePrice: number }>>();
  prices.forEach((point) => {
    const key = granularity === "MONTH" ? point.priceDate.slice(0, 7) : point.priceDate.slice(0, 4);
    groups.set(key, [...(groups.get(key) ?? []), point]);
  });

  return Array.from(groups.values()).map((group) => {
    const first = group[0];
    const last = group[group.length - 1];
    const highs = group.map((point) => point.highPrice ?? point.closePrice);
    const lows = group.map((point) => point.lowPrice ?? point.closePrice);
    return {
      ...last,
      priceDate: last.priceDate,
      openPrice: first.openPrice ?? first.closePrice,
      highPrice: Math.max(...highs),
      lowPrice: Math.min(...lows),
      closePrice: last.closePrice,
      volume: group.reduce((sum, point) => sum + (point.volume ?? 0), 0),
      tradingValue: group.reduce((sum, point) => sum + (point.tradingValue ?? 0), 0),
    };
  });
}

function buildPriceHistoryChart(prices: Array<StockPricePoint & { closePrice: number }>) {
  if (prices.length < 2) return null;
  const left = 52;
  const right = 610;
  const top = 20;
  const priceBottom = 158;
  const volumeTop = 198;
  const volumeBottom = 240;
  const width = right - left;
  const priceHeight = priceBottom - top;
  const closes = prices.map((point) => point.closePrice);
  const minClose = Math.min(...closes);
  const maxClose = Math.max(...closes);
  const closeRange = Math.max(0.01, maxClose - minClose);
  const maxVolume = Math.max(...prices.map((point) => point.volume ?? 0), 1);
  const xStep = width / (prices.length - 1);
  const mapY = (value: number) => priceBottom - ((value - minClose) / closeRange) * priceHeight;
  const chartPoints = prices.map((point, index) => ({
    date: point.priceDate,
    close: point.closePrice,
    volume: point.volume ?? 0,
    x: left + index * xStep,
    y: mapY(point.closePrice),
  }));
  const barWidth = Math.max(1, Math.min(4, width / prices.length - 1));
  const first = chartPoints[0];
  const last = chartPoints[chartPoints.length - 1];
  const high = chartPoints.reduce((best, point) => (point.close > best.close ? point : best), first);
  const low = chartPoints.reduce((best, point) => (point.close < best.close ? point : best), first);

  return {
    top,
    priceHeight,
    firstClose: first.close,
    lastClose: last.close,
    minClose,
    maxClose,
    closePolyline: chartPoints.map((point) => `${point.x},${point.y}`).join(" "),
    volumeBars: chartPoints.map((point) => {
      const height = (point.volume / maxVolume) * (volumeBottom - volumeTop);
      return {
        x: point.x - barWidth / 2,
        y: volumeBottom - height,
        width: barWidth,
        height,
      };
    }),
    markers: [
      { label: `${formatNumber(high.close)}k · ${formatShortDate(high.date)}`, x: high.x, y: high.y, labelY: Math.max(14, high.y - 10), color: "#15803d" },
      { label: `${formatNumber(low.close)}k · ${formatShortDate(low.date)}`, x: low.x, y: low.y, labelY: Math.min(176, low.y + 18), color: "#b91c1c" },
    ],
    hoverPoints: chartPoints,
    dateLabels: [
      { text: formatShortDate(first.date), x: left, anchor: "start" as const },
      { text: formatShortDate(chartPoints[Math.floor(chartPoints.length / 2)].date), x: left + width / 2, anchor: "middle" as const },
      { text: formatShortDate(last.date), x: right, anchor: "end" as const },
    ],
    firstDate: first.date,
    lastDate: last.date,
    highDate: high.date,
    lowDate: low.date,
  };
}

function priceTrendLabel(value?: string | null) {
  const normalized = (value ?? "").toUpperCase();
  if (normalized.includes("STRONG_UP")) return "Tăng mạnh";
  if (normalized.includes("UP")) return "Tăng";
  if (normalized.includes("STRONG_DOWN")) return "Giảm mạnh";
  if (normalized.includes("DOWN")) return "Giảm";
  if (normalized.includes("SIDEWAY") || normalized.includes("FLAT")) return "Đi ngang";
  return "Chưa rõ";
}

function priceTrendColor(value?: string | null): BadgeColor {
  const normalized = (value ?? "").toUpperCase();
  if (normalized.includes("UP")) return "success";
  if (normalized.includes("DOWN")) return "warning";
  if (normalized.includes("SIDEWAY") || normalized.includes("FLAT")) return "info";
  return "default";
}

function ReasonChips({ item }: { item: OpportunitySummaryItem }) {
  if (!item.decisionReasonCodes || item.decisionReasonCodes.length === 0) {
    return <Chip size="small" label="Không cảnh báo lớn" color="success" variant="outlined" />;
  }

  const visible = item.decisionReasonCodes.slice(0, 2);
  const hiddenCount = item.decisionReasonCodes.length - visible.length;

  return (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
      {visible.map((code, index) => (
        <Tooltip key={`${code}-${index}`} title={reasonTooltip(code)}>
          <Chip
            size="small"
            label={shortReasonLabel(code)}
            color={reasonColor(code)}
            variant="outlined"
          />
        </Tooltip>
      ))}
      {hiddenCount > 0 && <Chip size="small" label={`+${hiddenCount}`} variant="outlined" />}
    </Stack>
  );
}

function DetailList({ title, values }: { title: string; values?: string[] }) {
  const cleanValues = (values ?? []).map(humanizeDetailText).filter(Boolean);
  if (cleanValues.length === 0) return null;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
          {title}
        </Typography>
        <Stack spacing={0.75}>
          {cleanValues.map((value, index) => (
            <Typography key={`${value}-${index}`} variant="body2">
              {value}
            </Typography>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

function TechnicalDetailAccordion({ title, values }: { title: string; values?: string[] }) {
  const cleanValues = (values ?? []).map(humanizeDetailText).filter(Boolean);
  if (cleanValues.length === 0) return null;

  return (
    <Accordion disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={0.75}>
          {cleanValues.map((value, index) => (
            <Typography key={`${value}-${index}`} variant="body2" color="text.secondary">
              {value}
            </Typography>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon,
  tone = "primary",
}: {
  label: string;
  value: ReactNode;
  helper?: string;
  icon: ReactNode;
  tone?: MetricTone;
}) {
  const toneStyles: Record<MetricTone, { color: string; background: string; shadow: string }> = {
    primary: { color: "primary.main", background: "rgba(37, 99, 235, 0.09)", shadow: "rgba(37, 99, 235, 0.12)" },
    success: { color: "success.main", background: "rgba(22, 163, 74, 0.09)", shadow: "rgba(22, 163, 74, 0.12)" },
    warning: { color: "warning.main", background: "rgba(234, 88, 12, 0.09)", shadow: "rgba(234, 88, 12, 0.12)" },
    error: { color: "error.main", background: "rgba(220, 38, 38, 0.08)", shadow: "rgba(220, 38, 38, 0.12)" },
  };

  return (
    <Card sx={{ minWidth: 0, borderRadius: 3, overflow: "hidden" }}>
      <CardContent sx={{ p: "14px !important", minHeight: 118 }}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: toneStyles[tone].color,
              bgcolor: toneStyles[tone].background,
              boxShadow: `0 10px 22px ${toneStyles[tone].shadow}`,
            }}
          >
            {icon}
          </Box>
          <TinySparkline tone={tone} />
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.25, fontWeight: 800, lineHeight: 1.2, color: tone === "error" ? "error.main" : tone === "success" ? "success.main" : "text.primary", whiteSpace: "nowrap" }}>
          {value}
        </Typography>
        {helper && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            {helper}
          </Typography>
        )}
        <Box sx={{ mt: 1.1, height: 4, borderRadius: 99, bgcolor: "#e9eef6", overflow: "hidden" }}>
          <Box
            sx={{
              width: tone === "error" ? "62%" : tone === "success" ? "76%" : tone === "warning" ? "54%" : "68%",
              height: "100%",
              borderRadius: 99,
              bgcolor: toneStyles[tone].color,
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

function TinySparkline({ tone }: { tone: MetricTone }) {
  const stroke: Record<MetricTone, string> = {
    primary: "#2563eb",
    success: "#16a34a",
    warning: "#f59e0b",
    error: "#ef4444",
  };

  return (
    <Box
      component="svg"
      viewBox="0 0 74 30"
      sx={{ width: 74, height: 30, color: stroke[tone], opacity: 0.82, flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d="M2 23 C10 19 12 10 20 14 S31 24 38 15 48 4 56 10 63 20 72 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M2 29 L2 23 C10 19 12 10 20 14 S31 24 38 15 48 4 56 10 63 20 72 8 L72 29 Z" fill="currentColor" opacity="0.08" />
    </Box>
  );
}

function formatShortDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatFullDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function MetricLine({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {tooltip ? <MetricTooltip label={label} title={tooltip} /> : label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
    </Box>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        p: 0.25,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
        overflowX: "auto",
        maxWidth: "100%",
      }}
    >
      {options.map((option) => (
        <Button
          key={option.value}
          size="small"
          variant={option.value === value ? "contained" : "text"}
          onClick={() => onChange(option.value)}
          sx={{
            minWidth: 0,
            px: 1,
            py: 0.35,
            fontSize: "0.75rem",
            whiteSpace: "nowrap",
            boxShadow: "none",
          }}
        >
          {option.label}
        </Button>
      ))}
    </Box>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ px: 0.8, py: 0.55, border: "1px solid", borderColor: "divider", borderRadius: 1, bgcolor: "background.paper" }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.05, fontSize: "0.68rem" }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.15, wordBreak: "break-word", fontSize: "0.82rem" }}>
        {value}
      </Typography>
    </Box>
  );
}

function formatNumber(value?: number | null, maximumFractionDigits = 2) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return value.toLocaleString("vi-VN", { maximumFractionDigits });
}

function formatScore(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return formatNumber(value, 2);
}

function formatSignedScore(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatNumber(value, 2)}`;
}

function macroLevelLabel(value?: string | null) {
  switch (value) {
    case "FAVORABLE":
      return "Thuận lợi";
    case "SLIGHTLY_FAVORABLE":
      return "Hơi thuận lợi";
    case "NEUTRAL":
      return "Trung tính";
    case "UNFAVORABLE":
      return "Bất lợi";
    case "HIGH_RISK":
      return "Rủi ro cao";
    default:
      return "Chưa rõ";
  }
}

function macroLevelColor(value?: string | null): BadgeColor {
  switch (value) {
    case "FAVORABLE":
    case "SLIGHTLY_FAVORABLE":
      return "success";
    case "UNFAVORABLE":
      return "warning";
    case "HIGH_RISK":
      return "error";
    case "NEUTRAL":
      return "info";
    default:
      return "default";
  }
}

function formatPercent(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return `${formatNumber(value)}%`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có thông tin cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function count(counts: Record<string, number> | undefined, key: string) {
  return counts?.[key] ?? 0;
}

function filterSignature(filters: OpportunityQueryParams) {
  return JSON.stringify({
    fromYear: filters.fromYear,
    toYear: filters.toYear,
    page: filters.page ?? 0,
    size: filters.size,
    exchange: filters.exchange ?? "",
    industryGroup: filters.industryGroup ?? "",
    decision: filters.decision ?? "",
    decisionReasonCode: filters.decisionReasonCode ?? "",
    researchReadiness: filters.researchReadiness ?? "",
    executionReadiness: filters.executionReadiness ?? "",
    excludeLowLiquidity: Boolean(filters.excludeLowLiquidity),
    sort: filters.sort ?? "",
  });
}

function listSubtitle(meta: OpportunityWrappedResponse["meta"]) {
  const parts = [`${formatNumber(meta.totalAfterFilters, 0)} mã sau lọc`];
  if (meta.excludeLowLiquidity) {
    parts.push("Đã loại mã thanh khoản thấp");
  }
  parts.push(`Sắp xếp: ${sortLabel(meta.sort)}`);
  return parts.join(" · ");
}

function sortLabel(value?: string | null) {
  return sortOptions.find((option) => option.value === value)?.label ?? value ?? "-";
}

function snapshotSourceLabel(source?: string | null) {
  if (source === "SNAPSHOT") return "Snapshot";
  if (source === "REALTIME_FALLBACK") return "Realtime fallback";
  return source ?? "Chưa rõ nguồn";
}

function jobStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    SUCCESS: "Thành công",
    FAILED: "Batch lỗi",
    SKIPPED: "Không cần refresh",
    RUNNING: "Đang chạy",
  };
  return status ? labels[status] ?? status : "-";
}

function jobStatusColor(status?: string | null): BadgeColor {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "FAILED":
      return "error";
    case "SKIPPED":
      return "default";
    case "RUNNING":
      return "info";
    default:
      return "default";
  }
}

function jobStatusTooltip(status?: string | null) {
  const tooltips: Record<string, string> = {
    SUCCESS: "Job refresh gần nhất hoàn tất thành công.",
    FAILED: "Job refresh gần nhất thất bại. Kiểm tra trang trạng thái dữ liệu.",
    SKIPPED: "Job gần nhất được bỏ qua vì snapshot còn mới hoặc đang có job khác chạy.",
    RUNNING: "Job refresh đang chạy.",
  };
  return status ? tooltips[status] ?? status : "";
}

function topEntries(counts: Record<string, number> | undefined, limit: number): Array<[string, number]> {
  return Object.entries(counts ?? {})
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit);
}

function mergeTextLists(...lists: Array<string[] | undefined>) {
  const seen = new Set<string>();
  return lists
    .flatMap((list) => list ?? [])
    .filter((value) => {
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

function primaryDetailReasons(detail: OpportunityDetailItem | null) {
  if (!detail) return [];
  const values = mergeTextLists(detail.decisionReasonLabels, detail.mainReasons)
    .filter((value) => !isTechnicalDetailText(value))
    .map(humanizeDetailText);
  return values.slice(0, 7);
}

function technicalDetailReasons(detail: OpportunityDetailItem | null) {
  if (!detail) return [];
  const primary = new Set(primaryDetailReasons(detail));
  return mergeTextLists(detail.reasons, detail.mainReasons)
    .map(humanizeDetailText)
    .filter((value) => !primary.has(value));
}

function buildResearchThesisDraft(detail: OpportunityDetailItem): ResearchThesisDraft {
  const now = new Date().toISOString();
  const stockCode = detail.code.toUpperCase();

  return {
    id: createResearchThesisDraftId(stockCode),
    stockCode,
    thesisStatus: initialThesisStatus(detail),
    bullCase: mergeTextLists(detail.mainReasons).map(humanizeDetailText),
    bearCase: mergeTextLists(detail.decisionReasonLabels).map(humanizeDetailText),
    keyRisks: mergeTextLists(detail.mainRisks, detail.risks).map(humanizeDetailText),
    missingData: mergeTextLists(detail.dataQualityWarnings, detail.missingRequiredMetrics?.map(metricLabel)),
    buyConditions: defaultBuyConditions(detail),
    rejectConditions: defaultRejectConditions(detail),
    personalNote: "",
    nextReviewDate: defaultNextReviewDate(),
    source: "OPPORTUNITIES",
    sourceMeta: {
      decision: detail.decision,
      researchReadiness: detail.researchReadiness,
      conclusionConfidenceLevel: detail.conclusionConfidenceLevel,
    },
    createdAt: now,
    updatedAt: now,
  };
}

function initialThesisStatus(detail: OpportunityDetailItem): ResearchThesisStatus {
  if (detail.decision === "AVOID" || detail.researchReadiness === "AVOID_FOR_NOW") return "REJECTED";
  if (detail.conclusionConfidenceLevel === "LOW" || detail.researchReadiness === "LOW_CONFIDENCE_DATA") {
    return "WAITING_DATA";
  }
  if (detail.researchReadiness === "READY_FOR_RESEARCH") return "RESEARCHING";
  if (detail.decision === "WATCHLIST" || detail.researchReadiness === "WATCH_ONLY") return "WATCHLIST";
  return "DRAFT";
}

function defaultBuyConditions(detail: OpportunityDetailItem) {
  return [
    "Luận điểm tích cực vẫn đúng sau khi đọc báo cáo tài chính và thuyết minh.",
    "Không phát sinh rủi ro dữ liệu hoặc rủi ro ngành làm thay đổi kết luận.",
    detail.latestPrice
      ? `Giá và định giá vẫn còn hợp lý so với chất lượng doanh nghiệp. Giá tham chiếu hiện tại: ${formatNumber(
          detail.latestPrice
        )}k.`
      : "Giá và định giá vẫn còn hợp lý so với chất lượng doanh nghiệp.",
  ];
}

function defaultRejectConditions(detail: OpportunityDetailItem) {
  const values = [
    "Dữ liệu bổ sung phủ định luận điểm tăng trưởng/chất lượng.",
    "Rủi ro chính trở nên nghiêm trọng hơn hoặc không thể kiểm chứng.",
  ];
  if (detail.liquidityWarning) {
    values.push("Thanh khoản không đủ để giải ngân hoặc thoát vị thế an toàn.");
  }
  return values;
}

function defaultNextReviewDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

function watchlistReason(detail: OpportunityDetailItem) {
  const reasons = mergeTextLists(detail.mainReasons, detail.decisionReasonLabels)
    .map(humanizeDetailText)
    .slice(0, 3);
  return reasons.length > 0 ? reasons.join("; ") : "Theo dõi từ màn Opportunities.";
}

function isTechnicalDetailText(value: string) {
  return /Guardrail|Price Signal|rule MVP|rule v1|signalScore|Debt\/Equity/i.test(value);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error("Request timed out"));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timeoutId));
  });
}

function humanizeDetailText(value: string) {
  return value
    .replace(
      /Guardrail:\s*Điểm cơ hội đầu tư bị giới hạn bởi signalScore sau kiểm soát rủi ro\./gi,
      "Điểm cơ hội bị giới hạn do có rủi ro cần kiểm tra thêm."
    )
    .replace(/Price Signal:\s*/gi, "Tín hiệu giá: ")
    .replace(/rule MVP/gi, "bộ quy tắc hiện tại")
    .replace(/rule v1/gi, "bộ quy tắc hiện tại")
    .replace(/rule ngành/gi, "bộ quy tắc ngành")
    .replace(/Debt\/Equity/gi, "Nợ/Vốn chủ")
    .replace(/momentum/gi, "xu hướng")
    .replace(/Utilities/gi, "Tiện ích")
    .replace(/compound dài hạn/gi, "tích lũy dài hạn")
    .replace(/signalScore/gi, "điểm tín hiệu")
    .replace(/BALANCED_OPPORTUNITY/g, "Cơ hội cân bằng")
    .replace(/QUALITY_COMPOUNDER/g, "Doanh nghiệp chất lượng")
    .replace(/DEEP_VALUE/g, "Giá trị sâu")
    .trim();
}

function decisionLabel(value?: string | null, fallback?: string | null) {
  const labels: Record<string, string> = {
    RESEARCH_NOW: "Nghiên cứu ngay",
    WATCHLIST: "Theo dõi",
    WAIT_FOR_PRICE: "Chờ giá về",
    REVIEW: "Cần review",
    AVOID: "Tạm tránh",
  };
  if (value && labels[value]) return labels[value];
  return fallback ?? value ?? "-";
}

function shortConfidenceLevel(value?: string | null) {
  const labels: Record<string, string> = {
    HIGH: "Cao",
    MEDIUM: "TB",
    LOW: "Thấp",
  };
  return value ? labels[value] ?? value : "-";
}

function confidenceLevelLabel(value?: string | null) {
  const labels: Record<string, string> = {
    HIGH: "Cao",
    MEDIUM: "Trung bình",
    LOW: "Thấp",
    VERY_LOW: "Rất thấp",
  };
  return value ? labels[value] ?? value : "-";
}

function dataConfidenceColor(value?: string | null): BadgeColor {
  switch (value) {
    case "HIGH":
      return "success";
    case "MEDIUM":
      return "info";
    case "LOW":
      return "warning";
    case "VERY_LOW":
      return "error";
    default:
      return "default";
  }
}

function businessQualityLabel(label?: string | null): string {
  const labels: Record<string, string> = {
    EXCELLENT_BUSINESS: "Doanh nghiệp xuất sắc",
    GOOD_BUSINESS: "Doanh nghiệp tốt",
    AVERAGE_BUSINESS: "Doanh nghiệp bình thường",
    WEAK_BUSINESS: "Doanh nghiệp yếu",
    INSUFFICIENT_DATA: "Dữ liệu chưa đủ",
  };
  return label ? labels[label] ?? label : "-";
}

function valuationLabelDisplay(label?: string | null): string {
  const labels: Record<string, string> = {
    CHEAP: "Giá rẻ",
    FAIR: "Giá hợp lý",
    EXPENSIVE: "Giá đắt",
    OVERVALUED: "Giá quá cao",
    INSUFFICIENT_DATA: "Dữ liệu chưa đủ",
  };
  return label ? labels[label] ?? label : "-";
}

function businessQualityColor(label?: string | null): BadgeColor {
  if (!label) return "default";
  if (label.includes("EXCELLENT") || label.includes("GOOD")) return "success";
  if (label.includes("AVERAGE")) return "warning";
  return "error";
}

function valuationColor(label?: string | null): BadgeColor {
  if (!label) return "default";
  if (label === "CHEAP") return "success";
  if (label === "FAIR") return "info";
  if (label === "EXPENSIVE") return "warning";
  if (label === "OVERVALUED") return "error";
  return "default";
}

function dataConfidenceWarningLabel(code: string): string {
  const labels: Record<string, string> = {
    PROFIT_CAGR_OUTLIER: "Tăng trưởng lợi nhuận bất thường, có thể do nền thấp hoặc biến động mạnh.",
    PROFIT_CAGR_VOLATILE: "Tăng trưởng lợi nhuận biến động cao, cần kiểm tra chất lượng tăng trưởng.",
    BASE_YEAR_PROFIT_LOW: "Năm gốc lợi nhuận thấp, CAGR có thể bị thổi phồng.",
    CFO_LNST_UNRELIABLE: "CFO/LNST bất thường, chất lượng dòng tiền cần kiểm tra thêm.",
    INDUSTRY_RULE_MISSING: "Chưa có rule ngành phù hợp, điểm ngành chỉ mang tính trung lập.",
    DATA_CONFIDENCE_LOW: "Độ tin cậy dữ liệu thấp, không nên ra quyết định chỉ dựa trên điểm số.",
    PE_OUT_OF_RANGE: "P/E nằm ngoài vùng thông thường, cần kiểm tra giá hoặc EPS.",
    PB_OUT_OF_RANGE: "P/B nằm ngoài vùng thông thường, cần kiểm tra giá hoặc vốn chủ.",
    EPS_NOT_MEANINGFUL: "EPS không có ý nghĩa do lợi nhuận thấp hoặc âm.",
    PRICE_STALE: "Giá sử dụng đã cũ, định giá có thể không còn chính xác.",
    PRICE_FUTURE_DATE: "Phát hiện giá tương lai, cần kiểm tra dữ liệu giá.",
    TURNAROUND_BASE_EFFECT: "Turnaround từ lỗ sang lãi, CAGR có thể bị thổi phồng.",
    INSUFFICIENT_FINANCIAL_COVERAGE: "Dữ liệu tài chính thiếu độ phủ đủ đầy đủ.",
    STALE_PRICE: "Giá cũ, có thể không phản ánh điều kiện hiện tại.",
    MISSING_SHARE_INFO: "Thiếu thông tin số lượng cổ phiếu.",
  };
  return labels[code] ?? code;
}

function opportunityTypeLabel(value?: string | null) {
  const labels: Record<string, string> = {
    QUALITY_COMPOUNDER: "Doanh nghiệp chất lượng",
    BALANCED_OPPORTUNITY: "Cơ hội cân bằng",
    DEEP_VALUE: "Giá trị sâu",
    TURNAROUND: "Phục hồi",
    SPECULATIVE: "Đầu cơ",
    UNKNOWN: "Chưa phân loại",
  };
  return value ? labels[value] ?? value : "Chưa phân loại";
}

function shortReasonLabel(code: string) {
  const labels: Record<string, string> = {
    NEGATIVE_MOMENTUM: "Xu hướng yếu",
    VALUATION_HIGH: "Định giá cao",
    BANK_DATA_MISSING: "Thiếu dữ liệu NH",
    FINANCIAL_SERVICES_DATA_MISSING: "Thiếu dữ liệu CK",
    INSURANCE_DATA_MISSING: "Thiếu dữ liệu BH",
    LOW_LIQUIDITY: "Thanh khoản thấp",
    DATA_NOT_ENOUGH: "Dữ liệu chưa đủ",
    OLD_PRICE_DATA: "Giá cũ",
    CYCLICAL_RISK: "Chu kỳ",
    FINANCIAL_RISK: "Tài chính",
    LOW_ROE: "ROE thấp",
    VALUE_TRAP_RISK: "Value trap",
    REVENUE_DECLINE: "DT giảm",
  };
  return labels[code] ?? reasonLabel(code);
}

function shortResearchLabel(code?: string | null) {
  const labels: Record<string, string> = {
    READY_FOR_RESEARCH: "Nghiên cứu",
    WATCH_ONLY: "Theo dõi",
    PRELIMINARY_ONLY: "Sơ bộ",
    LOW_CONFIDENCE_DATA: "Dữ liệu yếu",
    AVOID_FOR_NOW: "Tạm tránh",
  };
  return code ? labels[code] ?? readinessLabel(code) : "-";
}

function liquidityLabel(code?: string | null) {
  const labels: Record<string, string> = {
    VERY_LIQUID: "Rất tốt",
    LIQUID: "Tốt",
    ACCEPTABLE: "Tạm ổn",
    LOW_LIQUIDITY: "Thấp",
    UNKNOWN: "Thiếu DL",
  };
  return code ? labels[code] ?? code : "Thiếu DL";
}

function sectorMomentumLabel(code?: string | null): string {
  const labels: Record<string, string> = {
    STRONG_INFLOW: "Dòng vào mạnh",
    INFLOW: "Dòng vào",
    NEUTRAL: "Trung lập",
    OUTFLOW: "Dòng ra",
    STRONG_OUTFLOW: "Dòng ra mạnh",
  };
  return code ? labels[code] ?? code : "—";
}

function sectorMomentumColor(code?: string | null): "success" | "warning" | "error" | "default" {
  const colors: Record<string, "success" | "warning" | "error" | "default"> = {
    STRONG_INFLOW: "success",
    INFLOW: "success",
    NEUTRAL: "default",
    OUTFLOW: "warning",
    STRONG_OUTFLOW: "error",
  };
  return code ? colors[code] ?? "default" : "default";
}

function industryGroupLabel(code?: string | null) {
  const labels: Record<string, string> = {
    BANK: "Ngân hàng",
    FINANCIAL_SERVICES: "Chứng khoán/Tài chính",
    INSURANCE: "Bảo hiểm",
    TECHNOLOGY: "Công nghệ",
    FOOD_BEVERAGE: "Thực phẩm",
    REAL_ESTATE: "BĐS",
    BDS: "BĐS",
    INDUSTRIALS: "Công nghiệp",
    UTILITIES: "Tiện ích",
    RETAIL: "Bán lẻ",
    CONSTRUCTION_MATERIALS: "VLXD",
    VLXD: "VLXD",
    BASIC_RESOURCES: "Tài nguyên cơ bản",
    CHEMICALS: "Hóa chất",
    ENERGY: "Năng lượng",
    HEALTHCARE: "Y tế",
    TRAVEL_LEISURE: "Du lịch/Dịch vụ",
    AUTO: "Ô tô",
    UNKNOWN: "Chưa rõ ngành",
  };
  return code ? labels[code] ?? code : "-";
}

function industryLabel(value?: string | null) {
  if (!value) return "-";
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const labels: Record<string, string> = {
    UTILITIES: "Tiện ích",
    BANKING: "Ngân hàng",
    BANK: "Ngân hàng",
    TECHNOLOGY: "Công nghệ",
    FOOD_BEVERAGE: "Thực phẩm",
    REAL_ESTATE: "BĐS",
    FINANCIAL_SERVICES: "Chứng khoán/Tài chính",
    INDUSTRIALS: "Công nghiệp",
    BASIC_RESOURCES: "Tài nguyên cơ bản",
    CONSTRUCTION_MATERIALS: "VLXD",
    INSURANCE: "Bảo hiểm",
    HEALTHCARE: "Y tế",
    RETAIL: "Bán lẻ",
    AUTO: "Ô tô",
  };
  return labels[normalized] ?? industryGroupLabel(normalized);
}

function metricLabel(value: string) {
  const labels: Record<string, string> = {
    nim: "NIM - Biên lãi ròng",
    casa: "CASA - Tỷ lệ tiền gửi không kỳ hạn",
    nplRatio: "Tỷ lệ nợ xấu",
    loanLossCoverageRatio: "Tỷ lệ bao phủ nợ xấu",
    creditCost: "Chi phí tín dụng",
    marginLendingRisk: "Rủi ro dư nợ margin",
    proprietaryTradingExposure: "Tỷ trọng tự doanh",
    capitalAdequacy: "An toàn vốn",
    brokerMarketShare: "Thị phần môi giới",
    combinedRatio: "Tỷ lệ kết hợp",
    investmentYield: "Lợi suất đầu tư",
    solvencyMargin: "Biên khả năng thanh toán",
    claimRatio: "Tỷ lệ bồi thường",
    premiumGrowth: "Tăng trưởng phí bảo hiểm",
  };
  return labels[value] ?? value;
}

function scoreColor(score?: number | null): BadgeColor {
  if (score === undefined || score === null) return "default";
  if (score >= 8) return "success";
  if (score >= 7) return "primary";
  if (score >= 6) return "warning";
  return score < 5 ? "error" : "default";
}

function decisionColor(value?: string | null): BadgeColor {
  switch (value) {
    case "RESEARCH_NOW":
      return "success";
    case "WATCHLIST":
      return "primary";
    case "WAIT_FOR_PRICE":
      return "info";
    case "REVIEW":
      return "warning";
    case "AVOID":
      return "error";
    default:
      return "default";
  }
}

function confidenceColor(value?: string | null): BadgeColor {
  switch (value) {
    case "HIGH":
      return "success";
    case "MEDIUM":
      return "warning";
    case "LOW":
      return "error";
    default:
      return "default";
  }
}

function readinessColor(value?: string | null): BadgeColor {
  switch (value) {
    case "READY_FOR_RESEARCH":
      return "success";
    case "WATCH_ONLY":
      return "primary";
    case "PRELIMINARY_ONLY":
      return "info";
    case "LOW_CONFIDENCE_DATA":
    case "AVOID_FOR_NOW":
      return "error";
    default:
      return "default";
  }
}

function executionColor(value?: string | null): BadgeColor {
  switch (value) {
    case "READY_TO_TRADE":
      return "success";
    case "TRADE_WITH_SIZE_LIMIT":
      return "warning";
    case "LOW_LIQUIDITY_CAUTION":
    case "NOT_RECOMMENDED_TO_TRADE":
      return "error";
    default:
      return "default";
  }
}

function liquidityColor(value?: string | null): BadgeColor {
  switch (value) {
    case "VERY_LIQUID":
    case "LIQUID":
      return "success";
    case "ACCEPTABLE":
      return "warning";
    case "LOW_LIQUIDITY":
      return "error";
    case "UNKNOWN":
      return "default";
    default:
      return "default";
  }
}

function reasonColor(code?: string | null): BadgeColor {
  switch (code) {
    case "FINANCIAL_RISK":
    case "VALUE_TRAP_RISK":
    case "LOW_ROE":
    case "REVENUE_DECLINE":
      return "error";
    case "NEGATIVE_MOMENTUM":
    case "DATA_NOT_ENOUGH":
    case "OLD_PRICE_DATA":
    case "LOW_LIQUIDITY":
    case "BANK_DATA_MISSING":
    case "FINANCIAL_SERVICES_DATA_MISSING":
    case "INSURANCE_DATA_MISSING":
      return "warning";
    case "VALUATION_HIGH":
      return "secondary";
    case "CYCLICAL_RISK":
      return "info";
    default:
      return "default";
  }
}

function reasonLabel(code: string) {
  const labels: Record<string, string> = {
    LOW_LIQUIDITY: "Thanh khoản thấp",
    DATA_NOT_ENOUGH: "Dữ liệu chưa đủ",
    NEGATIVE_MOMENTUM: "Xu hướng giá yếu",
    OLD_PRICE_DATA: "Dữ liệu giá cũ",
    INSUFFICIENT_52W_DATA: "Thiếu dữ liệu 52 tuần",
    VALUATION_HIGH: "Định giá cao",
    BANK_DATA_MISSING: "Thiếu dữ liệu bank",
    FINANCIAL_SERVICES_DATA_MISSING: "Thiếu dữ liệu tài chính",
    INSURANCE_DATA_MISSING: "Thiếu dữ liệu bảo hiểm",
    FINANCIAL_RISK: "Rủi ro tài chính",
    LOW_ROE: "ROE thấp",
    VALUE_TRAP_RISK: "Rủi ro bẫy giá trị",
    CYCLICAL_RISK: "Rủi ro chu kỳ",
    REVENUE_DECLINE: "Doanh thu suy giảm",
  };
  return labels[code] ?? code;
}

function readinessLabel(code: string) {
  const labels: Record<string, string> = {
    READY_FOR_RESEARCH: "Sẵn sàng nghiên cứu",
    WATCH_ONLY: "Chỉ nên theo dõi",
    PRELIMINARY_ONLY: "Sàng lọc sơ bộ",
    LOW_CONFIDENCE_DATA: "Dữ liệu yếu",
    AVOID_FOR_NOW: "Tạm tránh",
  };
  return labels[code] ?? code;
}

function executionLabel(code: string) {
  const labels: Record<string, string> = {
    READY_TO_TRADE: "Có thể giao dịch",
    TRADE_WITH_SIZE_LIMIT: "Giới hạn quy mô",
    LOW_LIQUIDITY_CAUTION: "Cẩn trọng thanh khoản",
    NOT_RECOMMENDED_TO_TRADE: "Không nên giao dịch",
  };
  return labels[code] ?? code;
}

function reasonTooltip(code: string) {
  const tooltips: Record<string, string> = {
    BANK_DATA_MISSING: "Ngân hàng cần thêm NIM, CASA, nợ xấu, bao phủ nợ xấu và chi phí tín dụng.",
    FINANCIAL_SERVICES_DATA_MISSING:
      "Công ty chứng khoán/tài chính cần thêm dư nợ margin, rủi ro tự doanh, an toàn vốn, thị phần môi giới.",
    DATA_NOT_ENOUGH: "Thiếu dữ liệu cần thiết để kết luận chắc hơn.",
    LOW_LIQUIDITY: "Thanh khoản thấp có thể ảnh hưởng khả năng giải ngân hoặc thoát vị thế.",
  };
  return tooltips[code] ?? reasonLabel(code);
}

// ─── Valuation V2 helpers ───────────────────────────────

type V2LabelColor = "success" | "info" | "warning" | "error" | "default";

function historicalLabelVi(label?: string | null): string {
  const m: Record<string, string> = {
    BELOW_HISTORY: "Thấp hơn lịch sử",
    FAR_BELOW_HISTORY: "Thấp hơn nhiều so với lịch sử",
    NEAR_HISTORY: "Gần vùng lịch sử",
    ABOVE_HISTORY: "Cao hơn lịch sử",
    FAR_ABOVE_HISTORY: "Cao hơn nhiều so với lịch sử",
    INSUFFICIENT_HISTORY: "Chưa đủ lịch sử",
    INVALID_VALUATION: "Định giá không hợp lệ",
  };
  return label ? m[label] ?? label : "Chưa đủ dữ liệu";
}

function historicalLabelColor(label?: string | null): V2LabelColor {
  if (!label) return "default";
  if (label.includes("BELOW")) return "success";
  if (label.includes("NEAR")) return "info";
  if (label.includes("ABOVE")) return "warning";
  if (label.includes("FAR_ABOVE")) return "error";
  return "default";
}

function industryLabelVi(label?: string | null): string {
  const m: Record<string, string> = {
    CHEAPER_THAN_INDUSTRY: "Thấp hơn trung vị ngành",
    FAR_CHEAPER_THAN_INDUSTRY: "Thấp hơn nhiều so với ngành",
    NEAR_INDUSTRY: "Gần trung vị ngành",
    MORE_EXPENSIVE_THAN_INDUSTRY: "Cao hơn trung vị ngành",
    FAR_MORE_EXPENSIVE_THAN_INDUSTRY: "Cao hơn nhiều so với ngành",
    INDUSTRY_DATA_INSUFFICIENT: "Chưa đủ mẫu ngành",
    INVALID_VALUATION: "Định giá không hợp lệ",
  };
  return label ? m[label] ?? label : "Chưa đủ dữ liệu";
}

function industryLabelColor(label?: string | null): V2LabelColor {
  if (!label) return "default";
  if (label.includes("CHEAPER")) return "success";
  if (label.includes("NEAR")) return "info";
  if (label.includes("MORE_EXPENSIVE") && !label.includes("FAR")) return "warning";
  if (label.includes("FAR_MORE_EXPENSIVE")) return "error";
  return "default";
}

function qualityAdjustedLabelVi(label?: string | null): string {
  const m: Record<string, string> = {
    FAIR_FOR_QUALITY: "Hợp lý so với chất lượng",
    QUALITY_PREMIUM_JUSTIFIED: "Premium được chất lượng hỗ trợ",
    QUALITY_PREMIUM_TOO_HIGH: "Premium cao, cần thận trọng",
    DISCOUNT_WITH_QUALITY_SUPPORT: "Giá rẻ có chất lượng hỗ trợ",
    VALUE_TRAP_RISK: "Rủi ro value trap",
    DATA_TOO_WEAK_TO_JUDGE: "Dữ liệu yếu, chưa nên kết luận",
    CYCLICAL_DISCOUNT_NEEDS_CONFIRMATION: "Cần xác nhận chu kỳ",
    INSUFFICIENT_DATA: "Chưa đủ dữ liệu",
  };
  return label ? m[label] ?? label : "Chưa đủ dữ liệu";
}

function qualityAdjustedLabelColor(label?: string | null): V2LabelColor {
  if (!label) return "default";
  if (label === "QUALITY_PREMIUM_JUSTIFIED" || label === "DISCOUNT_WITH_QUALITY_SUPPORT") return "success";
  if (label === "FAIR_FOR_QUALITY") return "info";
  if (label === "QUALITY_PREMIUM_TOO_HIGH" || label === "CYCLICAL_DISCOUNT_NEEDS_CONFIRMATION") return "warning";
  if (label === "VALUE_TRAP_RISK" || label === "DATA_TOO_WEAK_TO_JUDGE") return "error";
  return "default";
}

function growthLabelVi(label?: string | null): string {
  const m: Record<string, string> = {
    EXCELLENT_GROWTH_VALUE: "PEG rất tốt",
    GROWTH_ALIGNED: "P/E phù hợp tăng trưởng",
    GROWTH_EXPENSIVE: "P/E cao so với tăng trưởng",
    GROWTH_NOT_MEANINGFUL: "Tăng trưởng không đủ ý nghĩa",
    GROWTH_DATA_UNRELIABLE: "Dữ liệu tăng trưởng không đáng tin",
    CYCLICAL_GROWTH_NEEDS_CONFIRMATION: "Tăng trưởng chu kỳ cần xác nhận",
    INSUFFICIENT_GROWTH_DATA: "Chưa đủ dữ liệu tăng trưởng",
    INVALID_PE: "P/E không hợp lệ",
  };
  return label ? m[label] ?? label : "Chưa đủ dữ liệu";
}

function growthLabelColor(label?: string | null): V2LabelColor {
  if (!label) return "default";
  if (label === "EXCELLENT_GROWTH_VALUE") return "success";
  if (label === "GROWTH_ALIGNED") return "info";
  if (label === "GROWTH_EXPENSIVE") return "warning";
  if (label === "GROWTH_DATA_UNRELIABLE" || label === "GROWTH_NOT_MEANINGFUL" || label === "INVALID_PE") return "error";
  if (label === "CYCLICAL_GROWTH_NEEDS_CONFIRMATION" || label === "INSUFFICIENT_GROWTH_DATA") return "warning";
  return "default";
}

function fmtX(v?: number | null): string {
  if (v == null || Number.isNaN(v)) return "-";
  return `${v.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}x`;
}

function fmtDelta(v?: number | null): string {
  if (v == null || Number.isNaN(v)) return "-";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
}

function fmtScore(v?: number | null): string {
  if (v == null || Number.isNaN(v)) return "-";
  return `${v.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}/10`;
}

function V2WarningList({ warnings }: { warnings?: string[] }) {
  if (!warnings || warnings.length === 0) return null;
  return (
    <Stack spacing={0.5} sx={{ mt: 1 }}>
      {warnings.map((w, i) => (
        <Alert key={i} severity="warning" sx={{ py: 0.25, px: 1, fontSize: "0.8rem", "& .MuiAlert-message": { py: 0.25 } }}>
          {w}
        </Alert>
      ))}
    </Stack>
  );
}

function V2Section({
  title,
  label,
  labelColor,
  score,
  children,
  explanation,
  warnings,
}: {
  title: string;
  label: string;
  labelColor: V2LabelColor;
  score?: string;
  children: React.ReactNode;
  explanation?: string | null;
  warnings?: string[];
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
        <Chip label={label} color={labelColor} size="small" sx={{ fontWeight: 600 }} />
        {score && <Typography variant="caption" color="text.secondary">{score}</Typography>}
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1, mb: 0.5 }}>
        {children}
      </Box>
      {explanation && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75, lineHeight: 1.5 }}>
          {explanation}
        </Typography>
      )}
      <V2WarningList warnings={warnings} />
    </Box>
  );
}

function ValuationV2Card({ detail }: { detail: OpportunityDetailItem }) {
  const hasV21 = detail.historicalValuationLabel != null;
  const hasV22 = detail.industryMedianLabel != null;
  const hasV23 = detail.qualityAdjustedValuationLabel != null;
  const hasV24 = detail.growthAlignmentLabel != null;

  if (!hasV21 && !hasV22 && !hasV23 && !hasV24) return null;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 700 }}>
          Định giá V2
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          Tách định giá thành 4 lớp: lịch sử, ngành, chất lượng và tăng trưởng. Đây là lớp giải thích, không phải khuyến nghị mua/bán tự động.
        </Typography>

        {hasV21 && (
          <V2Section
            title="So với lịch sử"
            label={historicalLabelVi(detail.historicalValuationLabel)}
            labelColor={historicalLabelColor(detail.historicalValuationLabel)}
            score={fmtScore(detail.historicalValuationScore)}
            explanation={detail.historicalValuationExplanation}
            warnings={detail.historicalValuationWarnings}
          >
            <MetricLine label="P/E hiện tại" tooltip="Định giá P/E tại giá gần nhất." value={fmtX(detail.pe)} />
            <MetricLine label="P/E median 3 năm" tooltip="Mức P/E trung vị trong 3 năm, dùng làm mốc so sánh lịch sử." value={fmtX(detail.historicalMedianPe3y)} />
            <MetricLine label="P/B hiện tại" tooltip="Định giá P/B tại giá gần nhất." value={fmtX(detail.pb)} />
            <MetricLine label="P/B median 3 năm" tooltip="Mức P/B trung vị trong 3 năm, dùng làm mốc so sánh lịch sử." value={fmtX(detail.historicalMedianPb3y)} />
            <MetricLine label="P/E vs lịch sử" tooltip="Chênh lệch P/E hiện tại so với median lịch sử. Âm nghĩa là thấp hơn lịch sử." value={fmtDelta(detail.peVsHistoryPercent)} />
            <MetricLine label="P/B vs lịch sử" tooltip="Chênh lệch P/B hiện tại so với median lịch sử. Âm nghĩa là thấp hơn lịch sử." value={fmtDelta(detail.pbVsHistoryPercent)} />
          </V2Section>
        )}

        {hasV21 && hasV22 && <Divider sx={{ my: 1.5 }} />}

        {hasV22 && (
          <V2Section
            title="So với ngành"
            label={industryLabelVi(detail.industryMedianLabel)}
            labelColor={industryLabelColor(detail.industryMedianLabel)}
            score={fmtScore(detail.industryMedianScore)}
            explanation={detail.industryMedianExplanation}
            warnings={detail.industryMedianWarnings}
          >
            <MetricLine label="P/E median ngành" tooltip="P/E trung vị của các mã cùng ngành trong mẫu hiện có." value={fmtX(detail.industryMedianPe)} />
            <MetricLine label="P/B median ngành" tooltip="P/B trung vị của các mã cùng ngành trong mẫu hiện có." value={fmtX(detail.industryMedianPb)} />
            <MetricLine label="P/E vs ngành" tooltip="Chênh lệch P/E của mã so với median ngành. Âm nghĩa là rẻ hơn ngành theo P/E." value={fmtDelta(detail.peVsIndustryPercent)} />
            <MetricLine label="P/B vs ngành" tooltip="Chênh lệch P/B của mã so với median ngành. Âm nghĩa là rẻ hơn ngành theo P/B." value={fmtDelta(detail.pbVsIndustryPercent)} />
            <MetricLine label="Mẫu ngành" tooltip="Số mã cùng ngành được dùng để tính median ngành. Mẫu thấp thì kết luận kém chắc." value={detail.industrySampleSize != null ? `${detail.industrySampleSize} mã` : "-"} />
          </V2Section>
        )}

        {hasV22 && hasV23 && <Divider sx={{ my: 1.5 }} />}

        {hasV23 && (
          <V2Section
            title="Sau khi xét chất lượng"
            label={qualityAdjustedLabelVi(detail.qualityAdjustedValuationLabel)}
            labelColor={qualityAdjustedLabelColor(detail.qualityAdjustedValuationLabel)}
            score={fmtScore(detail.qualityAdjustedValuationScore)}
            explanation={detail.qualityAdjustedValuationExplanation}
            warnings={detail.qualityAdjustedValuationWarnings}
          >
            <MetricLine label="Trạng thái premium" tooltip="Cho biết chất lượng doanh nghiệp có đủ tốt để chấp nhận mức định giá cao hơn bình thường hay không." value={detail.qualityPremiumStatus ?? "-"} />
            <MetricLine label="Rủi ro value trap" tooltip="Rủi ro cổ phiếu nhìn rẻ nhưng chất lượng kinh doanh hoặc triển vọng không đủ tốt." value={detail.valueTrapRiskLevel ?? "-"} />
            <MetricLine label="Điểm biện minh premium" tooltip="Điểm đánh giá liệu chất lượng/tăng trưởng có đủ để biện minh cho định giá cao hơn hay không." value={formatNumber(detail.premiumJustificationScore)} />
            <MetricLine label="Điểm rủi ro chiết khấu" tooltip="Điểm phản ánh rủi ro chất lượng khiến cổ phiếu đáng bị chiết khấu." value={formatNumber(detail.discountQualityRiskScore)} />
          </V2Section>
        )}

        {hasV23 && hasV24 && <Divider sx={{ my: 1.5 }} />}

        {hasV24 && (
          <V2Section
            title="PEG & tăng trưởng"
            label={growthLabelVi(detail.growthAlignmentLabel)}
            labelColor={growthLabelColor(detail.growthAlignmentLabel)}
            score={fmtScore(detail.growthAlignmentScore)}
            explanation={detail.growthAdjustedExplanation}
            warnings={detail.growthAdjustedWarnings}
          >
            <MetricLine
              label="PEG"
              tooltip="PEG = P/E chia cho tốc độ tăng trưởng lợi nhuận. PEG thấp có thể hấp dẫn nếu tăng trưởng bền vững."
              value={detail.pegRatio != null ? formatNumber(detail.pegRatio) : "Không tính được"}
            />
            <MetricLine
              label="P/E kỳ vọng"
              value={detail.expectedPeMin != null && detail.expectedPeMax != null
                ? `${formatNumber(detail.expectedPeMin, 0)}–${formatNumber(detail.expectedPeMax, 0)}x`
                : "-"}
            />
          </V2Section>
        )}
      </CardContent>
    </Card>
  );
}
