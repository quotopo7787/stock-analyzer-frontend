import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, LinearProgress, MenuItem, Snackbar, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import { dataGapApi } from "../api/dataGapApi";
import type { DataGapReason, OpportunityDataGap, OpportunityDataGapPage } from "../types/dataGaps";

const labels: Record<DataGapReason, string> = {
  OLD_STOCK_PRICE: "Giá cũ", MISSING_SHARE_INFO: "Thiếu số cổ phiếu",
  MISSING_FINANCIAL_YEAR: "Thiếu năm BCTC", MISSING_FINANCIAL_STATEMENTS: "Chưa có BCTC",
};

export default function AdminDataGapsPage() {
  const [searchParams] = useSearchParams();
  const [reason, setReason] = useState<DataGapReason | "">(() => queryReason(searchParams.get("reason")));
  const [page, setPage] = useState(0);
  const [data, setData] = useState<OpportunityDataGapPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<OpportunityDataGap | null>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    try { setLoading(true); setError(""); setData(await dataGapApi.getGaps({ reason, page, size: 50 })); }
    catch (err) { console.error(err); setError("Không tải được danh sách dữ liệu thiếu."); }
    finally { setLoading(false); }
  }, [page, reason]);
  useEffect(() => { void load(); }, [load]);

  const count = (key: DataGapReason) => data?.reasonCounts?.[key] ?? 0;
  const total = Object.values(data?.reasonCounts ?? {}).reduce((sum, value) => sum + value, 0);
  return <Box sx={{ textAlign: "left" }}>
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", mb: 3 }}>
      <Box><Typography variant="h4" gutterBottom>Bổ sung dữ liệu thiếu</Typography>
        <Typography color="text.secondary">Rà soát mã chưa đủ điều kiện Opportunities và nhập dữ liệu có nguồn kiểm chứng.</Typography></Box>
      <Button variant="outlined" startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
        onClick={() => void load()} disabled={loading}>Tải lại</Button>
    </Stack>
    {loading && <LinearProgress sx={{ mb: 2 }} />}{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 2, mb: 3 }}>
      <Metric label="Tổng mã chưa eligible" value={total} /><Metric label="Thiếu share info" value={count("MISSING_SHARE_INFO")} />
      <Metric label="Thiếu BCTC" value={count("MISSING_FINANCIAL_YEAR") + count("MISSING_FINANCIAL_STATEMENTS")} />
      <Metric label="Giá cũ" value={count("OLD_STOCK_PRICE")} />
    </Box>
    <Card><CardContent>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2, alignItems: { sm: "center" } }}>
        <TextField select label="Lý do thiếu" value={reason} onChange={(e) => { setReason(e.target.value as DataGapReason | ""); setPage(0); }} sx={{ minWidth: 260 }}>
          <MenuItem value="">Tất cả</MenuItem>{Object.entries(labels).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField>
        <Typography color="text.secondary">{data?.totalElements ?? 0} mã</Typography>
      </Stack>
      <TableContainer><Table size="small" sx={{ minWidth: 1050 }}><TableHead><TableRow>
        <TableCell>Mã</TableCell><TableCell>Tên</TableCell><TableCell>Sàn</TableCell><TableCell>Ngành</TableCell>
        <TableCell>Lý do thiếu</TableCell><TableCell>Năm thiếu</TableCell><TableCell>Giá cuối</TableCell><TableCell>Hành động</TableCell>
      </TableRow></TableHead><TableBody>
        {data?.content.map((item) => <TableRow key={item.stockCode} hover>
          <TableCell><strong>{item.stockCode}</strong></TableCell><TableCell>{item.companyName}</TableCell>
          <TableCell>{item.exchange}</TableCell><TableCell>{item.industry || "-"}</TableCell>
          <TableCell><Chip size="small" color={item.primaryReason === "MISSING_SHARE_INFO" ? "warning" : "default"} label={labels[item.primaryReason]} /></TableCell>
          <TableCell>{item.missingYears.length ? item.missingYears.join(", ") : "-"}</TableCell>
          <TableCell>{item.latestPriceDate ? `${item.latestPriceDate} · ${item.latestPrice?.toLocaleString("vi-VN") ?? "-"}` : "-"}</TableCell>
          <TableCell>{item.primaryReason === "MISSING_SHARE_INFO" ? <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => setSelected(item)}>Nhập số cổ phiếu</Button>
            : <Typography variant="body2" color="text.secondary">{item.note}</Typography>}</TableCell>
        </TableRow>)}
        {!loading && !data?.content.length && <TableRow><TableCell colSpan={8}>Không có mã phù hợp.</TableCell></TableRow>}
      </TableBody></Table></TableContainer>
      <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", alignItems: "center", mt: 2 }}>
        <Button disabled={!data || page === 0 || loading} onClick={() => setPage((p) => p - 1)}>Trang trước</Button>
        <Typography>Trang {data ? data.page + 1 : 1}/{Math.max(data?.totalPages ?? 1, 1)}</Typography>
        <Button disabled={!data || page + 1 >= data.totalPages || loading} onClick={() => setPage((p) => p + 1)}>Trang sau</Button>
      </Stack>
    </CardContent></Card>
    <ShareDialog item={selected} onClose={() => setSelected(null)} onSaved={(message) => { setSelected(null); setToast(message); void load(); }} />
    <Snackbar open={Boolean(toast)} autoHideDuration={7000} onClose={() => setToast("")} message={toast} />
  </Box>;
}

function queryReason(value: string | null): DataGapReason | "" {
  return value && value in labels ? value as DataGapReason : "";
}

function Metric({ label, value }: { label: string; value: number }) {
  return <Card><CardContent><Typography color="text.secondary" variant="body2">{label}</Typography><Typography variant="h4">{value.toLocaleString("vi-VN")}</Typography></CardContent></Card>;
}

function ShareDialog({ item, onClose, onSaved }: { item: OpportunityDataGap | null; onClose: () => void; onSaved: (message: string) => void }) {
  const [year, setYear] = useState(2025); const [shares, setShares] = useState(""); const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  useEffect(() => { if (item) { setYear(item.missingYears[0] ?? 2025); setShares(""); setNote(""); setError(""); } }, [item]);
  const save = async () => { if (!item) return; try { setSaving(true); setError("");
      const result = await dataGapApi.saveShareInfo({ stockCode: item.stockCode, year, sharesOutstanding: Number(shares), sourceNote: note });
      onSaved(`Đã lưu share_info cho ${result.stockCode} ${result.year}. Eligible: ${result.eligibleStockCountBefore} → ${result.eligibleStockCountAfter}`);
    } catch (err) { console.error(err); setError("Không lưu được dữ liệu. Kiểm tra số cổ phiếu và ghi chú nguồn."); } finally { setSaving(false); } };
  return <Dialog open={Boolean(item)} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
    <DialogTitle>Nhập số cổ phiếu lưu hành</DialogTitle><DialogContent><Stack spacing={2} sx={{ mt: 1 }}>
      {error && <Alert severity="error">{error}</Alert>}<TextField label="Mã" value={item?.stockCode ?? ""} disabled />
      <TextField select label="Năm" value={year} onChange={(e) => setYear(Number(e.target.value))}>{(item?.missingYears.length ? item.missingYears : [2023, 2024, 2025]).map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField>
      <TextField label="Số cổ phiếu đang lưu" value="Chưa có dữ liệu cho năm này" disabled />
      <TextField label="Số cổ phiếu mới" type="number" value={shares} onChange={(e) => setShares(e.target.value)} required />
      <TextField label="Ghi chú nguồn" value={note} onChange={(e) => setNote(e.target.value)} multiline minRows={3} required />
    </Stack></DialogContent><DialogActions><Button onClick={onClose} disabled={saving}>Hủy</Button>
      <Button variant="contained" onClick={() => void save()} disabled={saving || Number(shares) <= 0 || !note.trim()}>{saving ? "Đang lưu..." : "Lưu và tính lại Opportunities"}</Button>
    </DialogActions></Dialog>;
}
