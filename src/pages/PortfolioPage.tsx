import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, InputLabel, LinearProgress, NativeSelect, Snackbar,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import { portfolioApi } from "../api/portfolioApi";
import type { PortfolioPosition, PortfolioPositionPayload, PortfolioPositionStatus, PortfolioSummary } from "../types/portfolio";

const pageSize = 20;

export default function PortfolioPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handledQuery = useRef("");
  const [status, setStatus] = useState<PortfolioPositionStatus | "ALL">("ACTIVE");
  const [search, setSearch] = useState("");
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PortfolioPosition | null>(null);
  const [prefillStockCode, setPrefillStockCode] = useState("");

  const loadPositions = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const requests = status === "ALL"
        ? Promise.all([portfolioApi.listAll("ACTIVE"), portfolioApi.listAll("CLOSED")]).then(([active, closed]) => active.concat(closed))
        : portfolioApi.listAll(status);
      const items = await requests;
      setPositions(items.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")));
    } catch (err) { setError(apiErrorMessage(err)); }
    finally { setLoading(false); }
  }, [status]);

  const loadSummary = useCallback(async () => {
    try { setSummary(await portfolioApi.summary()); }
    catch (err) { setError(apiErrorMessage(err)); }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadPositions(), loadSummary()]);
  }, [loadPositions, loadSummary]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPositions();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPositions]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSummary();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSummary]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const queryKey = searchParams.toString();
      if (!queryKey || handledQuery.current === queryKey) return;
      const stockCodeParam = searchParams.get("stockCode")?.trim().toUpperCase();
      if (!stockCodeParam) return;
      handledQuery.current = queryKey;
      setSearch(stockCodeParam); setStatus("ACTIVE"); setPage(0);
      if (searchParams.get("create") === "1") {
        setEditing(null); setPrefillStockCode(stockCodeParam); setDialogOpen(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return positions.filter((item) => !keyword || item.stockCode.toLowerCase().includes(keyword)
      || item.companyName?.toLowerCase().includes(keyword));
  }, [positions, search]);
  const totalPages = Math.max(Math.ceil(filtered.length / pageSize), 1);
  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const clearIntegrationQuery = () => { if (searchParams.toString()) navigate("/portfolio", { replace: true }); };
  const openCreate = () => { setEditing(null); setPrefillStockCode(""); setDialogOpen(true); };
  const openEdit = async (position: PortfolioPosition) => {
    try { setEditing(await portfolioApi.get(position.id)); setDialogOpen(true); }
    catch (err) { setError(apiErrorMessage(err)); }
  };
  const closePosition = async (position: PortfolioPosition) => {
    try { await portfolioApi.close(position.id); setToast(`Đã đóng vị thế ${position.stockCode}.`); await refresh(); }
    catch (err) { setError(apiErrorMessage(err)); }
  };
  const activatePosition = async (position: PortfolioPosition) => {
    try { await portfolioApi.activate(position.id); setToast(`Đã kích hoạt lại vị thế ${position.stockCode}.`); await refresh(); }
    catch (err) { setError(apiErrorMessage(err, true)); }
  };

  return <Box sx={{ textAlign: "left" }}>
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", mb: 3 }}>
      <Box><Typography variant="h4" gutterBottom>Danh mục đầu tư</Typography>
        <Typography color="text.secondary">Theo dõi vị thế đang nắm giữ, lãi/lỗ tạm tính và tỷ trọng so với kế hoạch đầu tư.</Typography></Box>
      <Button variant="contained" onClick={openCreate}>Thêm vị thế</Button>
    </Stack>
    {loading && <LinearProgress sx={{ mb: 2 }} />}
    {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 2, mb: 3 }}>
      <Metric label="Số mã đang nắm" value={formatNumber(summary?.activePositionCount)} />
      <Metric label="Tổng giá vốn" value={formatVnd(summary?.totalCostValue)} />
      <Metric label="Giá trị thị trường" value={formatVnd(summary?.totalMarketValue)} />
      <Metric label="Lãi/lỗ tạm tính" value={formatVnd(summary?.totalUnrealizedPnL)} tone={numberTone(summary?.totalUnrealizedPnL)} />
      <Metric label="% lãi/lỗ" value={formatPercent(summary?.totalUnrealizedPnLPercent)} tone={numberTone(summary?.totalUnrealizedPnLPercent)} />
      <Metric label="Vượt tỷ trọng" value={formatNumber(summary?.overMaxPositionCount)} tone="warning" />
      <Metric label="Thiếu giá" value={formatNumber(summary?.missingPriceCount)} />
    </Box>
    <Card><CardContent>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2, alignItems: { md: "center" } }}>
        <FormControl sx={{ minWidth: 190 }}><InputLabel htmlFor="portfolio-status">Trạng thái</InputLabel>
          <NativeSelect id="portfolio-status" value={status} onChange={(event) => { setStatus(event.target.value as PortfolioPositionStatus | "ALL"); setPage(0); }}>
            <option value="ALL">Tất cả</option><option value="ACTIVE">Đang nắm giữ</option><option value="CLOSED">Đã đóng</option>
          </NativeSelect></FormControl>
        <TextField label="Tìm mã" value={search} onChange={(event) => { setSearch(event.target.value.toUpperCase()); setPage(0); }} />
        <Typography color="text.secondary">{filtered.length} vị thế</Typography>
      </Stack>
      <TableContainer><Table size="small" sx={{ minWidth: 2050 }}><TableHead><TableRow>
        <TableCell>Mã</TableCell><TableCell>Tên công ty</TableCell><TableCell>Sàn</TableCell><TableCell>Ngành</TableCell>
        <TableCell align="right">Số lượng</TableCell><TableCell align="right">Giá vốn TB</TableCell><TableCell align="right">Giá hiện tại</TableCell>
        <TableCell>Ngày giá</TableCell><TableCell align="right">Giá vốn</TableCell><TableCell align="right">Giá trị hiện tại</TableCell>
        <TableCell align="right">Lãi/lỗ</TableCell><TableCell align="right">% lãi/lỗ</TableCell><TableCell align="right">Tỷ trọng</TableCell>
        <TableCell>Kế hoạch</TableCell><TableCell>Cảnh báo</TableCell><TableCell>Hành động</TableCell>
      </TableRow></TableHead><TableBody>
        {visible.map((item) => <TableRow key={item.id} hover>
          <TableCell><strong>{item.stockCode}</strong></TableCell><TableCell>{item.companyName}</TableCell><TableCell>{item.exchange || "-"}</TableCell><TableCell>{item.industry || "-"}</TableCell>
          <TableCell align="right">{formatNumber(item.quantity)}</TableCell><TableCell align="right">{formatVnd(item.averageCost)}</TableCell>
          <TableCell align="right">{formatVnd(item.latestPrice)}</TableCell><TableCell>{item.latestPriceDate || "-"}</TableCell>
          <TableCell align="right">{formatVnd(item.costValue)}</TableCell><TableCell align="right">{formatVnd(item.marketValue)}</TableCell>
          <TableCell align="right" sx={{ color: toneColor(numberTone(item.unrealizedPnL)), fontWeight: 700 }}>{formatVnd(item.unrealizedPnL)}</TableCell>
          <TableCell align="right" sx={{ color: toneColor(numberTone(item.unrealizedPnLPercent)) }}>{formatPercent(item.unrealizedPnLPercent)}</TableCell>
          <TableCell align="right">{formatPercent(item.portfolioWeightPercent)}</TableCell>
          <TableCell>{item.linkedDecisionPlanId || item.activeDecisionPlanId ? `#${item.linkedDecisionPlanId ?? item.activeDecisionPlanId} · ${item.decisionAction ?? "-"}` : "-"}</TableCell>
          <TableCell><Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
            {item.positionWarning === "OVER_MAX_POSITION" && <Chip size="small" color="warning" label="Vượt tỷ trọng" />}
            {item.priceDataWarning === "MISSING_LATEST_PRICE" && <Chip size="small" color="error" label="Thiếu giá" />}
            {!item.positionWarning && !item.priceDataWarning && "-"}
          </Stack></TableCell>
          <TableCell><Stack direction="row" spacing={1}>
            <Button size="small" onClick={() => void openEdit(item)}>Xem / sửa</Button>
            {item.status === "ACTIVE" ? <Button size="small" color="error" onClick={() => void closePosition(item)}>Đóng vị thế</Button>
              : <Button size="small" color="success" onClick={() => void activatePosition(item)}>Kích hoạt lại</Button>}
          </Stack></TableCell>
        </TableRow>)}
        {!loading && visible.length === 0 && <TableRow><TableCell colSpan={16}>Chưa có vị thế nào. Hãy thêm vị thế đầu tiên.</TableCell></TableRow>}
      </TableBody></Table></TableContainer>
      <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", alignItems: "center", mt: 2 }}>
        <Button disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Trang trước</Button>
        <Typography>Trang {page + 1}/{totalPages}</Typography>
        <Button disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>Trang sau</Button>
      </Stack>
    </CardContent></Card>
    <PositionDialog open={dialogOpen} position={editing} prefillStockCode={prefillStockCode} onClose={() => { setDialogOpen(false); clearIntegrationQuery(); }} onSaved={async (message) => {
      setDialogOpen(false); setToast(message); clearIntegrationQuery(); await refresh();
    }} />
    <Snackbar open={Boolean(toast)} autoHideDuration={6000} onClose={() => setToast("")}>
      <Alert severity="success" onClose={() => setToast("")}>{toast}</Alert>
    </Snackbar>
  </Box>;
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" | "warning" }) {
  return <Card><CardContent><Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="h5" sx={{ color: toneColor(tone) }}>{value}</Typography></CardContent></Card>;
}

function PositionDialog({ open, position, prefillStockCode, onClose, onSaved }: {
  open: boolean; position: PortfolioPosition | null; prefillStockCode: string; onClose: () => void; onSaved: (message: string) => Promise<void>;
}) {
  const [stockCode, setStockCode] = useState("");
  const [decisionPlanId, setDecisionPlanId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [averageCost, setAverageCost] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!open) return;
      setStockCode(position?.stockCode ?? prefillStockCode); setDecisionPlanId(valueString(position?.linkedDecisionPlanId));
      setQuantity(valueString(position?.quantity)); setAverageCost(valueString(position?.averageCost));
      setNotes(position?.notes ?? ""); setError("");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, position, prefillStockCode]);

  const save = async () => {
    try {
      setError("");
      if (!stockCode.trim()) { setError("Mã cổ phiếu là bắt buộc."); return; }
      if (Number(quantity) <= 0) { setError("Số lượng phải lớn hơn 0."); return; }
      if (Number(averageCost) <= 0) { setError("Giá vốn trung bình phải lớn hơn 0 và nhập theo VND."); return; }
      setSaving(true);
      const payload: PortfolioPositionPayload = {
        stockCode: stockCode.trim().toUpperCase(), linkedDecisionPlanId: optionalNumber(decisionPlanId),
        quantity: Number(quantity), averageCost: Number(averageCost), notes: notes.trim() || undefined,
      };
      if (position) { await portfolioApi.update(position.id, payload); await onSaved(`Đã cập nhật vị thế ${position.stockCode}.`); }
      else { const created = await portfolioApi.create(payload); await onSaved(`Đã tạo vị thế ${created.stockCode}.`); }
    } catch (err) { setError(apiErrorMessage(err)); }
    finally { setSaving(false); }
  };

  return <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
    <DialogTitle>{position ? `Vị thế ${position.stockCode}` : "Thêm vị thế"}</DialogTitle><DialogContent>
      <Stack spacing={2} sx={{ mt: 1 }}>{error && <Alert severity="error">{error}</Alert>}
        <TextField label="Mã cổ phiếu" value={stockCode} onChange={(event) => setStockCode(event.target.value.toUpperCase())} disabled={Boolean(position)} required />
        <TextField label="Decision Plan ID" type="number" value={decisionPlanId} onChange={(event) => setDecisionPlanId(event.target.value)} helperText="Không bắt buộc" />
        <TextField label="Số lượng" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
        <TextField label="Giá vốn trung bình (VND)" type="number" value={averageCost} onChange={(event) => setAverageCost(event.target.value)} helperText="Nhập VND, ví dụ 45.000" required />
        <TextField label="Ghi chú" value={notes} onChange={(event) => setNotes(event.target.value)} multiline minRows={3} />
      </Stack></DialogContent><DialogActions><Button onClick={onClose} disabled={saving}>Hủy</Button>
      <Button variant="contained" onClick={() => void save()} disabled={saving}>{saving ? <CircularProgress size={22} /> : "Lưu vị thế"}</Button>
    </DialogActions>
  </Dialog>;
}

function apiErrorMessage(error: unknown, activating = false) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 409) return activating ? "Đã có vị thế ACTIVE khác cho mã này."
      : "Mã này đã có vị thế ACTIVE. Hãy sửa vị thế hiện tại hoặc đóng vị thế cũ trước.";
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
    if (error.response?.status === 404) return "Không tìm thấy mã cổ phiếu, vị thế hoặc kế hoạch liên kết.";
    if (error.response?.status === 400) return "Dữ liệu vị thế chưa hợp lệ. Vui lòng kiểm tra lại.";
  }
  return "Không thể xử lý yêu cầu Portfolio. Vui lòng thử lại.";
}

function optionalNumber(value: string) { return value.trim() ? Number(value) : undefined; }
function valueString(value?: number) { return value == null ? "" : String(value); }
function formatVnd(value?: number) { return value == null ? "-" : `${value.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} ₫`; }
function formatPercent(value?: number) { return value == null ? "-" : `${value.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`; }
function formatNumber(value?: number) { return value == null ? "-" : value.toLocaleString("vi-VN", { maximumFractionDigits: 4 }); }
function numberTone(value?: number): "positive" | "negative" | undefined { return value == null || value === 0 ? undefined : value > 0 ? "positive" : "negative"; }
function toneColor(tone?: "positive" | "negative" | "warning") { if (tone === "positive") return "success.main"; if (tone === "negative") return "error.main"; if (tone === "warning") return "warning.main"; return "inherit"; }
