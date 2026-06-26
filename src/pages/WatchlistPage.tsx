import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate } from "react-router-dom";
import { watchlistApi } from "../api/watchlistApi";
import { decisionPlanApi } from "../api/decisionPlanApi";
import { decisionPlanCreateUrl, decisionPlanOpenUrl } from "../utils/decisionPlanRouting";
import type { ResearchThesisStatus } from "../types/researchThesis";
import type { WatchlistItem, WatchlistSummary } from "../types/watchlist";

type SortMode = "UPDATED_DESC" | "REVIEW_ASC" | "CODE_ASC";

interface WatchlistViewItem {
  stockCode: string;
  companyName?: string;
  industry?: string;
  exchange?: string;
  apiItem?: WatchlistItem;
  hasThesis: boolean;
  thesisId?: number | null;
  year?: number;
  source: "THESIS" | "OPPORTUNITIES" | "MANUAL";
  addedAt?: string;
  updatedAt?: string;
  nextReviewDate?: string;
  thesisStatus: ResearchThesisStatus | "NO_THESIS";
  note?: string;
  keyReasons: string[];
  keyRisks: string[];
  missingData: string[];
  buyConditions: string[];
  rejectConditions: string[];
}

const thesisStatusOptions: Array<{ value: ResearchThesisStatus | "ALL" | "NO_THESIS"; label: string }> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "RESEARCHING", label: "Đang nghiên cứu" },
  { value: "WATCHLIST", label: "Theo dõi" },
  { value: "WAITING_DATA", label: "Cần thêm dữ liệu" },
  { value: "REJECTED", label: "Đã loại bỏ" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "NO_THESIS", label: "Chưa có hồ sơ" },
];

const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: "UPDATED_DESC", label: "Cập nhật mới nhất" },
  { value: "REVIEW_ASC", label: "Ngày review gần nhất" },
  { value: "CODE_ASC", label: "Mã A-Z" },
];

export default function WatchlistPage() {
  const navigate = useNavigate();

  const [apiItems, setApiItems] = useState<WatchlistItem[]>([]);
  const [apiSummary, setApiSummary] = useState<WatchlistSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingCode, setUpdatingCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activePlanCodes, setActivePlanCodes] = useState<Set<string>>(new Set());

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<ResearchThesisStatus | "ALL" | "NO_THESIS">("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("REVIEW_ASC");
  const [dueOnly, setDueOnly] = useState(false);

  const viewItems = useMemo(() => apiItems.map(toViewItem), [apiItems]);

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const today = new Date().toISOString().slice(0, 10);

    return viewItems
      .filter((item) => {
        const matchesKeyword =
          !normalizedKeyword ||
          item.stockCode.toLowerCase().includes(normalizedKeyword) ||
          item.companyName?.toLowerCase().includes(normalizedKeyword) ||
          item.industry?.toLowerCase().includes(normalizedKeyword);

        const matchesStatus = statusFilter === "ALL" || item.thesisStatus === statusFilter;
        const matchesDue = !dueOnly || Boolean(item.nextReviewDate && item.nextReviewDate <= today);

        return matchesKeyword && matchesStatus && matchesDue;
      })
      .sort((a, b) => sortWatchlistItems(a, b, sortMode));
  }, [dueOnly, keyword, sortMode, statusFilter, viewItems]);

  const summary = useMemo(() => {
    if (apiSummary) {
      return {
        total: apiSummary.total,
        due: apiSummary.dueReview,
        researching: apiSummary.researching,
        waitingData: apiSummary.needMoreData,
        watching: apiSummary.watchlist,
        rejected: apiSummary.rejected,
        noThesis: apiSummary.noThesis,
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    return {
      total: viewItems.length,
      due: viewItems.filter((item) => item.nextReviewDate && item.nextReviewDate <= today).length,
      researching: viewItems.filter((item) => item.thesisStatus === "RESEARCHING").length,
      waitingData: viewItems.filter((item) => item.thesisStatus === "WAITING_DATA").length,
      watching: viewItems.filter((item) => item.thesisStatus === "WATCHLIST").length,
      rejected: viewItems.filter((item) => item.thesisStatus === "REJECTED").length,
      noThesis: viewItems.filter((item) => !item.hasThesis).length,
    };
  }, [apiSummary, viewItems]);

  const loadWatchlist = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const [data, activePlans] = await Promise.all([
          watchlistApi.getAll(),
          decisionPlanApi.listAllActive().catch((err) => { console.error("Không tải được ACTIVE decision plans", err); return []; }),
        ]);
        setApiItems(data.items ?? []);
        setApiSummary(data.summary ?? null);
        setActivePlanCodes(new Set(activePlans.map((plan) => plan.stockCode.toUpperCase())));
      } catch (err) {
        console.error(err);
        setApiItems([]);
        setApiSummary(null);
        setErrorMessage("Không tải được danh sách theo dõi từ backend.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWatchlist();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadWatchlist]);

  const openThesis = (item: WatchlistViewItem) => {
    if (item.hasThesis && item.thesisId) {
      navigate(`/investment-thesis/new?thesisId=${encodeURIComponent(item.thesisId)}`);
      return;
    }

    const yearQuery = item.year ? `&year=${encodeURIComponent(item.year)}` : "";
    navigate(`/investment-thesis/new?stockCode=${encodeURIComponent(item.stockCode)}${yearQuery}`);
  };

  const openDecisionPlan = (item: WatchlistViewItem) => {
    if (activePlanCodes.has(item.stockCode.toUpperCase())) {
      navigate(decisionPlanOpenUrl(item.stockCode));
      return;
    }
    navigate(decisionPlanCreateUrl({
      stockCode: item.stockCode,
      linkedWatchlistId: item.apiItem?.id,
      linkedThesisId: item.thesisId ?? undefined,
      action: "WATCH", status: "ACTIVE", maxPositionPercent: 5,
      buyConditions: item.buyConditions, sellConditions: item.rejectConditions,
      riskNotes: item.keyRisks, personalNotes: "Tạo từ danh sách theo dõi",
    }));
  };

  const handleRemove = async (item: WatchlistViewItem) => {
    const confirmed = window.confirm(
      `Bạn muốn xóa ${item.stockCode} khỏi danh sách theo dõi? Hồ sơ nghiên cứu vẫn được giữ lại.`
    );

    if (!confirmed) return;

    try {
      setUpdatingCode(item.stockCode);
      setErrorMessage("");
      setSuccessMessage("");

      if (item.apiItem) {
        await watchlistApi.remove(item.apiItem.id);
        setApiItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.apiItem?.id));
      }

      setSuccessMessage(`Đã xóa ${item.stockCode} khỏi danh sách theo dõi. Hồ sơ nghiên cứu vẫn được giữ lại.`);
    } catch (err) {
      console.error(err);
      setErrorMessage("Không xóa được mã khỏi danh sách theo dõi.");
    } finally {
      setUpdatingCode("");
    }
  };

  return (
    <Box sx={{ textAlign: "left" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          mb: 3,
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Danh sách theo dõi
          </Typography>

          <Typography color="text.secondary" sx={{ maxWidth: 880 }}>
            Các mã đã có hồ sơ nghiên cứu và cần được review lại theo điều kiện đã đặt.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="outlined" onClick={() => navigate("/investment-thesis")}>
            Quay lại Hồ sơ nghiên cứu
          </Button>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={loadWatchlist}
            disabled={loading}
          >
            Tải lại
          </Button>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 3 }}>
        Danh sách này không phải khuyến nghị mua. Mỗi mã cần được đối chiếu với hồ sơ nghiên cứu trước khi hành động.
      </Alert>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 2,
          mb: 3,
        }}
      >
        <MetricCard label="Tổng mã theo dõi" value={summary.total.toString()} />
        <MetricCard label="Đến hạn review" value={summary.due.toString()} />
        <MetricCard label="Đang nghiên cứu" value={summary.researching.toString()} />
        <MetricCard label="Cần thêm dữ liệu" value={summary.waitingData.toString()} />
        <MetricCard label="Theo dõi" value={summary.watching.toString()} />
        <MetricCard label="Chưa có hồ sơ" value={summary.noThesis.toString()} />
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Bộ lọc
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr 1fr auto" },
              gap: 2,
              alignItems: "center",
            }}
          >
            <TextField
              label="Mã cổ phiếu"
              placeholder="Tìm mã, tên công ty hoặc ngành"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              fullWidth
            />

            <TextField
              select
              label="Trạng thái hồ sơ"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ResearchThesisStatus | "ALL" | "NO_THESIS")}
            >
              {thesisStatusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Sắp xếp"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant={dueOnly ? "contained" : "outlined"}
              onClick={() => setDueOnly((value) => !value)}
              sx={{ height: 56 }}
            >
              Đến hạn review
            </Button>
          </Box>
        </CardContent>
      </Card>

      {loading && (
        <Card sx={{ mb: 3 }}>
          <LinearProgress />
          <CardContent>
            <Typography>Đang tải danh sách theo dõi...</Typography>
          </CardContent>
        </Card>
      )}

      {errorMessage && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Stack spacing={2}>
        {filteredItems.map((item) => (
          <WatchlistCard
            key={item.stockCode}
            item={item}
            updating={updatingCode === item.stockCode}
            onOpen={() => openThesis(item)}
            hasActivePlan={activePlanCodes.has(item.stockCode.toUpperCase())}
            onDecisionPlan={() => openDecisionPlan(item)}
            onRemove={() => handleRemove(item)}
          />
        ))}

        {filteredItems.length === 0 && !loading && (
          <Card>
            <CardContent sx={{ py: 5, textAlign: "center" }}>
              <Typography variant="h6">Chưa có mã nào trong danh sách theo dõi</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Hãy tạo hồ sơ nghiên cứu rồi bấm "Đưa vào danh sách theo dõi".
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}

function WatchlistCard({
  item,
  updating,
  onOpen,
  hasActivePlan,
  onDecisionPlan,
  onRemove,
}: {
  item: WatchlistViewItem;
  updating: boolean;
  onOpen: () => void;
  hasActivePlan: boolean;
  onDecisionPlan: () => void;
  onRemove: () => void;
}) {
  return (
    <Card>
      <CardContent>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, mb: 2 }}
        >
          <Box>
            <Typography variant="h6">
              {item.stockCode}
              {item.companyName ? ` - ${item.companyName}` : ""}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", rowGap: 1 }}>
              <Chip
                size="small"
                label={item.hasThesis ? translateThesisStatus(item.thesisStatus) : "Chưa có hồ sơ nghiên cứu"}
                color={statusColor(item.thesisStatus)}
              />
              {item.hasThesis && (
                <Chip size="small" label={`Review: ${item.nextReviewDate || "-"}`} variant="outlined" />
              )}
              <Chip size="small" label={`Nguồn: ${sourceLabel(item.source)}`} variant="outlined" />
              {item.hasThesis && <Chip size="small" label="Có hồ sơ nghiên cứu" variant="outlined" />}
              {item.updatedAt && <Chip size="small" label={`Cập nhật: ${formatShortDate(item.updatedAt)}`} variant="outlined" />}
            </Stack>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant={hasActivePlan ? "contained" : "outlined"} color="secondary" size="small" onClick={onDecisionPlan}>
              {hasActivePlan ? "Mở kế hoạch" : "Tạo kế hoạch"}
            </Button>
            <Button variant="outlined" size="small" onClick={onOpen}>
              {item.hasThesis ? "Mở hồ sơ" : "Tạo hồ sơ"}
            </Button>
            {item.hasThesis && (
              <Button variant="contained" size="small" onClick={onOpen}>
                Review ngay
              </Button>
            )}
            <Tooltip title={`Xóa ${item.stockCode} khỏi danh sách theo dõi`}>
              <span>
                <IconButton size="small" color="error" onClick={onRemove} disabled={updating}>
                  {updating ? <CircularProgress size={18} /> : <DeleteIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        {item.hasThesis ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
              gap: 2,
            }}
          >
            <ListBlock title="Luận điểm tích cực" items={item.keyReasons} />
            <ListBlock title="Rủi ro chính" items={item.keyRisks} />
            <ListBlock title="Điều kiện cân nhắc mua" items={item.buyConditions} maxItems={2} />
            <ListBlock title="Điều kiện loại bỏ" items={item.rejectConditions} maxItems={2} />
            <ListBlock title="Dữ liệu/câu hỏi cần kiểm tra" items={item.missingData} maxItems={2} />
          </Box>
        ) : (
          <Alert severity="info">
            Mã này chưa có hồ sơ nghiên cứu. Hãy tạo hồ sơ để ghi luận điểm, rủi ro và điều kiện review.
          </Alert>
        )}

        {item.hasThesis && item.note && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {item.note}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function ListBlock({ title, items, maxItems = 3 }: { title: string; items: string[]; maxItems?: number }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
        {title}
      </Typography>
      {items.length > 0 ? (
        <Box component="ul" sx={{ pl: 2, my: 0 }}>
          {items.slice(0, maxItems).map((item, index) => (
            <li key={`${title}-${index}`}>
              <Typography variant="body2" sx={{ lineHeight: 1.7, overflowWrap: "anywhere" }}>
                {item}
              </Typography>
            </li>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Chưa có dữ liệu.
        </Typography>
      )}
    </Box>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h5">{value}</Typography>
      </CardContent>
    </Card>
  );
}

function toViewItem(apiItem: WatchlistItem): WatchlistViewItem {
  return {
    stockCode: apiItem.stockCode,
    companyName: apiItem.companyName,
    industry: apiItem.industry,
    exchange: apiItem.exchange,
    apiItem,
    hasThesis: Boolean(apiItem.hasThesis),
    thesisId: apiItem.thesisId,
    year: apiItem.year,
    source: normalizeSource(apiItem.source),
    addedAt: apiItem.addedAt,
    updatedAt: apiItem.updatedAt,
    nextReviewDate: apiItem.nextReviewDate ?? undefined,
    thesisStatus: normalizeThesisStatus(apiItem.thesisStatus),
    note: apiItem.reason,
    keyReasons: apiItem.bullCaseSummary ?? [],
    keyRisks: apiItem.keyRisksSummary ?? [],
    missingData: apiItem.missingDataSummary ?? [],
    buyConditions: apiItem.buyConditionsSummary ?? [],
    rejectConditions: apiItem.rejectConditionsSummary ?? [],
  };
}

function sortWatchlistItems(a: WatchlistViewItem, b: WatchlistViewItem, sortMode: SortMode) {
  if (sortMode === "CODE_ASC") {
    return a.stockCode.localeCompare(b.stockCode);
  }

  if (sortMode === "REVIEW_ASC") {
    return (a.nextReviewDate || "9999-12-31").localeCompare(b.nextReviewDate || "9999-12-31");
  }

  return (b.updatedAt || b.addedAt || "").localeCompare(a.updatedAt || a.addedAt || "");
}

function translateThesisStatus(value: WatchlistViewItem["thesisStatus"]) {
  const labels: Record<WatchlistViewItem["thesisStatus"], string> = {
    DRAFT: "Bản nháp",
    RESEARCHING: "Đang nghiên cứu",
    WATCHLIST: "Theo dõi",
    WAITING_DATA: "Cần thêm dữ liệu",
    REJECTED: "Đã loại bỏ",
    NO_THESIS: "Chưa có hồ sơ",
  };
  return labels[value] ?? value;
}

function statusColor(value: WatchlistViewItem["thesisStatus"]) {
  if (value === "WATCHLIST") return "primary";
  if (value === "RESEARCHING") return "warning";
  if (value === "WAITING_DATA") return "info";
  if (value === "REJECTED") return "error";
  return "default";
}

function sourceLabel(value: WatchlistViewItem["source"]) {
  if (value === "OPPORTUNITIES") return "Cơ hội";
  if (value === "THESIS") return "Hồ sơ nghiên cứu";
  return "Thêm thủ công";
}

function normalizeSource(value?: string): WatchlistViewItem["source"] {
  if (value === "THESIS" || value === "OPPORTUNITIES") return value;
  return "MANUAL";
}

function normalizeThesisStatus(value?: string | null): WatchlistViewItem["thesisStatus"] {
  if (value === "DRAFT" || value === "RESEARCHING" || value === "WATCHLIST" || value === "WAITING_DATA" || value === "REJECTED") {
    return value;
  }
  return "NO_THESIS";
}

function formatShortDate(value?: string) {
  if (!value) return "-";
  return value.slice(0, 10);
}
