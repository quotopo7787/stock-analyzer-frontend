import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { portfolioTransactionApi } from "../api/portfolioTransactionApi";
import MoneyTextField from "../components/MoneyTextField";
import type {
  PortfolioTransaction,
  PortfolioTransactionRequest,
  PortfolioTransactionSummary,
  PortfolioTransactionType,
} from "../types/portfolioTransaction";

type FilterForm = {
  stockCode: string;
  type: PortfolioTransactionType | "";
  fromDate: string;
  toDate: string;
};

type TransactionForm = {
  transactionType: PortfolioTransactionType;
  transactionDate: string;
  stockCode: string;
  quantity: string;
  price: string;
  amount: string;
  fee: string;
  tax: string;
  notes: string;
};

const today = new Date().toISOString().slice(0, 10);
const pageSize = 20;
const transactionTypes: PortfolioTransactionType[] = ["BUY", "SELL", "DIVIDEND", "CASH_IN", "CASH_OUT", "FEE", "TAX"];
const defaultFilters: FilterForm = { stockCode: "", type: "", fromDate: "", toDate: "" };
const defaultForm: TransactionForm = {
  transactionType: "BUY",
  transactionDate: today,
  stockCode: "",
  quantity: "",
  price: "",
  amount: "",
  fee: "",
  tax: "",
  notes: "",
};

export default function PortfolioTransactionLedgerPage() {
  const [summary, setSummary] = useState<PortfolioTransactionSummary | null>(null);
  const [transactions, setTransactions] = useState<PortfolioTransaction[]>([]);
  const [filters, setFilters] = useState<FilterForm>(defaultFilters);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PortfolioTransaction | null>(null);
  const [form, setForm] = useState<TransactionForm>(defaultForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [needsCashRebuild, setNeedsCashRebuild] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [summaryResult, pageResult] = await Promise.all([
        portfolioTransactionApi.getSummary(),
        portfolioTransactionApi.listTransactions({
          stockCode: filters.stockCode.trim() || undefined,
          type: filters.type || undefined,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
          page,
          size: pageSize,
        }),
      ]);
      setSummary(summaryResult);
      setTransactions(pageResult.content);
      setTotalPages(Math.max(pageResult.totalPages, 1));
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

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (transaction: PortfolioTransaction) => {
    setEditing(transaction);
    setForm(formFromTransaction(transaction));
    setDialogOpen(true);
  };

  const save = async () => {
    const validation = validateTransaction(form);
    if (validation) {
      setError(validation);
      return;
    }
    try {
      setSaving(true);
      setError("");
      const payload = formPayload(form);
      if (editing) {
        await portfolioTransactionApi.updateTransaction(editing.id, payload);
        setMessage("Đã cập nhật giao dịch. Hãy rebuild Sổ tiền mặt để cập nhật cash ledger.");
      } else {
        await portfolioTransactionApi.createTransaction(payload);
        setMessage("Đã tạo giao dịch. Hãy rebuild Sổ tiền mặt để cập nhật cash ledger.");
      }
      setNeedsCashRebuild(true);
      setDialogOpen(false);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteTransaction = async (transaction: PortfolioTransaction) => {
    if (!window.confirm(`Xóa giao dịch #${transaction.id}?`)) return;
    try {
      setLoading(true);
      setError("");
      await portfolioTransactionApi.deleteTransaction(transaction.id);
      setMessage("Đã xóa giao dịch. Hãy rebuild Sổ tiền mặt để cập nhật cash ledger.");
      setNeedsCashRebuild(true);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const rebuildCashLedger = async () => {
    if (!window.confirm("Rebuild sẽ thay thế các dòng cash ledger sinh từ giao dịch. Các ADJUSTMENT thủ công vẫn được giữ. Tiếp tục?")) return;
    try {
      setLoading(true);
      setError("");
      const result = await portfolioCashLedgerApi.rebuildFromTransactions();
      setMessage(`Đã rebuild Sổ tiền mặt: tạo ${result.createdEntryCount} entry, xóa ${result.deletedGeneratedEntryCount} entry sinh tự động.`);
      setNeedsCashRebuild(false);
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
          <Typography variant="h4" gutterBottom>Sổ giao dịch</Typography>
          <Typography color="text.secondary">
            Ghi nhận BUY/SELL/CASH/DIVIDEND/FEE/TAX cho danh mục. Giao dịch không tự động thay đổi vị thế đang nắm giữ.
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="outlined" onClick={() => void rebuildCashLedger()} disabled={loading}>Rebuild Sổ tiền mặt</Button>
          <Button variant="contained" onClick={openCreate}>Thêm giao dịch</Button>
        </Stack>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity={needsCashRebuild ? "warning" : "success"} onClose={() => setMessage("")} sx={{ mb: 2 }}>{message}</Alert>}
      {needsCashRebuild && (
        <Alert severity="warning" action={<Button color="inherit" size="small" onClick={() => void rebuildCashLedger()}>Rebuild</Button>} sx={{ mb: 2 }}>
          Giao dịch đã thay đổi. Hãy rebuild Sổ tiền mặt để cập nhật cash ledger.
        </Alert>
      )}

      <Stack spacing={3}>
        <SummaryCards summary={summary} />
        <FilterCard filters={filters} onChange={(next) => { setFilters(next); setPage(0); }} />
        <TransactionsTable
          transactions={transactions}
          page={page}
          totalPages={totalPages}
          onEdit={openEdit}
          onDelete={(transaction) => void deleteTransaction(transaction)}
          onPageChange={setPage}
        />
      </Stack>

      <TransactionDialog
        open={dialogOpen}
        editing={editing}
        form={form}
        saving={saving}
        onChange={setForm}
        onClose={() => setDialogOpen(false)}
        onSave={() => void save()}
      />
    </Box>
  );
}

function SummaryCards({ summary }: { summary: PortfolioTransactionSummary | null }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 2 }}>
      <Metric label="Tổng mua" value={formatVnd(summary?.totalBuyAmount)} tone="warning" />
      <Metric label="Tổng bán" value={formatVnd(summary?.totalSellAmount)} tone="success" />
      <Metric label="Cổ tức" value={formatVnd(summary?.totalDividend)} tone="success" />
      <Metric label="Phí" value={formatVnd(summary?.totalFee)} tone="warning" />
      <Metric label="Thuế" value={formatVnd(summary?.totalTax)} tone="warning" />
      <Metric label="Net cash flow" value={formatVnd(summary?.netCashFlow)} tone={numberTone(summary?.netCashFlow)} />
      <Metric label="Số giao dịch" value={formatNumber(summary?.transactionCount)} />
    </Box>
  );
}

function FilterCard({ filters, onChange }: { filters: FilterForm; onChange: (filters: FilterForm) => void }) {
  const reset = () => onChange(defaultFilters);
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Bộ lọc</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField label="Mã cổ phiếu" value={filters.stockCode} onChange={(event) => onChange({ ...filters, stockCode: event.target.value.toUpperCase() })} />
          <TextField select label="Loại giao dịch" value={filters.type} sx={{ minWidth: 180 }} onChange={(event) => onChange({ ...filters, type: event.target.value as PortfolioTransactionType | "" })}>
            <MenuItem value="">Tất cả</MenuItem>
            {transactionTypes.map((type) => <MenuItem key={type} value={type}>{transactionTypeLabel(type)}</MenuItem>)}
          </TextField>
          <TextField label="Từ ngày" type="date" value={filters.fromDate} slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => onChange({ ...filters, fromDate: event.target.value })} />
          <TextField label="Đến ngày" type="date" value={filters.toDate} slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => onChange({ ...filters, toDate: event.target.value })} />
          <Button variant="outlined" onClick={reset}>Reset</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function TransactionsTable({
  transactions,
  page,
  totalPages,
  onEdit,
  onDelete,
  onPageChange,
}: {
  transactions: PortfolioTransaction[];
  page: number;
  totalPages: number;
  onEdit: (transaction: PortfolioTransaction) => void;
  onDelete: (transaction: PortfolioTransaction) => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Danh sách giao dịch</Typography>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 1180 }}>
            <TableHead>
              <TableRow>
                <TableCell>Ngày</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Mã</TableCell>
                <TableCell align="right">Số lượng</TableCell>
                <TableCell align="right">Giá</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Fee</TableCell>
                <TableCell align="right">Tax</TableCell>
                <TableCell>Ghi chú</TableCell>
                <TableCell>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} hover>
                  <TableCell>{transaction.transactionDate}</TableCell>
                  <TableCell><Chip size="small" label={transactionTypeLabel(transaction.transactionType)} color={transactionTypeColor(transaction.transactionType)} /></TableCell>
                  <TableCell>{transaction.stockCode || "-"}</TableCell>
                  <TableCell align="right">{formatNumber(transaction.quantity ?? undefined)}</TableCell>
                  <TableCell align="right">{formatVnd(transaction.price ?? undefined)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 750 }}>{formatVnd(transaction.amount)}</TableCell>
                  <TableCell align="right">{formatVnd(transaction.fee ?? undefined)}</TableCell>
                  <TableCell align="right">{formatVnd(transaction.tax ?? undefined)}</TableCell>
                  <TableCell>{transaction.notes || "-"}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => onEdit(transaction)}>Sửa</Button>
                      <Button size="small" color="error" onClick={() => onDelete(transaction)}>Xóa</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && <TableRow><TableCell colSpan={10}>Chưa có giao dịch nào.</TableCell></TableRow>}
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

function TransactionDialog({
  open,
  editing,
  form,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: PortfolioTransaction | null;
  form: TransactionForm;
  saving: boolean;
  onChange: (form: TransactionForm) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const field = (key: keyof TransactionForm) => ({
    value: form[key],
    onChange: (event: ChangeEvent<HTMLInputElement>) => onChange({ ...form, [key]: event.target.value }),
  });
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{editing ? `Sửa giao dịch #${editing.id}` : "Thêm giao dịch"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
            <TextField select label="Loại giao dịch" {...field("transactionType")}>
              {transactionTypes.map((type) => <MenuItem key={type} value={type}>{transactionTypeLabel(type)}</MenuItem>)}
            </TextField>
            <TextField label="Ngày giao dịch" type="date" slotProps={{ inputLabel: { shrink: true } }} {...field("transactionDate")} />
            <TextField label="Mã cổ phiếu" value={form.stockCode} onChange={(event) => onChange({ ...form, stockCode: event.target.value.toUpperCase() })} helperText={stockCodeHelper(form.transactionType)} />
            <TextField label="Số lượng" type="number" {...field("quantity")} />
            <MoneyTextField label="Giá" value={form.price} onChange={(price) => onChange({ ...form, price })} />
            <MoneyTextField label="Amount" value={form.amount} onChange={(amount) => onChange({ ...form, amount })} helperText="BUY/SELL có thể để trống để backend tự tính" />
            <MoneyTextField label="Fee" value={form.fee} onChange={(fee) => onChange({ ...form, fee })} />
            <MoneyTextField label="Tax" value={form.tax} onChange={(tax) => onChange({ ...form, tax })} />
            <TextField label="Ghi chú" value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} />
          </Box>
          <Alert severity="info">Giao dịch chỉ ghi nhận vào ledger, không tự động thay đổi vị thế hay đặt lệnh mua/bán.</Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Hủy</Button>
        <Button variant="contained" onClick={onSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu giao dịch"}</Button>
      </DialogActions>
    </Dialog>
  );
}

function validateTransaction(form: TransactionForm) {
  if (!form.transactionType) return "Loại giao dịch là bắt buộc.";
  if (!form.transactionDate) return "Ngày giao dịch là bắt buộc.";
  const quantity = optionalNumber(form.quantity);
  const price = optionalNumber(form.price);
  const amount = optionalNumber(form.amount);
  const fee = optionalNumber(form.fee);
  const tax = optionalNumber(form.tax);
  if (form.transactionType === "BUY" || form.transactionType === "SELL") {
    if (!form.stockCode.trim()) return "BUY/SELL cần mã cổ phiếu.";
    if (quantity === undefined || quantity <= 0) return "BUY/SELL cần số lượng > 0.";
    if (price === undefined || price <= 0) return "BUY/SELL cần giá > 0.";
    if (amount !== undefined && amount <= 0) return "Amount phải > 0 nếu nhập.";
  } else if (amount === undefined || amount <= 0) {
    return "Amount phải > 0.";
  }
  if (fee !== undefined && fee < 0) return "Fee phải >= 0.";
  if (tax !== undefined && tax < 0) return "Tax phải >= 0.";
  return "";
}

function formPayload(form: TransactionForm): PortfolioTransactionRequest {
  return {
    stockCode: form.stockCode.trim() || undefined,
    transactionType: form.transactionType,
    transactionDate: form.transactionDate,
    quantity: optionalNumber(form.quantity),
    price: optionalNumber(form.price),
    amount: optionalNumber(form.amount),
    fee: optionalNumber(form.fee),
    tax: optionalNumber(form.tax),
    notes: form.notes.trim() || undefined,
  };
}

function formFromTransaction(transaction: PortfolioTransaction): TransactionForm {
  return {
    transactionType: transaction.transactionType,
    transactionDate: transaction.transactionDate,
    stockCode: transaction.stockCode ?? "",
    quantity: valueString(transaction.quantity ?? undefined),
    price: valueString(transaction.price ?? undefined),
    amount: valueString(transaction.amount),
    fee: valueString(transaction.fee ?? undefined),
    tax: valueString(transaction.tax ?? undefined),
    notes: transaction.notes ?? "",
  };
}

function stockCodeHelper(type: PortfolioTransactionType) {
  if (type === "BUY" || type === "SELL") return "Bắt buộc cho BUY/SELL";
  if (type === "DIVIDEND") return "Không bắt buộc cho cổ tức";
  return "Không bắt buộc";
}

function apiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
    if (error.response?.status === 400) return "Dữ liệu giao dịch chưa hợp lệ. Vui lòng kiểm tra lại.";
    if (error.response?.status === 404) return "Không tìm thấy giao dịch hoặc mã cổ phiếu.";
  }
  return "Không tải được dữ liệu sổ giao dịch.";
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function valueString(value?: number) { return value == null ? "" : String(Math.round(value)); }
function formatVnd(value?: number) { return value == null ? "-" : `${value.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} đ`; }
function formatNumber(value?: number) { return value == null ? "-" : value.toLocaleString("vi-VN", { maximumFractionDigits: 4 }); }
function numberTone(value?: number): "success" | "warning" | "error" | undefined { if (value == null || value === 0) return undefined; return value > 0 ? "success" : "error"; }

function transactionTypeLabel(value: PortfolioTransactionType) {
  const labels: Record<PortfolioTransactionType, string> = {
    BUY: "Mua",
    SELL: "Bán",
    DIVIDEND: "Cổ tức",
    CASH_IN: "Nạp tiền",
    CASH_OUT: "Rút tiền",
    FEE: "Phí",
    TAX: "Thuế",
  };
  return labels[value];
}

function transactionTypeColor(value: PortfolioTransactionType): "default" | "success" | "warning" | "error" | "info" {
  if (value === "SELL" || value === "CASH_IN" || value === "DIVIDEND") return "success";
  if (value === "BUY") return "info";
  if (value === "FEE" || value === "TAX") return "warning";
  if (value === "CASH_OUT") return "error";
  return "default";
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
