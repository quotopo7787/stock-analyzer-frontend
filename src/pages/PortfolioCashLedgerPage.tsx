import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import { portfolioCashLedgerApi } from "../api/portfolioCashLedgerApi";
import MoneyTextField from "../components/MoneyTextField";
import type {
  PortfolioCashDirection,
  PortfolioCashEntryType,
  PortfolioCashLedgerEntry,
  PortfolioCashLedgerSummary,
  PortfolioCashRebuildResponse,
} from "../types/portfolioCashLedger";

type AdjustmentForm = {
  entryDate: string;
  direction: PortfolioCashDirection;
  amount: string;
  notes: string;
};

type FilterForm = {
  fromDate: string;
  toDate: string;
  type: PortfolioCashEntryType | "";
};

const today = new Date().toISOString().slice(0, 10);
const defaultAdjustment: AdjustmentForm = { entryDate: today, direction: "INFLOW", amount: "", notes: "" };
const defaultFilters: FilterForm = { fromDate: "", toDate: "", type: "" };
const pageSize = 20;

export default function PortfolioCashLedgerPage() {
  const [summary, setSummary] = useState<PortfolioCashLedgerSummary | null>(null);
  const [entries, setEntries] = useState<PortfolioCashLedgerEntry[]>([]);
  const [filters, setFilters] = useState<FilterForm>(defaultFilters);
  const [form, setForm] = useState<AdjustmentForm>(defaultAdjustment);
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
      const [summaryResult, entriesResult] = await Promise.all([
        portfolioCashLedgerApi.getSummary(),
        portfolioCashLedgerApi.listEntries({
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
          type: filters.type || undefined,
          page,
          size: pageSize,
        }),
      ]);
      setSummary(summaryResult);
      setEntries(entriesResult.content);
      setTotalPages(Math.max(entriesResult.totalPages, 1));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const createAdjustment = async () => {
    const validation = validateAdjustment(form);
    if (validation) {
      setError(validation);
      return;
    }
    try {
      setSaving(true);
      setError("");
      await portfolioCashLedgerApi.createAdjustment({
        entryDate: form.entryDate,
        direction: form.direction,
        amount: Number(form.amount),
        notes: form.notes.trim() || undefined,
      });
      setMessage("Đã thêm điều chỉnh tiền mặt.");
      setForm(defaultAdjustment);
      setPage(0);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const rebuild = async () => {
    if (!window.confirm("Rebuild sẽ thay thế các dòng cash ledger sinh từ giao dịch. Các ADJUSTMENT thủ công vẫn được giữ. Tiếp tục?")) return;
    try {
      setLoading(true);
      setError("");
      const result = await portfolioCashLedgerApi.rebuildFromTransactions();
      setMessage(rebuildMessage(result));
      setPage(0);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (entry: PortfolioCashLedgerEntry) => {
    if (entry.sourceTransactionId != null) return;
    if (!window.confirm(`Xóa điều chỉnh tiền mặt ngày ${entry.entryDate}?`)) return;
    try {
      setLoading(true);
      setError("");
      await portfolioCashLedgerApi.deleteEntry(entry.id);
      setMessage("Đã xóa điều chỉnh tiền mặt.");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ textAlign: "left" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Sổ tiền mặt</Typography>
          <Typography color="text.secondary">
            Quản lý số dư tiền mặt persisted cho danh mục. Đây là sổ ghi nhận tiền, không phải công cụ đặt lệnh mua/bán.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => void rebuild()} disabled={loading}>Rebuild từ giao dịch</Button>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" onClose={() => setMessage("")} sx={{ mb: 2 }}>{message}</Alert>}

      <Stack spacing={3}>
        <SummaryCards summary={summary} />
        <AdjustmentCard form={form} saving={saving} onChange={setForm} onSubmit={() => void createAdjustment()} />
        <EntriesCard
          entries={entries}
          filters={filters}
          page={page}
          totalPages={totalPages}
          onFilterChange={(next) => { setFilters(next); setPage(0); }}
          onDelete={(entry) => void deleteEntry(entry)}
          onPageChange={setPage}
        />
      </Stack>
    </Box>
  );
}

function SummaryCards({ summary }: { summary: PortfolioCashLedgerSummary | null }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 2 }}>
      <Metric label="Số dư tiền mặt" value={formatVnd(summary?.netCashBalance)} tone={numberTone(summary?.netCashBalance)} />
      <Metric label="Tổng tiền vào" value={formatVnd(summary?.totalInflow)} tone="success" />
      <Metric label="Tổng tiền ra" value={formatVnd(summary?.totalOutflow)} tone="warning" />
      <Metric label="Số entry" value={formatNumber(summary?.entryCount)} />
      <Metric label="Entry gần nhất" value={summary?.latestEntryDate ?? "-"} />
    </Box>
  );
}

function AdjustmentCard({
  form,
  saving,
  onChange,
  onSubmit,
}: {
  form: AdjustmentForm;
  saving: boolean;
  onChange: (form: AdjustmentForm) => void;
  onSubmit: () => void;
}) {
  const field = (key: keyof AdjustmentForm) => ({
    value: form[key],
    onChange: (event: ChangeEvent<HTMLInputElement>) => onChange({ ...form, [key]: event.target.value }),
  });
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Thêm điều chỉnh</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "170px 170px minmax(180px, 1fr) minmax(220px, 2fr) auto" }, gap: 2, alignItems: "start" }}>
          <TextField label="Ngày" type="date" slotProps={{ inputLabel: { shrink: true } }} {...field("entryDate")} />
          <TextField select label="Chiều tiền" {...field("direction")}>
            <MenuItem value="INFLOW">Tiền vào</MenuItem>
            <MenuItem value="OUTFLOW">Tiền ra</MenuItem>
          </TextField>
          <MoneyTextField label="Số tiền" value={form.amount} onChange={(amount) => onChange({ ...form, amount })} />
          <TextField label="Ghi chú" value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} />
          <Button variant="contained" onClick={onSubmit} disabled={saving} sx={{ minHeight: 56 }}>Thêm điều chỉnh</Button>
        </Box>
      </CardContent>
    </Card>
  );
}

function EntriesCard({
  entries,
  filters,
  page,
  totalPages,
  onFilterChange,
  onDelete,
  onPageChange,
}: {
  entries: PortfolioCashLedgerEntry[];
  filters: FilterForm;
  page: number;
  totalPages: number;
  onFilterChange: (filters: FilterForm) => void;
  onDelete: (entry: PortfolioCashLedgerEntry) => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <Card>
      <CardContent>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", mb: 2 }}>
          <Box>
            <Typography variant="h6">Dòng tiền</Typography>
            <Typography variant="body2" color="text.secondary">Dòng sinh từ giao dịch nên được sửa ở transaction ledger rồi rebuild.</Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField size="small" label="Từ ngày" type="date" value={filters.fromDate} slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => onFilterChange({ ...filters, fromDate: event.target.value })} />
            <TextField size="small" label="Đến ngày" type="date" value={filters.toDate} slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => onFilterChange({ ...filters, toDate: event.target.value })} />
            <TextField size="small" select label="Loại" value={filters.type} sx={{ minWidth: 160 }} onChange={(event) => onFilterChange({ ...filters, type: event.target.value as PortfolioCashEntryType | "" })}>
              <MenuItem value="">Tất cả</MenuItem>
              {entryTypes.map((type) => <MenuItem key={type} value={type}>{entryTypeLabel(type)}</MenuItem>)}
            </TextField>
          </Stack>
        </Stack>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 980 }}>
            <TableHead>
              <TableRow>
                <TableCell>Ngày</TableCell>
                <TableCell>Loại entry</TableCell>
                <TableCell>Chiều tiền</TableCell>
                <TableCell align="right">Số tiền</TableCell>
                <TableCell>Ghi chú</TableCell>
                <TableCell>Nguồn transaction</TableCell>
                <TableCell>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>{entry.entryDate}</TableCell>
                  <TableCell><Chip size="small" label={entryTypeLabel(entry.cashEntryType)} variant="outlined" /></TableCell>
                  <TableCell><Chip size="small" label={directionLabel(entry.direction)} color={entry.direction === "INFLOW" ? "success" : "warning"} /></TableCell>
                  <TableCell align="right" sx={{ fontWeight: 750, color: entry.direction === "INFLOW" ? "success.main" : "warning.main" }}>{formatVnd(entry.amount)}</TableCell>
                  <TableCell>{entry.notes || "-"}</TableCell>
                  <TableCell>{entry.sourceTransactionId ? `#${entry.sourceTransactionId}` : "Thủ công"}</TableCell>
                  <TableCell>
                    <Button size="small" color="error" disabled={entry.sourceTransactionId != null} onClick={() => onDelete(entry)}>
                      Xóa
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && <TableRow><TableCell colSpan={7}>Chưa có dòng tiền nào.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", alignItems: "center", mt: 2 }}>
          <Button disabled={page === 0} onClick={() => onPageChange(page - 1)}>Trang trước</Button>
          <Typography>Trang {page + 1}/{totalPages}</Typography>
          <Button disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>Trang sau</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" | "error" }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5" sx={{ color: tone ? `${tone}.main` : "text.primary" }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

const entryTypes: PortfolioCashEntryType[] = ["CASH_IN", "CASH_OUT", "BUY", "SELL", "DIVIDEND", "FEE", "TAX", "ADJUSTMENT"];

function validateAdjustment(form: AdjustmentForm) {
  if (!form.entryDate) return "Ngày là bắt buộc.";
  if (!form.direction) return "Chiều tiền là bắt buộc.";
  const amount = Number(form.amount);
  if (!Number.isFinite(amount) || amount <= 0) return "Số tiền phải lớn hơn 0.";
  return "";
}

function rebuildMessage(result: PortfolioCashRebuildResponse) {
  return `Rebuild xong: tạo ${result.createdEntryCount} entry, xóa ${result.deletedGeneratedEntryCount} entry sinh tự động, giữ ${result.preservedAdjustmentCount} adjustment.`;
}

function apiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
    if (error.response?.status === 400) return "Dữ liệu sổ tiền mặt chưa hợp lệ. Vui lòng kiểm tra lại.";
  }
  return "Không tải được dữ liệu sổ tiền mặt.";
}

function entryTypeLabel(value: PortfolioCashEntryType) {
  const labels: Record<PortfolioCashEntryType, string> = {
    CASH_IN: "Nạp tiền",
    CASH_OUT: "Rút tiền",
    BUY: "Mua",
    SELL: "Bán",
    DIVIDEND: "Cổ tức",
    FEE: "Phí",
    TAX: "Thuế",
    ADJUSTMENT: "Điều chỉnh",
  };
  return labels[value];
}

function directionLabel(value: PortfolioCashDirection) {
  return value === "INFLOW" ? "Tiền vào" : "Tiền ra";
}

function formatVnd(value?: number) { return value == null ? "-" : `${value.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} đ`; }
function formatNumber(value?: number) { return value == null ? "-" : value.toLocaleString("vi-VN", { maximumFractionDigits: 0 }); }
function numberTone(value?: number): "success" | "warning" | "error" | undefined {
  if (value == null || value === 0) return undefined;
  return value > 0 ? "success" : "error";
}
