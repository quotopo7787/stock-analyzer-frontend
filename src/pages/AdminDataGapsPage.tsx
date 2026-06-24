import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Snackbar,
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
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import BuildIcon from "@mui/icons-material/Build";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { dataGapApi } from "../api/dataGapApi";
import { vietstockImportApi } from "../api/vietstockImportApi";
import type {
  DataGapReason,
  FinancialStatementValues,
  ManualFinancialStatementRequest,
  OpportunityDataGap,
  OpportunityDataGapPage,
} from "../types/dataGaps";
import type {
  VietstockFinancialStatementPreviewResponse,
  VietstockImportSessionResponse,
} from "../types/vietstockImport";

const todayIso = localTodayIso();

const REASON_LABELS: Record<DataGapReason, string> = {
  FUTURE_PRICE_DATE: "Giá tương lai",
  OLD_STOCK_PRICE: "Giá cũ",
  MISSING_RECENT_PRICE: "Chưa có giá",
  MISSING_SHARE_INFO: "Thiếu số cổ phiếu",
  MISSING_FINANCIAL_YEAR: "Thiếu năm BCTC",
  MISSING_FINANCIAL_STATEMENTS: "Chưa có BCTC",
};

type ActionDialogType = "share-info" | "stock-price" | "financial-statement" | "vietstock-financial" | null;

export default function AdminDataGapsPage() {
  const [searchParams] = useSearchParams();
  const [reason, setReason] = useState<DataGapReason | "">(() =>
    queryReason(searchParams.get("reason"))
  );
  const [page, setPage] = useState(0);
  const [data, setData] = useState<OpportunityDataGapPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<OpportunityDataGap | null>(null);
  const [dialogType, setDialogType] = useState<ActionDialogType>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setData(await dataGapApi.getGaps({ reason, page, size: 50 }));
    } catch (err) {
      console.error(err);
      setError("Không tải được danh sách dữ liệu thiếu.");
    } finally {
      setLoading(false);
    }
  }, [page, reason]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAction = (item: OpportunityDataGap) => {
    setSelected(item);
    if (item.primaryReason === "MISSING_SHARE_INFO") {
      setDialogType("share-info");
    } else if (
      item.primaryReason === "MISSING_FINANCIAL_YEAR" ||
      item.primaryReason === "MISSING_FINANCIAL_STATEMENTS"
    ) {
      setDialogType("financial-statement");
    } else {
      // OLD_STOCK_PRICE, FUTURE_PRICE_DATE, MISSING_RECENT_PRICE → stock price dialog
      setDialogType("stock-price");
    }
  };

  const openVietstockImport = (item: OpportunityDataGap) => {
    setSelected(item);
    setDialogType("vietstock-financial");
  };

  const closeDialog = () => {
    setSelected(null);
    setDialogType(null);
  };

  const futurePriceCount = data?.reasonCounts?.["FUTURE_PRICE_DATE"] ?? 0;
  const oldPriceCount = data?.reasonCounts?.["OLD_STOCK_PRICE"] ?? 0;
  const missingPriceCount = data?.reasonCounts?.["MISSING_RECENT_PRICE"] ?? 0;
  const missingShareCount = data?.reasonCounts?.["MISSING_SHARE_INFO"] ?? 0;
  const missingFinancialCount =
    (data?.reasonCounts?.["MISSING_FINANCIAL_YEAR"] ?? 0) +
    (data?.reasonCounts?.["MISSING_FINANCIAL_STATEMENTS"] ?? 0);
  const total = Object.values(data?.reasonCounts ?? {}).reduce((sum, v) => sum + v, 0);

  return (
    <Box sx={{ textAlign: "left" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", mb: 3 }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Bổ sung dữ liệu thiếu
          </Typography>
          <Typography color="text.secondary">
            Rà soát mã chưa đủ điều kiện Opportunities và nhập dữ liệu có nguồn kiểm chứng.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={() => void load()}
          disabled={loading}
        >
          Tải lại
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
          gap: 2,
          mb: 3,
        }}
      >
        <Metric label="Tổng mã chưa eligible" value={total} />
        {futurePriceCount > 0 && (
          <Metric label="Giá tương lai ⚠" value={futurePriceCount} severity="HIGH" />
        )}
        <Metric label="Thiếu share info" value={missingShareCount} />
        <Metric label="Thiếu BCTC" value={missingFinancialCount} />
        <Metric label="Giá cũ / thiếu giá" value={oldPriceCount + missingPriceCount} />
      </Box>

      <Card>
        <CardContent>
          {/* Reason filter */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mb: 2, alignItems: { sm: "center" } }}
          >
            <TextField
              select
              label="Lý do thiếu"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value as DataGapReason | "");
                setPage(0);
              }}
              sx={{ minWidth: 260 }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              {(Object.entries(REASON_LABELS) as [DataGapReason, string][]).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                  {data?.reasonCounts?.[key] ? ` (${data.reasonCounts[key]})` : ""}
                </MenuItem>
              ))}
            </TextField>
            <Typography color="text.secondary">{data?.totalElements ?? 0} mã</Typography>
          </Stack>

          {/* Table */}
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 1100 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Mã</TableCell>
                  <TableCell>Tên</TableCell>
                  <TableCell>Sàn</TableCell>
                  <TableCell>Ngành</TableCell>
                  <TableCell>Lý do</TableCell>
                  <TableCell>Mức độ</TableCell>
                  <TableCell>Năm thiếu</TableCell>
                  <TableCell>Giá cuối</TableCell>
                  <TableCell>Ghi chú</TableCell>
                  <TableCell>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.content.map((item) => (
                  <TableRow
                    key={item.stockCode}
                    hover
                    sx={
                      item.primaryReason === "FUTURE_PRICE_DATE"
                        ? { bgcolor: "warning.50" }
                        : undefined
                    }
                  >
                    <TableCell>
                      <strong>{item.stockCode}</strong>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.companyName}
                    </TableCell>
                    <TableCell>{item.exchange}</TableCell>
                    <TableCell>{item.industry || "-"}</TableCell>
                    <TableCell>
                      <ReasonChip reason={item.primaryReason} />
                    </TableCell>
                    <TableCell>
                      <SeverityChip severity={item.severity} />
                    </TableCell>
                    <TableCell>
                      {item.missingYears.length ? item.missingYears.join(", ") : "-"}
                    </TableCell>
                    <TableCell>
                      {item.latestPriceDate
                        ? `${item.latestPriceDate} · ${item.latestPrice?.toLocaleString("vi-VN") ?? "-"}`
                        : "-"}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <Tooltip title={item.note} placement="top-start">
                        <span>{item.note}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <ActionButton item={item} onOpen={openAction} />
                        {(item.primaryReason === "MISSING_FINANCIAL_YEAR" ||
                          item.primaryReason === "MISSING_FINANCIAL_STATEMENTS") && (
                          <Button size="small" variant="outlined" onClick={() => openVietstockImport(item)}>
                            Lấy từ Vietstock
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && !data?.content.length && (
                  <TableRow>
                    <TableCell colSpan={10}>Không có mã phù hợp.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Stack
            direction="row"
            spacing={2}
            sx={{ justifyContent: "flex-end", alignItems: "center", mt: 2 }}
          >
            <Button
              disabled={!data || page === 0 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              Trang trước
            </Button>
            <Typography>
              Trang {data ? data.page + 1 : 1}/{Math.max(data?.totalPages ?? 1, 1)}
            </Typography>
            <Button
              disabled={!data || page + 1 >= data.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Trang sau
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ShareInfoDialog
        item={dialogType === "share-info" ? selected : null}
        onClose={closeDialog}
        onSaved={(message) => {
          closeDialog();
          setToast(message);
          void load();
        }}
      />
      <StockPriceDialog
        item={dialogType === "stock-price" ? selected : null}
        onClose={closeDialog}
        onSaved={(message) => {
          closeDialog();
          setToast(message);
          void load();
        }}
      />
      {dialogType === "financial-statement" && selected && (
        <FinancialStatementDialog
          key={`${selected.stockCode}-${selected.primaryReason}`}
          item={selected}
          onClose={closeDialog}
          onSaved={(message) => {
            closeDialog();
            setToast(message);
            void load();
          }}
        />
      )}
      {dialogType === "vietstock-financial" && selected && (
        <VietstockFinancialStatementDialog
          key={`vietstock-${selected.stockCode}-${selected.primaryReason}`}
          item={selected}
          onClose={closeDialog}
          onSaved={(message) => {
            closeDialog();
            setToast(message);
            void load();
          }}
        />
      )}

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={7000}
        onClose={() => setToast("")}
        message={toast}
      />
    </Box>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function ReasonChip({ reason }: { reason: DataGapReason }) {
  const label = REASON_LABELS[reason] ?? reason;
  const color =
    reason === "FUTURE_PRICE_DATE"
      ? "error"
      : reason === "MISSING_SHARE_INFO"
      ? "warning"
      : reason === "MISSING_FINANCIAL_STATEMENTS"
      ? "error"
      : "default";
  return <Chip size="small" label={label} color={color} />;
}

function SeverityChip({ severity }: { severity?: string | null }) {
  if (!severity) return <span>-</span>;
  const color =
    severity === "HIGH" ? "error" : severity === "MEDIUM" ? "warning" : "default";
  return <Chip size="small" label={severity} color={color} variant="outlined" />;
}

function ActionButton({
  item,
  onOpen,
}: {
  item: OpportunityDataGap;
  onOpen: (item: OpportunityDataGap) => void;
}) {
  const { primaryReason, actionLabel } = item;

  if (primaryReason === "MISSING_FINANCIAL_STATEMENTS" || primaryReason === "MISSING_FINANCIAL_YEAR") {
    return (
      <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => onOpen(item)}>
        {actionLabel ?? "Nhập BCTC"}
      </Button>
    );
  }

  if (primaryReason === "FUTURE_PRICE_DATE") {
    return (
      <Button
        size="small"
        color="warning"
        startIcon={<WarningAmberIcon />}
        onClick={() => onOpen(item)}
      >
        {actionLabel ?? "Sửa giá tương lai"}
      </Button>
    );
  }

  // MISSING_SHARE_INFO
  if (primaryReason === "MISSING_SHARE_INFO") {
    return (
      <Button
        size="small"
        startIcon={<AddCircleOutlineIcon />}
        onClick={() => onOpen(item)}
      >
        {actionLabel ?? "Nhập số cổ phiếu"}
      </Button>
    );
  }

  // OLD_STOCK_PRICE / MISSING_RECENT_PRICE / fallback
  return (
    <Button
      size="small"
      startIcon={<BuildIcon />}
      onClick={() => onOpen(item)}
    >
      {actionLabel ?? "Cập nhật giá"}
    </Button>
  );
}

function Metric({
  label,
  value,
  severity,
}: {
  label: string;
  value: number;
  severity?: "HIGH" | "MEDIUM";
}) {
  return (
    <Card sx={severity === "HIGH" ? { borderColor: "error.main", borderWidth: 1.5, borderStyle: "solid" } : undefined}>
      <CardContent>
        <Typography color="text.secondary" variant="body2">
          {label}
        </Typography>
        <Typography variant="h4" color={severity === "HIGH" ? "error.main" : "text.primary"}>
          {value.toLocaleString("vi-VN")}
        </Typography>
      </CardContent>
    </Card>
  );
}

// ─── Share Info Dialog ──────────────────────────────────────────────────────

function ShareInfoDialog({
  item,
  onClose,
  onSaved,
}: {
  item: OpportunityDataGap | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [year, setYear] = useState(2025);
  const [shares, setShares] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (item) {
      setYear(item.missingYears[0] ?? 2025);
      setShares("");
      setNote("");
      setError("");
    }
  }, [item]);

  const save = async () => {
    if (!item) return;
    try {
      setSaving(true);
      setError("");
      const result = await dataGapApi.saveShareInfo({
        stockCode: item.stockCode,
        year,
        sharesOutstanding: Number(shares),
        sourceNote: note,
      });
      onSaved(
        `Đã lưu share_info cho ${result.stockCode} ${result.year}. Eligible: ${result.eligibleStockCountBefore} → ${result.eligibleStockCountAfter}`
      );
    } catch (err) {
      console.error(err);
      setError("Không lưu được dữ liệu. Kiểm tra số cổ phiếu và ghi chú nguồn.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(item)} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Nhập số cổ phiếu lưu hành — {item?.stockCode}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Mã" value={item?.stockCode ?? ""} disabled />
          <TextField
            select
            label="Năm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {(item?.missingYears.length ? item.missingYears : [2023, 2024, 2025]).map((v) => (
              <MenuItem key={v} value={v}>{v}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Số cổ phiếu mới (đơn vị: cp)"
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            required
            helperText="Ví dụ: 1470500000 (1,470.5 triệu cp)"
          />
          <TextField
            label="Ghi chú nguồn *"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={3}
            required
            helperText="Bắt buộc. Ví dụ: BCTC 2024 trang 12 / Cafef / HNX"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Hủy</Button>
        <Button
          variant="contained"
          onClick={() => void save()}
          disabled={saving || Number(shares) <= 0 || !note.trim()}
        >
          {saving ? "Đang lưu..." : "Lưu và tính lại Opportunities"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Stock Price Dialog ─────────────────────────────────────────────────────

function StockPriceDialog({
  item,
  onClose,
  onSaved,
}: {
  item: OpportunityDataGap | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [priceDate, setPriceDate] = useState(todayIso);
  const [closePrice, setClosePrice] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isFuturePriceReason = item?.primaryReason === "FUTURE_PRICE_DATE";

  useEffect(() => {
    if (item) {
      setPriceDate(todayIso);
      setClosePrice("");
      setNote("");
      setError("");
    }
  }, [item]);

  const save = async () => {
    if (!item) return;
    try {
      setSaving(true);
      setError("");
      const result = await dataGapApi.saveStockPrice({
        stockCode: item.stockCode,
        priceDate,
        closePrice: Number(closePrice),
        sourceNote: note,
      });
      onSaved(
        `Đã lưu giá ${result.stockCode} ngày ${result.priceDate}: ${result.newClosePrice?.toLocaleString("vi-VN")} VND/cp (${result.action}). Eligible: ${result.eligibleStockCountBefore} → ${result.eligibleStockCountAfter}`
      );
    } catch (err: unknown) {
      console.error(err);
      const responseData = axios.isAxiosError(err) ? err.response?.data : null;
      const msg =
        typeof responseData === "object" && responseData && "message" in responseData
          ? String(responseData.message)
          : "Không lưu được giá. Kiểm tra ngày, giá và ghi chú nguồn.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const priceDateIsInFuture = priceDate > todayIso;

  return (
    <Dialog open={Boolean(item)} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isFuturePriceReason ? "Sửa giá tương lai" : "Cập nhật giá cổ phiếu"} — {item?.stockCode}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {isFuturePriceReason && (
            <Alert severity="warning" icon={<WarningAmberIcon />}>
              Mã này đang có ngày giá nằm trong tương lai ({item?.latestPriceDate}). Hãy kiểm tra
              nguồn và nhập lại ngày/giá đúng.
            </Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}

          <TextField label="Mã" value={item?.stockCode ?? ""} disabled />
          <TextField
            label="Giá cuối hiện tại"
            value={
              item?.latestPrice != null
                ? `${item.latestPrice.toLocaleString("vi-VN")} (nghìn đồng/cp) — ngày ${item.latestPriceDate}`
                : "Chưa có"
            }
            disabled
          />
          <TextField
            label="Ngày giá mới"
            type="date"
            value={priceDate}
            onChange={(e) => setPriceDate(e.target.value)}
            error={priceDateIsInFuture}
            helperText={priceDateIsInFuture ? "Không được nhập ngày trong tương lai" : "Ngày giao dịch thực tế"}
            slotProps={{ htmlInput: { max: todayIso } }}
          />
          <TextField
            label="Giá đóng cửa mới (VND/cp)"
            type="number"
            value={closePrice}
            onChange={(e) => setClosePrice(e.target.value)}
            required
            helperText="Nhập theo VND/cp — VD: 73700. Hệ thống tự quy đổi khi lưu DB."
            slotProps={{ htmlInput: { step: "1", min: "1" } }}
          />
          <TextField
            label="Ghi chú nguồn *"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={3}
            required
            helperText="Bắt buộc. VD: Vietstock ngày 2026-06-18 / HNX bảng giá ATC"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Hủy</Button>
        <Button
          variant="contained"
          color={isFuturePriceReason ? "warning" : "primary"}
          onClick={() => void save()}
          disabled={saving || Number(closePrice) <= 0 || !note.trim() || priceDateIsInFuture}
        >
          {saving ? "Đang lưu..." : "Lưu và tính lại Opportunities"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Financial Statement Dialog ─────────────────────────────────────────────

type FinancialField =
  | "revenue"
  | "netProfit"
  | "totalAssets"
  | "totalLiabilities"
  | "equity"
  | "operatingCashFlow";

const financialFieldDefinitions: Array<{ key: FinancialField; label: string; allowNegative: boolean }> = [
  { key: "revenue", label: "Doanh thu thuần", allowNegative: false },
  { key: "netProfit", label: "Lợi nhuận sau thuế", allowNegative: true },
  { key: "totalAssets", label: "Tổng tài sản", allowNegative: false },
  { key: "totalLiabilities", label: "Tổng nợ phải trả", allowNegative: false },
  { key: "equity", label: "Vốn chủ sở hữu", allowNegative: false },
  { key: "operatingCashFlow", label: "Dòng tiền HĐKD", allowNegative: true },
];

const emptyFinancialValues = (): Record<FinancialField, string> => ({
  revenue: "",
  netProfit: "",
  totalAssets: "",
  totalLiabilities: "",
  equity: "",
  operatingCashFlow: "",
});

function FinancialStatementDialog({
  item,
  onClose,
  onSaved,
}: {
  item: OpportunityDataGap;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [year, setYear] = useState(item.missingYears?.[0] ?? 2025);
  const [values, setValues] = useState<Record<FinancialField, string>>(emptyFinancialValues);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [sourceNote, setSourceNote] = useState("");
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const yearOptions = item.missingYears?.length ? item.missingYears : [2023, 2024, 2025];

  useEffect(() => {
    let active = true;
    void dataGapApi.getFinancialStatement(item.stockCode, year)
      .then((existing) => {
        if (!active) return;
        const nextValues = emptyFinancialValues();
        for (const field of financialFieldDefinitions) {
          const currentValue = existing.current?.[field.key];
          nextValues[field.key] = currentValue === null || currentValue === undefined
            ? ""
            : String(currentValue);
        }
        setValues(nextValues);
        setMissingFields(existing.missingFields ?? []);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        console.error(err);
        setValues(emptyFinancialValues());
        setMissingFields([]);
        setError(apiErrorMessage(err, "Không tải được BCTC hiện tại."));
      })
      .finally(() => {
        if (active) setLoadingExisting(false);
      });
    return () => { active = false; };
  }, [item.stockCode, year]);

  const validationMessage = financialValidationMessage(year, values, sourceNote);

  const changeYear = (nextYear: number) => {
    setLoadingExisting(true);
    setValues(emptyFinancialValues());
    setMissingFields([]);
    setYear(nextYear);
  };

  const save = async () => {
    if (validationMessage) {
      setError(validationMessage || "Dữ liệu chưa hợp lệ.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const request: ManualFinancialStatementRequest = {
        stockCode: item.stockCode,
        year,
        sourceNote: sourceNote.trim(),
      };
      for (const field of financialFieldDefinitions) {
        const raw = values[field.key].trim();
        if (raw !== "") request[field.key] = Number(raw);
      }
      const result = await dataGapApi.saveFinancialStatement(request);
      const actionMessage = result.action === "INSERTED"
        ? `Đã thêm BCTC ${result.stockCode} ${result.year}`
        : result.action === "UPDATED"
          ? `Đã cập nhật BCTC ${result.stockCode} ${result.year}`
          : "Không có thay đổi dữ liệu";
      const eligibleMessage = `Eligible: ${result.eligibleStockCountBefore} → ${result.eligibleStockCountAfter}`;
      const warningMessage = result.warnings?.length
        ? ` · Cảnh báo: ${result.warnings.join("; ")}`
        : "";
      onSaved(`${actionMessage}. ${eligibleMessage}${warningMessage}`);
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, "Không lưu được BCTC. Hãy kiểm tra dữ liệu và nguồn."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Nhập báo cáo tài chính — {item?.stockCode}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {missingFields.length > 0 && (
            <Alert severity="info">
              Các trường đang thiếu: {missingFields.join(", ")}
            </Alert>
          )}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="Mã cổ phiếu" value={item.stockCode} disabled fullWidth />
            <TextField label="Tên công ty" value={item.companyName} disabled fullWidth />
            <TextField
              select
              label="Năm"
              value={year}
              onChange={(event) => changeYear(Number(event.target.value))}
              disabled={loadingExisting || saving}
              fullWidth
            >
              {yearOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
          </Stack>

          {loadingExisting ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", py: 2 }}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">Đang tải BCTC hiện tại...</Typography>
            </Stack>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))" }, gap: 2 }}>
              {financialFieldDefinitions.map((field) => (
                <TextField
                  key={field.key}
                  label={`${field.label} (VND)`}
                  type="number"
                  value={values[field.key]}
                  onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
                  error={!field.allowNegative && values[field.key] !== "" && Number(values[field.key]) < 0}
                  helperText={moneyHelper(values[field.key], field.allowNegative)}
                  slotProps={{ htmlInput: { step: "1", min: field.allowNegative ? undefined : "0" } }}
                />
              ))}
            </Box>
          )}

          <Alert severity="info">Nhập số tiền theo VND, không nhập theo nghìn đồng.</Alert>
          <TextField
            label="Ghi chú nguồn *"
            value={sourceNote}
            onChange={(event) => setSourceNote(event.target.value)}
            multiline
            minRows={3}
            required
            helperText="Ví dụ: BCTC kiểm toán 2025 / Báo cáo thường niên / Vietstock / website công ty"
          />
          {validationMessage && sourceNote.trim() && (
            <Typography variant="caption" color="error.main">{validationMessage}</Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Hủy</Button>
        <Button
          variant="contained"
          onClick={() => void save()}
          disabled={saving || loadingExisting || Boolean(validationMessage)}
        >
          {saving ? "Đang lưu..." : "Lưu BCTC"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function VietstockFinancialStatementDialog({
  item,
  onClose,
  onSaved,
}: {
  item: OpportunityDataGap;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [session, setSession] = useState<VietstockImportSessionResponse | null>(null);
  const [preview, setPreview] = useState<VietstockFinancialStatementPreviewResponse | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [allowOverwrite, setAllowOverwrite] = useState(false);
  const [pastedYear, setPastedYear] = useState(item.missingYears?.[0] ?? 2025);
  const [pastedUnitMultiplier, setPastedUnitMultiplier] = useState(1);
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const years = (item.missingYears?.length ? item.missingYears : [2024, 2025]).slice(-2);
  const importableRows = preview?.rows.filter(
    (row) => hasExtractedFinancialValue(row.extracted) && !row.warnings.includes("UNIT_UNCERTAIN")
  ) ?? [];

  const checkSession = async () => {
    try {
      setLoading(true);
      setError("");
      setSession(await vietstockImportApi.checkSession());
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, "Không kiểm tra được session Vietstock."));
    } finally {
      setLoading(false);
    }
  };

  const openVietstockBrowser = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await vietstockImportApi.openSession();
      setSession(result);
      if (result.loginUrl) {
        window.open(result.loginUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, "Khong mo duoc browser import Vietstock."));
    } finally {
      setLoading(false);
    }
  };

  const previewData = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await vietstockImportApi.previewFinancialStatements({ stockCode: item.stockCode, years });
      setPreview(result);
      if (result.warnings.includes("LOGIN_REQUIRED")) {
        setSession((current) => current ?? {
          status: "LOGIN_REQUIRED",
          warnings: ["LOGIN_REQUIRED"],
          message: "Cần đăng nhập Vietstock trên browser import trước khi lấy dữ liệu.",
        });
      }
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, "Không preview được dữ liệu Vietstock."));
    } finally {
      setLoading(false);
    }
  };

  const previewPastedData = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await vietstockImportApi.previewPastedFinancialStatements({
        stockCode: item.stockCode,
        year: pastedYear,
        unitMultiplier: pastedUnitMultiplier,
        rawText: pastedText,
      });
      setPreview(result);
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, "Không parse được dữ liệu Vietstock đã dán."));
    } finally {
      setLoading(false);
    }
  };

  const previewClipboardData = async () => {
    try {
      setLoading(true);
      setError("");
      if (!navigator.clipboard?.readText) {
        setError("Trình duyệt không cho đọc clipboard. Hãy dán dữ liệu vào ô rồi bấm Preview.");
        return;
      }
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText.trim()) {
        setError("Clipboard đang trống. Hãy copy bảng/dòng dữ liệu từ Vietstock trước.");
        return;
      }
      setPastedText(clipboardText);
      const result = await vietstockImportApi.previewPastedFinancialStatements({
        stockCode: item.stockCode,
        year: pastedYear,
        unitMultiplier: pastedUnitMultiplier,
        rawText: clipboardText,
      });
      setPreview(result);
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, "Không đọc/parse được clipboard. Hãy dán thủ công vào ô dữ liệu."));
    } finally {
      setLoading(false);
    }
  };

  const confirmImport = async () => {
    if (!preview || importableRows.length === 0) return;
    try {
      setSaving(true);
      setError("");
      const result = await vietstockImportApi.confirmFinancialStatements({
        stockCode: item.stockCode,
        rows: importableRows.map((row) => ({ year: row.year, ...(row.extracted ?? {}) })),
        sourceNote: `${preview.sourceNote}; user confirmed`,
        confirm: confirmed,
        allowOverwriteExisting: allowOverwrite,
      });
      const changed = result.rows.filter((row) => row.action === "INSERTED" || row.action === "UPDATED").length;
      onSaved(`Đã import BCTC Vietstock cho ${result.stockCode}: ${changed}/${result.rows.length} dòng có thay đổi.`);
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, "Không import được dữ liệu Vietstock."));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    void checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.stockCode]);

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="lg">
      <DialogTitle>Lấy BCTC từ Vietstock — {item.stockCode}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Alert severity="info">
            Module này chỉ hỗ trợ import có preview và user confirm. Không lưu mật khẩu/cookie Vietstock, không bypass login/paywall/CAPTCHA.
          </Alert>
          <Alert severity="warning">
            Nếu Vietstock đăng nhập bằng Google, hãy mở bằng Chrome thường. Google chặn đăng nhập trong browser automation, nên không nhập Google account trong cửa sổ Playwright/Chrome for Testing.
          </Alert>
          {session && (
            <Alert severity={session.status === "SESSION_OK" ? "success" : "warning"}>
              Session: {session.status}. {session.message}
              {session.profilePath ? ` Profile: ${session.profilePath}.` : ""}
            </Alert>
          )}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="Mã cổ phiếu" value={item.stockCode} disabled fullWidth />
            <TextField label="Năm thiếu" value={years.join(", ")} disabled fullWidth />
            <TextField label="Nguồn" value="Vietstock" disabled fullWidth />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => void checkSession()} disabled={loading || saving}>
              Kiểm tra đăng nhập
            </Button>
            <Button variant="contained" onClick={() => void previewData()} disabled={loading || saving}>
              {loading ? "Đang xử lý..." : "Preview dữ liệu"}
            </Button>
            <Button variant="text" onClick={() => void openVietstockBrowser()} disabled={loading || saving}>
              Mở Vietstock BCTC
            </Button>
          </Stack>
          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
            <Stack spacing={2}>
              <Alert severity="info">
                Cách chắc chắn nhất: mở Vietstock bằng Chrome thường, chọn đúng mã/năm, copy các dòng BCTC rồi dán vào đây.
                Mỗi lần dán cho một năm để tránh đoán nhầm thứ tự cột.
              </Alert>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  select
                  label="Năm dữ liệu dán"
                  value={pastedYear}
                  onChange={(event) => setPastedYear(Number(event.target.value))}
                  fullWidth
                >
                  {(years.length ? years : [2024, 2025]).map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Đơn vị trên Vietstock"
                  value={pastedUnitMultiplier}
                  onChange={(event) => setPastedUnitMultiplier(Number(event.target.value))}
                  fullWidth
                >
                  <MenuItem value={1}>Đồng</MenuItem>
                  <MenuItem value={1000}>Nghìn đồng</MenuItem>
                  <MenuItem value={1000000}>Triệu đồng</MenuItem>
                  <MenuItem value={1000000000}>Tỷ đồng</MenuItem>
                </TextField>
              </Stack>
              <TextField
                label="Dán dữ liệu copy từ bảng Vietstock"
                value={pastedText}
                onChange={(event) => setPastedText(event.target.value)}
                multiline
                minRows={5}
                fullWidth
                placeholder={"Ví dụ dán các dòng có: Doanh thu thuần, Lợi nhuận sau thuế, Tổng tài sản, Nợ phải trả, Vốn chủ sở hữu, Lưu chuyển tiền thuần từ HĐKD"}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="contained"
                  onClick={() => void previewClipboardData()}
                  disabled={loading || saving}
                >
                  Đọc clipboard & Preview
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => void previewPastedData()}
                  disabled={loading || saving || !pastedText.trim()}
                >
                  Preview dữ liệu đã dán
                </Button>
              </Stack>
            </Stack>
          </Box>
          {preview && (
            <>
              {preview.warnings.length > 0 && <Alert severity="warning">Warnings: {preview.warnings.join("; ")}</Alert>}
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Năm</TableCell>
                      <TableCell>Field</TableCell>
                      <TableCell align="right">Existing value</TableCell>
                      <TableCell align="right">Vietstock value</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Warning</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.rows.flatMap((row) =>
                      financialFieldDefinitions.map((field) => {
                        const existingValue = row.existing?.[field.key];
                        const extractedValue = row.extracted?.[field.key];
                        const willFill = extractedValue != null && (allowOverwrite || existingValue == null);
                        return (
                          <TableRow key={`${row.year}-${field.key}`}>
                            <TableCell>{row.year}</TableCell>
                            <TableCell>{field.label}</TableCell>
                            <TableCell align="right">{formatVnd(existingValue)}</TableCell>
                            <TableCell align="right">{formatVnd(extractedValue)}</TableCell>
                            <TableCell>{willFill ? "Fill" : existingValue != null ? "Skip existing" : "-"}</TableCell>
                            <TableCell>{row.warnings.join(", ") || "-"}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
          <FormControlLabel
            control={<Checkbox checked={allowOverwrite} onChange={(event) => setAllowOverwrite(event.target.checked)} />}
            label="Cho phép cập nhật field đã có dữ liệu"
          />
          <FormControlLabel
            control={<Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />}
            label="Tôi đã kiểm tra và xác nhận dữ liệu lấy từ Vietstock"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Hủy</Button>
        <Button variant="contained" onClick={() => void confirmImport()} disabled={saving || !confirmed || importableRows.length === 0}>
          {saving ? "Đang import..." : "Import vào app"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function financialValidationMessage(
  year: number,
  values: Record<FinancialField, string>,
  sourceNote: string
) {
  if (!year || year > new Date().getFullYear()) return "Năm BCTC không hợp lệ.";
  if (!sourceNote.trim()) return "Ghi chú nguồn là bắt buộc.";
  if (!financialFieldDefinitions.some((field) => values[field.key].trim() !== "")) {
    return "Phải nhập ít nhất một chỉ tiêu tài chính.";
  }
  for (const field of financialFieldDefinitions) {
    const raw = values[field.key].trim();
    if (raw === "") continue;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return `${field.label} không hợp lệ.`;
    if (!field.allowNegative && parsed < 0) return `${field.label} không được âm.`;
  }
  return "";
}

function formatVnd(value?: number | null) {
  return value == null ? "-" : `${value.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} VND`;
}

function hasExtractedFinancialValue(value?: FinancialStatementValues | null) {
  if (!value) return false;
  return financialFieldDefinitions.some((field) => value[field.key] !== null && value[field.key] !== undefined);
}

function moneyHelper(value: string, allowNegative: boolean) {
  if (!value.trim()) return allowNegative ? "Có thể nhập số âm · Đơn vị VND" : "Đơn vị VND";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "Giá trị không hợp lệ";
  return `${parsed.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} VND${allowNegative ? " · Cho phép số âm" : ""}`;
}

function apiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    if ("message" in data && data.message) return String(data.message);
    if ("error" in data && data.error) return String(data.error);
  }
  if (error.response?.status === 404) return "Không tìm thấy mã cổ phiếu.";
  return fallback;
}

function queryReason(value: string | null): DataGapReason | "" {
  return value && value in REASON_LABELS ? (value as DataGapReason) : "";
}

function localTodayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
