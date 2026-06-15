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
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate } from "react-router-dom";
import { watchlistApi } from "../api/watchlistApi";
import type {
  CreateWatchlistItemRequest,
  WatchlistItem,
  WatchlistStatus,
} from "../types/watchlist";

const statusOptions: Array<{ value: WatchlistStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "WATCHING", label: "Đang theo dõi" },
  { value: "READY_TO_BUY", label: "Sẵn sàng mua" },
  { value: "HOLDING", label: "Đang nắm giữ" },
  { value: "SOLD", label: "Đã bán" },
  { value: "REJECTED", label: "Đã loại" },
];

const editableStatusOptions = statusOptions.filter(
  (option): option is { value: WatchlistStatus; label: string } =>
    option.value !== "ALL"
);

export default function WatchlistPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [stockCode, setStockCode] = useState("");
  const [targetBuyPrice, setTargetBuyPrice] = useState("");
  const [targetSellPrice, setTargetSellPrice] = useState("");
  const [reason, setReason] = useState("");

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<WatchlistStatus | "ALL">(
    "ALL"
  );

  useEffect(() => {
    loadWatchlist();
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return items.filter((item) => {
      const matchesKeyword =
        !normalizedKeyword ||
        item.stockCode?.toLowerCase().includes(normalizedKeyword) ||
        item.companyName?.toLowerCase().includes(normalizedKeyword) ||
        item.industry?.toLowerCase().includes(normalizedKeyword);

      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [items, keyword, statusFilter]);

  const statusCounts = useMemo(() => {
    return editableStatusOptions.reduce<Record<WatchlistStatus, number>>(
      (counts, option) => {
        counts[option.value] = items.filter(
          (item) => item.status === option.value
        ).length;
        return counts;
      },
      {
        WATCHING: 0,
        READY_TO_BUY: 0,
        HOLDING: 0,
        SOLD: 0,
        REJECTED: 0,
      }
    );
  }, [items]);

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const data = await watchlistApi.getAll();
      setItems(data ?? []);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "Không tải được watchlist. Kiểm tra backend, CORS hoặc endpoint /api/watchlist."
      );
    } finally {
      setLoading(false);
    }
  };

  const parseOptionalNumber = (value: string) => {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const resetForm = () => {
    setStockCode("");
    setTargetBuyPrice("");
    setTargetSellPrice("");
    setReason("");
  };

  const handleCreate = async () => {
    const normalizedStockCode = stockCode.trim().toUpperCase();

    if (!normalizedStockCode) {
      setErrorMessage("Vui lòng nhập mã cổ phiếu.");
      return;
    }

    const payload: CreateWatchlistItemRequest = {
      stockCode: normalizedStockCode,
      targetBuyPrice: parseOptionalNumber(targetBuyPrice),
      targetSellPrice: parseOptionalNumber(targetSellPrice),
      reason: reason.trim() || undefined,
    };

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const created = await watchlistApi.create(payload);

      setItems((currentItems) => [
        created,
        ...currentItems.filter((item) => item.id !== created.id),
      ]);
      resetForm();
      setSuccessMessage(`Đã thêm ${created.stockCode} vào watchlist.`);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "Không thêm được mã vào watchlist. Kiểm tra mã cổ phiếu hoặc dữ liệu đã tồn tại."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (
    item: WatchlistItem,
    nextStatus: WatchlistStatus
  ) => {
    if (item.status === nextStatus) return;

    try {
      setUpdatingId(item.id);
      setErrorMessage("");
      setSuccessMessage("");

      const updated = await watchlistApi.updateStatus(item.id, {
        status: nextStatus,
      });

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === updated.id ? updated : currentItem
        )
      );
      setSuccessMessage(
        `Đã cập nhật trạng thái ${updated.stockCode} thành ${translateStatus(
          updated.status
        )}.`
      );
    } catch (err) {
      console.error(err);
      setErrorMessage("Không cập nhật được trạng thái watchlist.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (item: WatchlistItem) => {
    const confirmed = window.confirm(
      `Xóa ${item.stockCode} khỏi watchlist?`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(item.id);
      setErrorMessage("");
      setSuccessMessage("");

      await watchlistApi.remove(item.id);

      setItems((currentItems) =>
        currentItems.filter((currentItem) => currentItem.id !== item.id)
      );
      setSuccessMessage(`Đã xóa ${item.stockCode} khỏi watchlist.`);
    } catch (err) {
      console.error(err);
      setErrorMessage("Không xóa được mã khỏi watchlist.");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatNumber = (value?: number | null) => {
    if (value === undefined || value === null || Number.isNaN(value)) return "-";

    return value.toLocaleString("vi-VN", {
      maximumFractionDigits: 0,
    });
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const translateStatus = (value?: WatchlistStatus) => {
    if (value === "WATCHING") return "Đang theo dõi";
    if (value === "READY_TO_BUY") return "Sẵn sàng mua";
    if (value === "HOLDING") return "Đang nắm giữ";
    if (value === "SOLD") return "Đã bán";
    if (value === "REJECTED") return "Đã loại";
    return "-";
  };

  const getStatusColor = (value?: WatchlistStatus) => {
    if (value === "READY_TO_BUY") return "success";
    if (value === "HOLDING") return "primary";
    if (value === "WATCHING") return "warning";
    if (value === "SOLD") return "default";
    if (value === "REJECTED") return "error";
    return "default";
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
            Watchlist
          </Typography>

          <Typography color="text.secondary">
            Quản lý danh sách cổ phiếu đang theo dõi, giá mua/bán mục tiêu và
            trạng thái nghiên cứu.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={loadWatchlist}
          disabled={loading}
        >
          Tải lại
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 2,
          mb: 3,
        }}
      >
        <MetricCard label="Tổng số mã" value={items.length.toString()} />
        <MetricCard
          label="Sẵn sàng mua"
          value={statusCounts.READY_TO_BUY.toString()}
        />
        <MetricCard
          label="Đang nắm giữ"
          value={statusCounts.HOLDING.toString()}
        />
        <MetricCard
          label="Đang theo dõi"
          value={statusCounts.WATCHING.toString()}
        />
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Thêm vào watchlist
          </Typography>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ alignItems: { xs: "stretch", md: "flex-start" } }}
          >
            <TextField
              label="Mã cổ phiếu"
              placeholder="VD: FPT"
              value={stockCode}
              onChange={(event) => setStockCode(event.target.value)}
              sx={{ minWidth: { md: 150 } }}
            />

            <TextField
              label="Giá mua mục tiêu"
              type="number"
              value={targetBuyPrice}
              onChange={(event) => setTargetBuyPrice(event.target.value)}
              sx={{ minWidth: { md: 170 } }}
            />

            <TextField
              label="Giá bán mục tiêu"
              type="number"
              value={targetSellPrice}
              onChange={(event) => setTargetSellPrice(event.target.value)}
              sx={{ minWidth: { md: 170 } }}
            />

            <TextField
              label="Lý do theo dõi"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              fullWidth
            />

            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} /> : <AddIcon />}
              onClick={handleCreate}
              disabled={saving}
              sx={{ minWidth: 130, height: 56 }}
            >
              Thêm
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ alignItems: { xs: "stretch", md: "flex-start" } }}
          >
            <TextField
              label="Tìm kiếm"
              placeholder="Mã, tên công ty hoặc ngành"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              fullWidth
            />

            <TextField
              select
              label="Trạng thái"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as WatchlistStatus | "ALL")
              }
              sx={{ minWidth: { md: 220 } }}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Card>
        {loading && <LinearProgress />}

        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            sx={{
              mb: 2,
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
            }}
          >
            <Box>
              <Typography variant="h6">Danh sách theo dõi</Typography>
              <Typography variant="body2" color="text.secondary">
                API: GET /api/watchlist
              </Typography>
            </Box>

            <Typography color="text.secondary">
              Hiển thị {filteredItems.length} / {items.length} mã
            </Typography>
          </Stack>

          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 1080 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Mã</TableCell>
                  <TableCell>Công ty</TableCell>
                  <TableCell>Sàn</TableCell>
                  <TableCell>Ngành</TableCell>
                  <TableCell align="right">Giá mua</TableCell>
                  <TableCell align="right">Giá bán</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Lý do</TableCell>
                  <TableCell>Cập nhật</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700 }}>
                        {item.stockCode}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      {item.companyName || "-"}
                    </TableCell>
                    <TableCell>{item.exchange || "-"}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      {item.industry || "-"}
                    </TableCell>
                    <TableCell align="right">
                      {formatNumber(item.targetBuyPrice)}
                    </TableCell>
                    <TableCell align="right">
                      {formatNumber(item.targetSellPrice)}
                    </TableCell>
                    <TableCell sx={{ minWidth: 190 }}>
                      <TextField
                        select
                        size="small"
                        value={item.status}
                        onChange={(event) =>
                          handleUpdateStatus(
                            item,
                            event.target.value as WatchlistStatus
                          )
                        }
                        disabled={updatingId === item.id}
                        fullWidth
                      >
                        {editableStatusOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell sx={{ minWidth: 220 }}>
                      {item.reason || "-"}
                    </TableCell>
                    <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ justifyContent: "center" }}
                      >
                        <Chip
                          size="small"
                          label={translateStatus(item.status)}
                          color={getStatusColor(item.status)}
                        />

                        <Tooltip title={`Mở ${item.stockCode}`}>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/stocks/${item.stockCode}`)}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={`Xóa ${item.stockCode}`}>
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemove(item)}
                              disabled={updatingId === item.id}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredItems.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <Box sx={{ py: 5, textAlign: "center" }}>
                        <Typography variant="h6">
                          Chưa có mã nào trong watchlist
                        </Typography>
                        <Typography color="text.secondary">
                          Thêm mã cổ phiếu hoặc đổi bộ lọc để xem danh sách phù hợp.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
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
