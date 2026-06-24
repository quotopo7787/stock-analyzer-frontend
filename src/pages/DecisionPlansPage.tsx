import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, InputLabel, LinearProgress, NativeSelect, Snackbar, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import { decisionPlanApi } from "../api/decisionPlanApi";
import type {
  DecisionPlanAction, DecisionPlanDetail, DecisionPlanListItem, DecisionPlanPage,
  DecisionPlanPayload, DecisionPlanPrefill, DecisionPlanStatus,
} from "../types/decisionPlans";

const actions: DecisionPlanAction[] = ["BUY", "WATCH", "HOLD", "TRIM", "SELL", "AVOID"];
const statuses: DecisionPlanStatus[] = ["DRAFT", "ACTIVE", "CLOSED"];

const actionLabels: Record<DecisionPlanAction, string> = {
  BUY: "Mua", WATCH: "Theo dõi", HOLD: "Nắm giữ", TRIM: "Giảm tỷ trọng", SELL: "Bán", AVOID: "Tránh",
};
const statusLabels: Record<DecisionPlanStatus, string> = {
  DRAFT: "Bản nháp", ACTIVE: "Đang hoạt động", CLOSED: "Đã đóng",
};

export default function DecisionPlansPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handledIntegrationQuery = useRef("");
  const [status, setStatus] = useState<DecisionPlanStatus | "">("");
  const [action, setAction] = useState<DecisionPlanAction | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [stockCode, setStockCode] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<DecisionPlanPage | null>(null);
  const [detailNotesById, setDetailNotesById] = useState<Record<number, string>>({});
  const [summary, setSummary] = useState({ total: 0, active: 0, due: 0, closed: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DecisionPlanDetail | null>(null);
  const [prefill, setPrefill] = useState<DecisionPlanPrefill | null>(null);

  const loadSummary = useCallback(async () => {
    const [all, activeFirst, closed] = await Promise.all([
      decisionPlanApi.list({ page: 0, size: 1 }),
      decisionPlanApi.list({ status: "ACTIVE", page: 0, size: 100 }),
      decisionPlanApi.list({ status: "CLOSED", page: 0, size: 1 }),
    ]);
    let activeItems = activeFirst.content;
    for (let current = 1; current < activeFirst.totalPages; current += 1) {
      const next = await decisionPlanApi.list({ status: "ACTIVE", page: current, size: 100 });
      activeItems = activeItems.concat(next.content);
    }
    setSummary({
      total: all.totalElements,
      active: activeFirst.totalElements,
      due: activeItems.filter((item) => item.isDueReview).length,
      closed: closed.totalElements,
    });
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const [plans] = await Promise.all([
        decisionPlanApi.list({
          status: status || undefined, action: action || undefined,
          stockCode: stockCode || undefined, page, size: 20,
        }),
        loadSummary(),
      ]);
      setData(plans);
      const noteEntries = await Promise.all(plans.content
        .filter((item) => !planNote(item))
        .map(async (item) => {
          try {
            const detail = await decisionPlanApi.get(item.id);
            return [item.id, planNote(detail)] as const;
          } catch {
            return [item.id, ""] as const;
          }
        }));
      setDetailNotesById((current) => ({
        ...current,
        ...Object.fromEntries(noteEntries.filter(([, note]) => Boolean(note))),
      }));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [action, loadSummary, page, status, stockCode]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const queryKey = searchParams.toString();
    if (!queryKey || handledIntegrationQuery.current === queryKey) return;
    const stockCodeParam = searchParams.get("stockCode")?.trim().toUpperCase();
    if (!stockCodeParam) return;
    handledIntegrationQuery.current = queryKey;
    setSearchInput(stockCodeParam); setStockCode(stockCodeParam); setPage(0);

    if (searchParams.get("create") === "1") {
      setEditing(null);
      setPrefill(readPrefill(searchParams, stockCodeParam));
      setDialogOpen(true);
      return;
    }
    if (searchParams.get("open") === "1") {
      void decisionPlanApi.getActiveByStock(stockCodeParam).then((activePlan) => {
        if (activePlan) {
          setEditing(activePlan); setPrefill(null); setDialogOpen(true);
          setToast("Mã này đã có kế hoạch ACTIVE");
        } else {
          setPrefill({ stockCode: stockCodeParam, action: "WATCH", status: "ACTIVE", reviewDate: dateAfterDays(30) });
          setDialogOpen(true);
        }
      }).catch((err) => setError(apiErrorMessage(err)));
    }
  }, [searchParams]);

  const clearIntegrationQuery = () => {
    if (searchParams.toString()) navigate("/decision-plans", { replace: true });
  };
  const openCreate = () => { setEditing(null); setPrefill(null); setDialogOpen(true); };
  const openEdit = async (item: DecisionPlanListItem) => {
    try { setError(""); setEditing(await decisionPlanApi.get(item.id)); setDialogOpen(true); }
    catch (err) { setError(apiErrorMessage(err)); }
  };
  const closePlan = async (item: DecisionPlanListItem) => {
    try { await decisionPlanApi.close(item.id); setToast(`Đã đóng kế hoạch ${item.stockCode}.`); await load(); }
    catch (err) { console.error("Close decision plan failed", err); setError(apiErrorMessage(err)); }
  };
  const activatePlan = async (item: DecisionPlanListItem) => {
    try { await decisionPlanApi.activate(item.id); setToast(`Đã kích hoạt kế hoạch ${item.stockCode}.`); await load(); }
    catch (err) { console.error("Activate decision plan failed", err); setError(apiErrorMessage(err)); }
  };

  return <Box sx={{ textAlign: "left" }}>
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", mb: 3 }}>
      <Box><Typography variant="h4" gutterBottom>Kế hoạch đầu tư</Typography>
        <Typography color="text.secondary">Lưu kế hoạch hành động, vùng giá, tỷ trọng và thời điểm review cho từng mã.</Typography></Box>
      <Button variant="contained" onClick={openCreate}>Tạo kế hoạch</Button>
    </Stack>
    {loading && <LinearProgress sx={{ mb: 2 }} />}
    {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 2, mb: 3 }}>
      <Metric label="Tổng kế hoạch" value={summary.total} />
      <Metric label="Đang hoạt động" value={summary.active} />
      <Metric label="Cần review" value={summary.due} />
      <Metric label="Đã đóng" value={summary.closed} />
    </Box>
    <Card><CardContent>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2, alignItems: { md: "center" } }}>
        <FormControl sx={{ minWidth: 190 }}><InputLabel htmlFor="plan-filter-status">Trạng thái</InputLabel>
          <NativeSelect id="plan-filter-status" value={status} onChange={(e) => { setStatus(e.target.value as DecisionPlanStatus | ""); setPage(0); }}>
            <option value="">Tất cả</option>{statuses.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}
          </NativeSelect></FormControl>
        <FormControl sx={{ minWidth: 190 }}><InputLabel htmlFor="plan-filter-action">Hành động</InputLabel>
          <NativeSelect id="plan-filter-action" value={action} onChange={(e) => { setAction(e.target.value as DecisionPlanAction | ""); setPage(0); }}>
            <option value="">Tất cả</option>{actions.map((value) => <option key={value} value={value}>{actionLabels[value]}</option>)}
          </NativeSelect></FormControl>
        <TextField label="Tìm mã" value={searchInput} onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === "Enter") { setStockCode(searchInput.trim()); setPage(0); } }} />
        <Button variant="outlined" onClick={() => { setStockCode(searchInput.trim()); setPage(0); }}>Tìm kiếm</Button>
        <Typography color="text.secondary" sx={{ ml: { md: "auto" } }}>{data?.totalElements ?? 0} kế hoạch</Typography>
      </Stack>
      <TableContainer><Table size="small" sx={{ minWidth: 1250 }}><TableHead><TableRow>
        <TableCell>Mã</TableCell><TableCell>Tên công ty</TableCell><TableCell>Hành động</TableCell><TableCell>Trạng thái</TableCell>
        <TableCell align="right">Giá mua mục tiêu</TableCell><TableCell align="right">Fair value</TableCell>
        <TableCell align="right">Tỷ trọng tối đa</TableCell><TableCell>Ngày review</TableCell><TableCell>Ghi chú</TableCell><TableCell>Cần review</TableCell><TableCell>Hành động</TableCell>
      </TableRow></TableHead><TableBody>
        {data?.content.map((item) => {
          const note = planNote(item) || detailNotesById[item.id] || "";
          const testPlan = isTestPlan(item) || isTestNote(note);
          return <TableRow key={item.id} hover>
          <TableCell>
            <Stack spacing={0.5}>
              <strong>{item.stockCode}</strong>
              <Typography variant="caption" color="text.secondary">#{item.id}</Typography>
            </Stack>
          </TableCell><TableCell>{item.companyName}</TableCell>
          <TableCell><Chip size="small" label={actionLabels[item.action]} color={actionColor(item.action)} /></TableCell>
          <TableCell>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Chip size="small" label={statusLabels[item.status]} color={statusColor(item.status)} variant={item.status === "CLOSED" ? "outlined" : "filled"} />
              {testPlan && <Chip size="small" label="TEST" color="warning" variant="outlined" />}
            </Stack>
          </TableCell>
          <TableCell align="right">{formatNumber(item.targetBuyPrice)}</TableCell><TableCell align="right">{formatNumber(item.fairValue)}</TableCell>
          <TableCell align="right">{item.maxPositionPercent == null ? "-" : `${formatNumber(item.maxPositionPercent)}%`}</TableCell>
          <TableCell>{item.reviewDate || "-"}</TableCell>
          <TableCell sx={{ maxWidth: 260 }}>
            {note ? (
              <Tooltip title={note}>
                <Typography variant="body2" noWrap color={testPlan ? "warning.main" : "text.secondary"}>
                  {note}
                </Typography>
              </Tooltip>
            ) : "-"}
          </TableCell>
          <TableCell>{item.isDueReview ? <Chip size="small" color="warning" label="Cần review" /> : "-"}</TableCell>
          <TableCell><Stack direction="row" spacing={1}>
            <Button size="small" onClick={() => void openEdit(item)}>Xem / sửa</Button>
            {item.status === "ACTIVE" && <Button size="small" color="error" onClick={() => void closePlan(item)}>Đóng kế hoạch</Button>}
            {item.status !== "ACTIVE" && <Button size="small" color="success" onClick={() => void activatePlan(item)}>Kích hoạt lại</Button>}
          </Stack></TableCell>
        </TableRow>;
        })}
        {!loading && !data?.content.length && <TableRow><TableCell colSpan={11}>Không có kế hoạch phù hợp.</TableCell></TableRow>}
      </TableBody></Table></TableContainer>
      <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", alignItems: "center", mt: 2 }}>
        <Button disabled={!data || page === 0 || loading} onClick={() => setPage((value) => value - 1)}>Trang trước</Button>
        <Typography>Trang {data ? data.number + 1 : 1}/{Math.max(data?.totalPages ?? 1, 1)}</Typography>
        <Button disabled={!data || page + 1 >= data.totalPages || loading} onClick={() => setPage((value) => value + 1)}>Trang sau</Button>
      </Stack>
    </CardContent></Card>
    <PlanDialog open={dialogOpen} plan={editing} prefill={prefill} onClose={() => { setDialogOpen(false); clearIntegrationQuery(); }} onSaved={async (message) => {
      setDialogOpen(false); setToast(message); clearIntegrationQuery(); await load();
    }} />
    <Snackbar open={Boolean(toast)} autoHideDuration={6000} onClose={() => setToast("")}>
      <Alert severity="success" onClose={() => setToast("")}>{toast}</Alert>
    </Snackbar>
  </Box>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <Card><CardContent><Typography color="text.secondary" variant="body2">{label}</Typography>
    <Typography variant="h4">{value.toLocaleString("vi-VN")}</Typography></CardContent></Card>;
}

type FormState = {
  stockCode: string; action: DecisionPlanAction; status: DecisionPlanStatus;
  targetBuyPrice: string; fairValue: string; targetSellPrice: string;
  maxPositionPercent: string; currentPositionPercent: string; reviewDate: string;
  buyConditions: string; sellConditions: string; riskNotes: string; personalNotes: string;
};

const emptyForm: FormState = {
  stockCode: "", action: "WATCH", status: "DRAFT", targetBuyPrice: "", fairValue: "", targetSellPrice: "",
  maxPositionPercent: "", currentPositionPercent: "0", reviewDate: "", buyConditions: "", sellConditions: "",
  riskNotes: "", personalNotes: "",
};

function PlanDialog({ open, plan, prefill, onClose, onSaved }: {
  open: boolean; plan: DecisionPlanDetail | null; prefill: DecisionPlanPrefill | null;
  onClose: () => void; onSaved: (message: string) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(plan ? {
      stockCode: plan.stockCode, action: plan.action, status: plan.status,
      targetBuyPrice: valueString(plan.targetBuyPrice), fairValue: valueString(plan.fairValue),
      targetSellPrice: valueString(plan.targetSellPrice), maxPositionPercent: valueString(plan.maxPositionPercent),
      currentPositionPercent: valueString(plan.currentPositionPercent), reviewDate: plan.reviewDate ?? "",
      buyConditions: (plan.buyConditions ?? []).join("\n"), sellConditions: (plan.sellConditions ?? []).join("\n"),
      riskNotes: (plan.riskNotes ?? []).join("\n"), personalNotes: plan.personalNotes ?? "",
    } : prefill ? {
      ...emptyForm, stockCode: prefill.stockCode, action: prefill.action ?? "WATCH", status: prefill.status ?? "ACTIVE",
      reviewDate: prefill.reviewDate ?? dateAfterDays(30), maxPositionPercent: valueString(prefill.maxPositionPercent),
      buyConditions: (prefill.buyConditions ?? []).join("\n"), sellConditions: (prefill.sellConditions ?? []).join("\n"),
      riskNotes: (prefill.riskNotes ?? []).join("\n"), personalNotes: prefill.personalNotes ?? "",
    } : emptyForm);
  }, [open, plan, prefill]);

  const field = (name: keyof FormState) => ({
    value: form[name], onChange: (event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [name]: event.target.value })),
  });
  const save = async () => {
    try {
      setSaving(true); setError("");
      if (!form.stockCode.trim()) { setError("Mã cổ phiếu là bắt buộc."); return; }
      const payload: DecisionPlanPayload = {
        stockCode: form.stockCode.trim().toUpperCase(), linkedThesisId: prefill?.linkedThesisId,
        linkedWatchlistId: prefill?.linkedWatchlistId, action: form.action, status: form.status,
        targetBuyPrice: optionalNumber(form.targetBuyPrice), fairValue: optionalNumber(form.fairValue),
        targetSellPrice: optionalNumber(form.targetSellPrice), maxPositionPercent: optionalNumber(form.maxPositionPercent),
        currentPositionPercent: optionalNumber(form.currentPositionPercent), reviewDate: form.reviewDate || undefined,
        buyConditions: lines(form.buyConditions), sellConditions: lines(form.sellConditions), riskNotes: lines(form.riskNotes),
        personalNotes: form.personalNotes.trim() || undefined,
      };
      if (plan) {
        await decisionPlanApi.update(plan.id, payload);
        await onSaved(`Đã cập nhật kế hoạch ${plan.stockCode}.`);
      } else {
        const created = await decisionPlanApi.create(payload);
        await onSaved(`Đã tạo kế hoạch đầu tư cho ${created.stockCode}`);
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
    <DialogTitle>{plan ? `Kế hoạch ${plan.stockCode}` : "Tạo kế hoạch đầu tư"}</DialogTitle>
    <DialogContent><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mt: 1 }}>
      {error && <Alert severity="error" sx={{ gridColumn: "1 / -1" }}>{error}</Alert>}
      <TextField label="Mã cổ phiếu" {...field("stockCode")} disabled={Boolean(plan)} required />
      <FormControl><InputLabel htmlFor="plan-form-action">Hành động</InputLabel><NativeSelect id="plan-form-action" value={form.action}
        onChange={(e) => setForm((current) => ({ ...current, action: e.target.value as DecisionPlanAction }))}>
        {actions.map((value) => <option key={value} value={value}>{actionLabels[value]}</option>)}</NativeSelect></FormControl>
      <FormControl><InputLabel htmlFor="plan-form-status">Trạng thái</InputLabel><NativeSelect id="plan-form-status" value={form.status}
        onChange={(e) => setForm((current) => ({ ...current, status: e.target.value as DecisionPlanStatus }))}>
        {statuses.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}</NativeSelect></FormControl>
      <TextField label="Ngày review" type="date" {...field("reviewDate")} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField label="Giá mua mục tiêu" type="number" {...field("targetBuyPrice")} />
      <TextField label="Fair value" type="number" {...field("fairValue")} />
      <TextField label="Giá bán mục tiêu" type="number" {...field("targetSellPrice")} />
      <TextField label="Tỷ trọng tối đa (%)" type="number" {...field("maxPositionPercent")} />
      <TextField label="Tỷ trọng hiện tại (%)" type="number" {...field("currentPositionPercent")} />
      <Box />
      <TextField label="Điều kiện mua (mỗi dòng một điều kiện)" multiline minRows={3} {...field("buyConditions")} />
      <TextField label="Điều kiện bán (mỗi dòng một điều kiện)" multiline minRows={3} {...field("sellConditions")} />
      <TextField label="Ghi chú rủi ro (mỗi dòng một ý)" multiline minRows={3} {...field("riskNotes")} />
      <TextField label="Ghi chú cá nhân" multiline minRows={3} {...field("personalNotes")} />
    </Box></DialogContent>
    <DialogActions><Button onClick={onClose} disabled={saving}>Hủy</Button>
      <Button variant="contained" onClick={() => void save()} disabled={saving}>{saving ? <CircularProgress size={22} /> : "Lưu kế hoạch"}</Button>
    </DialogActions>
  </Dialog>;
}

function apiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 409) return "Mã này đã có kế hoạch ACTIVE. Hãy mở kế hoạch hiện tại để chỉnh sửa.";
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
    if (error.response?.status === 404) return "Không tìm thấy dữ liệu yêu cầu.";
    if (error.response?.status === 400) return "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại các trường.";
  }
  return "Không thể xử lý yêu cầu. Vui lòng thử lại.";
}

function lines(value: string) { return value.split("\n").map((item) => item.trim()).filter(Boolean); }
function optionalNumber(value: string) { return value.trim() === "" ? undefined : Number(value); }
function valueString(value?: number) { return value == null ? "" : String(value); }
function dateAfterDays(days: number) { const value = new Date(); value.setDate(value.getDate() + days); return value.toISOString().slice(0, 10); }
function readPrefill(params: URLSearchParams, stockCode: string): DecisionPlanPrefill {
  return {
    stockCode, linkedThesisId: optionalQueryNumber(params.get("thesisId")),
    linkedWatchlistId: optionalQueryNumber(params.get("watchlistId")),
    action: enumValue(params.get("action"), actions) ?? "WATCH",
    status: enumValue(params.get("status"), statuses) ?? "ACTIVE",
    reviewDate: params.get("reviewDate") ?? dateAfterDays(30),
    maxPositionPercent: optionalQueryNumber(params.get("maxPositionPercent")),
    buyConditions: queryList(params.get("buyConditions")), sellConditions: queryList(params.get("sellConditions")),
    riskNotes: queryList(params.get("riskNotes")), personalNotes: params.get("personalNotes") ?? undefined,
  };
}
function optionalQueryNumber(value: string | null) { if (!value) return undefined; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : undefined; }
function enumValue<T extends string>(value: string | null, allowed: readonly T[]) { return value && allowed.includes(value as T) ? value as T : undefined; }
function queryList(value: string | null) { if (!value) return undefined; try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : undefined; } catch { return undefined; } }
function formatNumber(value?: number) { return value == null ? "-" : value.toLocaleString("vi-VN"); }
function planNote(plan: DecisionPlanListItem | DecisionPlanDetail) {
  return plan.personalNotes || plan.sourceNote || plan.notes || plan.title || "";
}
function isTestNote(note?: string) {
  return Boolean(note?.toUpperCase().includes("TEST_DO_NOT_USE"));
}
function isTestPlan(plan: DecisionPlanListItem | DecisionPlanDetail) {
  return [plan.personalNotes, plan.sourceNote, plan.notes, plan.title]
    .some(isTestNote);
}
function actionColor(action: DecisionPlanAction): "default" | "primary" | "success" | "warning" | "error" {
  if (action === "BUY") return "success"; if (action === "SELL" || action === "AVOID") return "error";
  if (action === "WATCH" || action === "TRIM") return "warning"; if (action === "HOLD") return "primary"; return "default";
}
function statusColor(status: DecisionPlanStatus): "default" | "success" | "warning" {
  if (status === "ACTIVE") return "success"; if (status === "DRAFT") return "warning"; return "default";
}
