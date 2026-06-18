import { useEffect, useMemo, useState } from "react";
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
  Drawer,
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
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Link, useNavigate } from "react-router-dom";
import { opportunitiesApi } from "../api/opportunitiesApi";
import {
  createResearchThesisDraftId,
  researchThesisDraftStorage,
} from "../api/researchThesisDraftStorage";
import { watchlistApi } from "../api/watchlistApi";
import type {
  OpportunityDetailItem,
  OpportunityQueryParams,
  OpportunitySummaryItem,
  OpportunityWrappedResponse,
} from "../types/opportunities";
import type { ResearchThesisDraft, ResearchThesisStatus } from "../types/researchThesis";

type BadgeColor = "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info";

const currentYear = new Date().getFullYear();
const detailRequestTimeoutMs = 15000;

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

const decisionOptions = ["WATCHLIST", "REVIEW", "AVOID"];
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

  useEffect(() => {
    loadOpportunities(defaultFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = data?.items ?? [];
  const summary = data?.summary;
  const meta = data?.meta;
  const pagination = data?.pagination;
  const isInvalidRange = filters.fromYear > filters.toYear;

  const topIndustries = useMemo(() => topEntries(summary?.industryCounts, 5), [summary]);

  const loadOpportunities = async (nextFilters: OpportunityQueryParams) => {
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
  };

  const updateFilter = (field: keyof OpportunityQueryParams, value: string | number | boolean) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyFilters = () => {
    loadOpportunities({
      ...filters,
      page: 0,
    });
  };

  const resetFilters = () => {
    loadOpportunities(defaultFilters);
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
    setActionMessage("");
    setActionError("");
    setDetailLoading(true);

    try {
      const response = await withTimeout(
        opportunitiesApi.getOpportunityDetail(item.code, {
          fromYear: appliedFilters.fromYear,
          toYear: appliedFilters.toYear,
        }),
        detailRequestTimeoutMs
      );
      setDetail(response);
    } catch (error) {
      console.warn("Opportunity detail fallback", error);
      setDetailError("Không tải được chi tiết mã này. Tạm thời hiển thị dữ liệu tóm tắt trên bảng.");
      setDetail(item as OpportunityDetailItem);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedCode("");
    setDetail(null);
    setDetailError("");
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
        sx={{ mb: 3, justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Cơ hội đầu tư
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 920 }}>
            Danh sách cổ phiếu được sàng lọc bằng dữ liệu tài chính, định giá, thanh khoản và rủi ro.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={() => loadOpportunities(appliedFilters)}
          disabled={loading}
        >
          Tải lại
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3 }}>
        Đây là công cụ sàng lọc, không phải khuyến nghị mua/bán. Điểm cao chỉ giúp nhận diện mã đáng nghiên cứu tiếp.
      </Alert>

      {meta && <SnapshotStatusBar meta={meta} />}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Bộ lọc
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(4, minmax(0, 1fr))",
                },
                gap: 2,
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
                placeholder="HOSE"
              />
              <TextField
                select
                label="Trạng thái"
                size="small"
                value={filters.decision ?? ""}
                onChange={(event) => updateFilter("decision", event.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {decisionOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {decisionLabel(option)}
                  </MenuItem>
                ))}
              </TextField>
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
                label="Lý do"
                size="small"
                value={filters.decisionReasonCode ?? ""}
                onChange={(event) => updateFilter("decisionReasonCode", event.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {reasonOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {reasonLabel(option)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Mức nghiên cứu"
                size="small"
                value={filters.researchReadiness ?? ""}
                onChange={(event) => updateFilter("researchReadiness", event.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {researchOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {readinessLabel(option)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Khả năng giao dịch"
                size="small"
                value={filters.executionReadiness ?? ""}
                onChange={(event) => updateFilter("executionReadiness", event.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {executionOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {executionLabel(option)}
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
              <FormControlLabel
                sx={{ alignSelf: "center" }}
                control={
                  <Checkbox
                    checked={Boolean(filters.excludeLowLiquidity)}
                    onChange={(event) => updateFilter("excludeLowLiquidity", event.target.checked)}
                  />
                }
                label="Loại mã thanh khoản thấp"
              />
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={applyFilters}
                disabled={loading || isInvalidRange}
              >
                Áp dụng
              </Button>
              <Button variant="outlined" onClick={resetFilters} disabled={loading}>
                Reset
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

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

      <SummaryCards response={data} topIndustries={topIndustries} />

      <Card>
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
            <Typography variant="body2" color="text.secondary">
              Giá hiển thị theo đơn vị nghìn đồng/cp.
            </Typography>
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

function SnapshotStatusBar({ meta }: { meta: OpportunityWrappedResponse["meta"] }) {
  const isFallback = meta.source === "REALTIME_FALLBACK";
  const isStale = meta.isSourceNewerThanSnapshot === true;
  const latestJobStatus = meta.latestJobStatus;

  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 3,
        p: 1.5,
        borderColor: isFallback || isStale ? "warning.main" : "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
          <Chip
            size="small"
            label={snapshotSourceLabel(meta.source)}
            color={isFallback ? "warning" : "success"}
            variant={isFallback ? "filled" : "outlined"}
          />
          {isStale && (
            <Chip
              size="small"
              label="Nguồn mới hơn snapshot"
              color="warning"
              variant="filled"
            />
          )}
          <Typography variant="body2" color="text.secondary">
            Cập nhật: {formatDateTime(meta.snapshotGeneratedAt)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatNumber(meta.snapshotCount ?? meta.totalBeforeFilters, 0)} mã
          </Typography>
          {latestJobStatus && (
            <Tooltip title={jobStatusTooltip(latestJobStatus)}>
              <Chip
                size="small"
                label={`Job: ${jobStatusLabel(latestJobStatus)}`}
                color={jobStatusColor(latestJobStatus)}
                variant="outlined"
              />
            </Tooltip>
          )}
        </Stack>

        <Button component={Link} to="/admin/data-status" size="small" variant="text">
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

function SummaryCards({
  response,
  topIndustries,
}: {
  response: OpportunityWrappedResponse | null;
  topIndustries: Array<[string, number]>;
}) {
  const meta = response?.meta;
  const summary = response?.summary;

  return (
    <Stack spacing={1.5} sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 2,
        }}
      >
        <MetricCard
          label="Sau lọc"
          value={formatNumber(meta?.totalAfterFilters, 0)}
          helper={`Ban đầu: ${formatNumber(meta?.totalBeforeFilters, 0)} mã`}
        />
        <MetricCard
          label="Đã loại thanh khoản thấp"
          value={formatNumber(meta?.excludedByLowLiquidity, 0)}
          helper={meta?.excludeLowLiquidity ? "Đang bật bộ lọc" : "Bộ lọc đang tắt"}
        />
        <MetricCard
          label="Trạng thái"
          value={`${count(summary?.decisionCounts, "WATCHLIST")} / ${count(
            summary?.decisionCounts,
            "REVIEW"
          )} / ${count(summary?.decisionCounts, "AVOID")}`}
          helper="Theo dõi / Review / Tránh"
        />
        <MetricCard
          label="Sẵn sàng nghiên cứu"
          value={formatNumber(count(summary?.researchReadinessCounts, "READY_FOR_RESEARCH"), 0)}
          helper={`Theo dõi thêm: ${formatNumber(count(summary?.researchReadinessCounts, "WATCH_ONLY"), 0)}`}
        />
        <MetricCard
          label="Thanh khoản giao dịch"
          value={formatNumber(count(summary?.executionReadinessCounts, "READY_TO_TRADE"), 0)}
          helper={`Giới hạn quy mô: ${formatNumber(
            count(summary?.executionReadinessCounts, "TRADE_WITH_SIZE_LIMIT"),
            0
          )}`}
        />
        <MetricCard
          label="Độ tin cậy kết luận"
          value={`${count(summary?.conclusionConfidenceCounts, "HIGH")} / ${count(
            summary?.conclusionConfidenceCounts,
            "MEDIUM"
          )} / ${count(summary?.conclusionConfidenceCounts, "LOW")}`}
          helper="Cao / TB / Thấp"
        />
      </Box>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", alignItems: "center", rowGap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Top ngành
          </Typography>
          {topIndustries.length > 0 ? (
            topIndustries.map(([name, value]) => (
              <Chip key={name} size="small" label={`${industryGroupLabel(name)}: ${formatNumber(value, 0)}`} />
            ))
          ) : (
            <Chip size="small" label="Chưa có dữ liệu ngành" variant="outlined" />
          )}
          <Chip
            size="small"
            label={`Không cảnh báo lớn: ${formatNumber(summary?.noReasonCount, 0)}`}
            color="success"
            variant="outlined"
          />
        </Stack>
      </Paper>
    </Stack>
  );
}

function OpportunityTable({
  items,
  onOpenDetail,
}: {
  items: OpportunitySummaryItem[];
  onOpenDetail: (item: OpportunitySummaryItem) => void;
}) {
  const rankWidth = 64;
  const codeWidth = 240;
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
    minWidth: 64,
    width: 64,
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
          minWidth: 1180,
          "& .MuiTableCell-root": { px: 0.9, py: 0.85 },
          "& .MuiTableCell-head": { fontWeight: 700, whiteSpace: "nowrap" },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...stickyRankSx, ...stickyHeadSx }}>#</TableCell>
            <TableCell sx={{ ...stickyCodeSx, ...stickyHeadSx }}>Mã / Tên / Sàn / Ngành</TableCell>
            <TableCell>Điểm</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell>Lý do</TableCell>
            <TableCell>Độ tin cậy</TableCell>
            <TableCell>Sẵn sàng</TableCell>
            <TableCell>Định giá</TableCell>
            <TableCell>Tăng trưởng</TableCell>
            <TableCell>Thanh khoản</TableCell>
            <TableCell align="right" sx={{ ...stickyActionSx, ...stickyHeadSx }}>
              Hành động
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={`${item.code}-${item.rank}`} hover>
              <TableCell sx={stickyRankSx}>
                <Chip size="small" label={`#${item.rank}`} color={item.rank <= 10 ? "primary" : "default"} />
              </TableCell>
              <TableCell sx={stickyCodeSx}>
                <Typography sx={{ fontWeight: 700 }}>{item.code}</Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "-webkit-box",
                    overflow: "hidden",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    lineHeight: 1.35,
                  }}
                >
                  {item.name}
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5, mt: 0.75 }}>
                  {item.exchange && <Chip size="small" label={item.exchange} />}
                  {item.industryGroup && (
                    <Chip size="small" label={industryGroupLabel(item.industryGroup)} variant="outlined" />
                  )}
                </Stack>
              </TableCell>
              <TableCell sx={{ minWidth: 112 }}>
                <Tooltip title="Điểm sàng lọc tổng hợp, không phải khuyến nghị mua.">
                  <Chip
                    label={formatNumber(item.finalScore)}
                    color={scoreColor(item.finalScore)}
                    sx={{ fontWeight: 700 }}
                  />
                </Tooltip>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  Q{formatNumber(item.qualityScore)} / G{formatNumber(item.growthScore)} / V
                  {formatNumber(item.valuationScore)}
                </Typography>
              </TableCell>
              <TableCell sx={{ minWidth: 94 }}>
                <Chip label={decisionLabel(item.decision, item.decisionLabel)} color={decisionColor(item.decision)} size="small" />
              </TableCell>
              <TableCell sx={{ minWidth: 144 }}>
                <ReasonChips item={item} />
              </TableCell>
              <TableCell sx={{ minWidth: 96 }}>
                <Tooltip title="Độ tin cậy của dữ liệu đầu vào.">
                  <Chip
                    size="small"
                    label={`DL: ${shortConfidenceLevel(item.dataConfidenceLevel)}`}
                    color={confidenceColor(item.dataConfidenceLevel)}
                    sx={{ mb: 0.5 }}
                  />
                </Tooltip>
                <Tooltip title="Độ tin cậy của kết luận phân tích.">
                  <Chip
                    size="small"
                    label={`KL: ${shortConfidenceLevel(item.conclusionConfidenceLevel)}`}
                    color={confidenceColor(item.conclusionConfidenceLevel)}
                  />
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
                <Tooltip title="Khả năng giao dịch/thoát vị thế dựa trên thanh khoản.">
                  <Chip
                    size="small"
                    label={shortExecutionLabel(item.executionReadiness)}
                    color={executionColor(item.executionReadiness)}
                  />
                </Tooltip>
              </TableCell>
              <TableCell sx={{ minWidth: 122 }}>
                <Typography variant="body2">Giá: {formatNumber(item.latestPrice)}k</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Ngày: {item.latestPriceDate ?? "-"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  P/E {formatNumber(item.pe)} · P/B {formatNumber(item.pb)}
                </Typography>
              </TableCell>
              <TableCell sx={{ minWidth: 96 }}>
                <Typography variant="body2">DT {formatPercent(item.revenueCagr)}</Typography>
                <Typography variant="body2">LN {formatPercent(item.profitCagr)}</Typography>
                <Typography variant="body2">ROE {formatPercent(item.averageRoe)}</Typography>
              </TableCell>
              <TableCell sx={{ minWidth: 96 }}>
                <Chip
                  size="small"
                  label={liquidityLabel(item.liquidityLevel)}
                  color={liquidityColor(item.liquidityLevel)}
                  sx={{ mb: 0.5 }}
                />
                {item.liquidityWarning && (
                  <Chip size="small" label="Thanh khoản thấp" color="warning" sx={{ display: "block" }} />
                )}
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

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: "100vw", sm: 560 }, height: "100vh", overflowY: "auto", bgcolor: "background.default" }}>
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            p: 3,
            pb: 2,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
            <Box>
              <Typography variant="h5">{code}</Typography>
              <Typography color="text.secondary">{detail?.name ?? "Đang tải chi tiết"}</Typography>
            </Box>
            <IconButton onClick={onClose} aria-label="Đóng">
              <CloseIcon />
            </IconButton>
          </Stack>
          <Chip
            size="small"
            color="warning"
            variant="outlined"
            label="Sàng lọc sơ bộ, không phải khuyến nghị mua/bán"
          />
          {detail && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
              <Button variant="contained" size="small" onClick={() => onCreateThesis(detail)}>
                Tạo hồ sơ
              </Button>
              <Button
                variant="outlined"
                size="small"
                disabled={Boolean(actionLoading)}
                onClick={() => onAddWatchlist(detail)}
              >
                {actionLoading === "watchlist" ? "Đang thêm..." : "Thêm vào watchlist"}
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                disabled={Boolean(actionLoading)}
                onClick={() => onReject(detail)}
              >
                {actionLoading === "reject" ? "Đang loại..." : "Loại bỏ"}
              </Button>
            </Stack>
          )}
        </Box>

        <Box sx={{ p: 3, pt: 2 }}>
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
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 2 }}>
                  <Chip label={decisionLabel(detail.decision, detail.decisionLabel)} color={decisionColor(detail.decision)} />
                  <Chip
                    label={shortResearchLabel(detail.researchReadiness)}
                    color={readinessColor(detail.researchReadiness)}
                  />
                  <Chip
                    label={executionLabel(detail.executionReadiness ?? "")}
                    color={executionColor(detail.executionReadiness)}
                  />
                  {detail.exchange && <Chip label={detail.exchange} variant="outlined" />}
                  {detail.industryGroup && <Chip label={industryGroupLabel(detail.industryGroup)} variant="outlined" />}
                </Stack>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                  Tổng quan điểm
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.5 }}>
                  <MetricLine label="Điểm tổng hợp" value={formatNumber(detail.finalScore)} />
                  <MetricLine label="Điểm tín hiệu" value={formatNumber(detail.signalScore)} />
                  <MetricLine label="Chất lượng" value={formatNumber(detail.qualityScore)} />
                  <MetricLine label="Tăng trưởng" value={formatNumber(detail.growthScore)} />
                  <MetricLine label="Định giá" value={formatNumber(detail.valuationScore)} />
                  <MetricLine label="Loại cơ hội" value={opportunityTypeLabel(detail.opportunityType)} />
                </Box>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                  Độ tin cậy & mức sẵn sàng
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.5 }}>
                  <MetricLine label="Độ tin cậy dữ liệu" value={confidenceLevelLabel(detail.dataConfidenceLevel)} />
                  <MetricLine label="Độ tin cậy kết luận" value={confidenceLevelLabel(detail.conclusionConfidenceLevel)} />
                  <MetricLine label="Mức nghiên cứu" value={readinessLabel(detail.researchReadiness ?? "")} />
                  <MetricLine label="Khả năng giao dịch" value={executionLabel(detail.executionReadiness ?? "")} />
                </Box>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                  Định giá
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.5 }}>
                  <MetricLine label="Giá" value={`${formatNumber(detail.latestPrice)}k`} />
                  <MetricLine label="Ngày giá" value={detail.latestPriceDate ?? "-"} />
                  <MetricLine label="P/E" value={formatNumber(detail.pe)} />
                  <MetricLine label="P/B" value={formatNumber(detail.pb)} />
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
        </Box>
      </Box>
    </Drawer>
  );
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

function MetricCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        {helper && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            {helper}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
    </Box>
  );
}

function formatNumber(value?: number | null, maximumFractionDigits = 2) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return value.toLocaleString("vi-VN", { maximumFractionDigits });
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
  };
  return value ? labels[value] ?? value : "-";
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

function shortExecutionLabel(code?: string | null) {
  const labels: Record<string, string> = {
    READY_TO_TRADE: "GD tốt",
    TRADE_WITH_SIZE_LIMIT: "Giới hạn quy mô",
    LOW_LIQUIDITY_CAUTION: "Thanh khoản yếu",
    NOT_RECOMMENDED_TO_TRADE: "Không nên GD",
  };
  return code ? labels[code] ?? executionLabel(code) : "-";
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
  if (score >= 6) return "warning";
  return "error";
}

function decisionColor(value?: string | null): BadgeColor {
  switch (value) {
    case "WATCHLIST":
      return "primary";
    case "REVIEW":
      return "warning";
    case "AVOID":
      return "default";
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
      return "warning";
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
