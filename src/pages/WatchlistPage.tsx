import { useEffect, useMemo, useState } from "react";
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
import { researchThesisDraftStorage } from "../api/researchThesisDraftStorage";
import { watchlistApi } from "../api/watchlistApi";
import type { ResearchThesisDraft, ResearchThesisStatus } from "../types/researchThesis";
import type { WatchlistItem } from "../types/watchlist";

type SortMode = "UPDATED_DESC" | "REVIEW_ASC" | "CODE_ASC";

interface WatchlistViewItem {
  stockCode: string;
  companyName?: string;
  industry?: string;
  exchange?: string;
  apiItem?: WatchlistItem;
  draft?: ResearchThesisDraft;
  source: "THESIS" | "OPPORTUNITIES" | "WATCHLIST_API";
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
  const [drafts, setDrafts] = useState<ResearchThesisDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingCode, setUpdatingCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<ResearchThesisStatus | "ALL" | "NO_THESIS">("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("REVIEW_ASC");
  const [dueOnly, setDueOnly] = useState(false);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const viewItems = useMemo(() => mergeWatchlistData(apiItems, drafts), [apiItems, drafts]);

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
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: viewItems.length,
      due: viewItems.filter((item) => item.nextReviewDate && item.nextReviewDate <= today).length,
      researching: viewItems.filter((item) => item.thesisStatus === "RESEARCHING").length,
      waitingData: viewItems.filter((item) => item.thesisStatus === "WAITING_DATA").length,
      watching: viewItems.filter((item) => item.thesisStatus === "WATCHLIST").length,
      rejected: viewItems.filter((item) => item.thesisStatus === "REJECTED").length,
    };
  }, [viewItems]);

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      setDrafts(researchThesisDraftStorage.getAll());

      try {
        const data = await watchlistApi.getAll();
        setApiItems(data ?? []);
      } catch (err) {
        console.error(err);
        setApiItems([]);
        setErrorMessage("Không tải được danh sách theo dõi từ backend. Đang hiển thị tạm từ hồ sơ nghiên cứu đã lưu.");
      }
    } finally {
      setLoading(false);
    }
  };

  const openThesis = (item: WatchlistViewItem) => {
    if (item.draft) {
      navigate(`/investment-thesis/new?draftId=${encodeURIComponent(item.draft.id)}`);
      return;
    }

    navigate(`/investment-thesis/new?stockCode=${encodeURIComponent(item.stockCode)}`);
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

      if (item.draft?.thesisStatus === "WATCHLIST") {
        const saved = researchThesisDraftStorage.save({
          ...item.draft,
          thesisStatus: "RESEARCHING",
        });
        setDrafts((currentDrafts) =>
          currentDrafts.map((draft) => (draft.id === saved.id ? saved : draft))
        );
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
        <MetricCard label="Đã loại" value={summary.rejected.toString()} />
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
  onRemove,
}: {
  item: WatchlistViewItem;
  updating: boolean;
  onOpen: () => void;
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
              <Chip size="small" label={translateThesisStatus(item.thesisStatus)} color={statusColor(item.thesisStatus)} />
              <Chip size="small" label={`Review: ${item.nextReviewDate || "-"}`} variant="outlined" />
              <Chip size="small" label={`Nguồn: ${sourceLabel(item.source)}`} variant="outlined" />
              {item.updatedAt && <Chip size="small" label={`Cập nhật: ${formatShortDate(item.updatedAt)}`} variant="outlined" />}
            </Stack>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" onClick={onOpen}>
              Mở hồ sơ
            </Button>
            <Button variant="contained" size="small" onClick={onOpen}>
              Review ngay
            </Button>
            <Tooltip title={`Xóa ${item.stockCode} khỏi danh sách theo dõi`}>
              <span>
                <IconButton size="small" color="error" onClick={onRemove} disabled={updating}>
                  {updating ? <CircularProgress size={18} /> : <DeleteIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <ListBlock title="Luận điểm tích cực" items={item.keyReasons} />
          <ListBlock title="Rủi ro chính" items={item.keyRisks} />
          <ListBlock title="Điều kiện cân nhắc mua" items={item.buyConditions} />
          <ListBlock title="Điều kiện loại bỏ" items={item.rejectConditions} />
          <ListBlock title="Dữ liệu/câu hỏi cần kiểm tra" items={item.missingData} />
        </Box>

        {item.note && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {item.note}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
        {title}
      </Typography>
      {items.length > 0 ? (
        <Box component="ul" sx={{ pl: 2, my: 0 }}>
          {items.slice(0, 3).map((item, index) => (
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

function mergeWatchlistData(apiItems: WatchlistItem[], drafts: ResearchThesisDraft[]): WatchlistViewItem[] {
  const byCode = new Map<string, WatchlistViewItem>();

  apiItems.forEach((item) => {
    const code = item.stockCode.trim().toUpperCase();
    const draft = drafts.find((candidate) => candidate.stockCode.trim().toUpperCase() === code);
    byCode.set(code, toViewItem(code, item, draft));
  });

  drafts
    .filter((draft) => draft.thesisStatus === "WATCHLIST")
    .forEach((draft) => {
      const code = draft.stockCode.trim().toUpperCase();
      if (!byCode.has(code)) {
        byCode.set(code, toViewItem(code, undefined, draft));
      }
    });

  return Array.from(byCode.values()).filter((item) => item.thesisStatus !== "REJECTED");
}

function toViewItem(stockCode: string, apiItem?: WatchlistItem, draft?: ResearchThesisDraft): WatchlistViewItem {
  return {
    stockCode,
    companyName: apiItem?.companyName,
    industry: apiItem?.industry,
    exchange: apiItem?.exchange,
    apiItem,
    draft,
    source: draft?.source === "OPPORTUNITIES" ? "OPPORTUNITIES" : draft ? "THESIS" : "WATCHLIST_API",
    addedAt: apiItem?.addedAt ?? draft?.createdAt,
    updatedAt: draft?.updatedAt ?? apiItem?.updatedAt,
    nextReviewDate: draft?.nextReviewDate,
    thesisStatus: draft?.thesisStatus ?? "NO_THESIS",
    note: draft?.personalNote || apiItem?.reason,
    keyReasons: draft?.bullCase ?? [],
    keyRisks: draft?.keyRisks ?? [],
    missingData: draft?.missingData ?? [],
    buyConditions: draft?.buyConditions ?? [],
    rejectConditions: draft?.rejectConditions ?? [],
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
  return "Watchlist";
}

function formatShortDate(value?: string) {
  if (!value) return "-";
  return value.slice(0, 10);
}
