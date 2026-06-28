import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  NotificationsActiveOutlined,
  DeleteOutlined,
  RefreshOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  SearchOutlined,
  PlayArrowOutlined,
  AddOutlined,
  TuneOutlined,
} from "@mui/icons-material";
import { notificationApi } from "../api/notificationApi";
import type {
  AlertResult,
  AlertRule,
  Notification,
  OptimizationReport,
  ScoreMovement,
  ScoreTimeline,
} from "../types/notifications";

function fmt(v: number | null | undefined, d = 2): string {
  if (v == null) return "—";
  return v.toFixed(d);
}

function timeFmt(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
}

function apiErr(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

const typeColor: Record<string, "info" | "warning" | "success" | "error" | "default"> = {
  SCORE_CHANGE: "warning",
  WATCHLIST_ALERT: "info",
  OPPORTUNITY_SIGNAL: "success",
};

// ─── Notifications Tab ───

function NotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setNotifications(await notificationApi.getRecent(100));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const es = notificationApi.subscribe();
    esRef.current = es;
    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);
    es.onmessage = (e) => {
      try {
        const n: Notification = JSON.parse(e.data);
        setNotifications((prev) => [n, ...prev].slice(0, 200));
      } catch { /* ignore */ }
    };
    for (const t of ["SCORE_CHANGE", "WATCHLIST_ALERT", "OPPORTUNITY_SIGNAL"]) {
      es.addEventListener(t, (e: Event) => {
        try {
          const me = e as MessageEvent;
          const n: Notification = JSON.parse(me.data);
          setNotifications((prev) => [n, ...prev].slice(0, 200));
        } catch { /* ignore */ }
      });
    }
    return () => es.close();
  }, [load]);

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center" }}>
        <Chip
          size="small"
          label={sseConnected ? "SSE Kết nối" : "SSE Ngắt"}
          color={sseConnected ? "success" : "default"}
          variant="outlined"
        />
        <Box sx={{ flex: 1 }} />
        <Button size="small" startIcon={<RefreshOutlined />} onClick={load}>Tải lại</Button>
      </Stack>
      {loading && <LinearProgress sx={{ mb: 1 }} />}
      {notifications.length === 0 && !loading && (
        <Alert severity="info">Chưa có thông báo nào. Thông báo sẽ xuất hiện realtime khi hệ thống phát hiện tín hiệu.</Alert>
      )}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Thời gian</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Tiêu đề</TableCell>
              <TableCell>Mã</TableCell>
              <TableCell align="right">Score</TableCell>
              <TableCell>Nội dung</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notifications.map((n, i) => (
              <TableRow key={`${n.timestamp}-${i}`} hover>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{timeFmt(n.timestamp)}</TableCell>
                <TableCell>
                  <Chip size="small" label={n.type} color={typeColor[n.type] ?? "default"} variant="outlined" />
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{n.title}</TableCell>
                <TableCell>
                  {n.stockCode && <Chip size="small" label={n.stockCode} variant="filled" />}
                </TableCell>
                <TableCell align="right">{fmt(n.score)}</TableCell>
                <TableCell sx={{ maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <Tooltip title={n.message}><span>{n.message}</span></Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ─── Watchlist Alerts Tab ───

function WatchlistTab() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [results, setResults] = useState<AlertResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [newName, setNewName] = useState("");
  const [newMinScore, setNewMinScore] = useState("7");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRules(await notificationApi.listRules());
    } catch (e) {
      setError(apiErr(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setActionLoading("add");
    try {
      await notificationApi.addRule({
        name: newName.trim(),
        minScore: parseFloat(newMinScore) || null,
      });
      setNewName("");
      await load();
    } catch (e) {
      setError(apiErr(e));
    } finally {
      setActionLoading("");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.removeRule(id);
      await load();
    } catch (e) {
      setError(apiErr(e));
    }
  };

  const handleEvaluate = async () => {
    setActionLoading("eval");
    try {
      setResults(await notificationApi.evaluate());
    } catch (e) {
      setError(apiErr(e));
    } finally {
      setActionLoading("");
    }
  };

  const handleScan = async () => {
    setActionLoading("scan");
    try {
      setResults(await notificationApi.scan());
    } catch (e) {
      setError(apiErr(e));
    } finally {
      setActionLoading("");
    }
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Thêm quy tắc cảnh báo</Typography>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <TextField size="small" label="Tên quy tắc" value={newName} onChange={(e) => setNewName(e.target.value)} sx={{ width: 240 }} />
            <TextField size="small" label="Score tối thiểu" type="number" value={newMinScore} onChange={(e) => setNewMinScore(e.target.value)} sx={{ width: 140 }} />
            <Button
              variant="contained"
              size="small"
              startIcon={<AddOutlined />}
              onClick={handleAdd}
              disabled={actionLoading === "add" || !newName.trim()}
            >
              Thêm
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button size="small" variant="outlined" startIcon={<PlayArrowOutlined />} onClick={handleEvaluate}
                disabled={actionLoading === "eval"}>
          Đánh giá rules
        </Button>
        <Button size="small" variant="outlined" startIcon={<SearchOutlined />} onClick={handleScan}
                disabled={actionLoading === "scan"}>
          Quét cơ hội
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 1 }} />}

      {rules.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Danh sách quy tắc ({rules.length})</Typography>
          <TableContainer sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tên</TableCell>
                  <TableCell align="right">Min Score</TableCell>
                  <TableCell>Ngành</TableCell>
                  <TableCell>Sector Inflow</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                    <TableCell align="right">{fmt(r.minScore)}</TableCell>
                    <TableCell>{r.industryGroups?.join(", ") || "Tất cả"}</TableCell>
                    <TableCell>{r.requireSectorInflow ? "Có" : "Không"}</TableCell>
                    <TableCell><Chip size="small" label={r.active ? "Hoạt động" : "Tắt"} color={r.active ? "success" : "default"} /></TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleDelete(r.id)}><DeleteOutlined fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {results.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Kết quả ({results.length} cảnh báo)</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rule</TableCell>
                  <TableCell>Mã</TableCell>
                  <TableCell align="right">Score</TableCell>
                  <TableCell>Decision</TableCell>
                  <TableCell>Nội dung</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={`${r.stockCode}-${i}`} hover>
                    <TableCell>{r.ruleName}</TableCell>
                    <TableCell><Chip size="small" label={r.stockCode} /></TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(r.score)}</TableCell>
                    <TableCell>{r.decision}</TableCell>
                    <TableCell sx={{ maxWidth: 350, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <Tooltip title={r.message}><span>{r.message}</span></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}

// ─── Score History Tab ───

function ScoreHistoryTab() {
  const [stockCode, setStockCode] = useState("");
  const [days, setDays] = useState("90");
  const [timeline, setTimeline] = useState<ScoreTimeline | null>(null);
  const [movements, setMovements] = useState<ScoreMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    notificationApi.getMovements(0.5).then(setMovements).catch(() => {});
  }, []);

  const search = async () => {
    if (!stockCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      setTimeline(await notificationApi.getScoreHistory(stockCode.trim().toUpperCase(), parseInt(days) || 90));
    } catch (e) {
      setError(apiErr(e));
    } finally {
      setLoading(false);
    }
  };

  const trendChip = (trend: string) => {
    const map: Record<string, { color: "success" | "error" | "warning" | "default"; label: string }> = {
      IMPROVING: { color: "success", label: "Tăng" },
      DECLINING: { color: "error", label: "Giảm" },
      STABLE: { color: "default", label: "Ổn định" },
      INSUFFICIENT_DATA: { color: "warning", label: "Chưa đủ dữ liệu" },
    };
    const m = map[trend] ?? { color: "default" as const, label: trend };
    return <Chip size="small" label={m.label} color={m.color} />;
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ mb: 3, alignItems: "center" }}>
        <TextField size="small" label="Mã cổ phiếu" value={stockCode}
                   onChange={(e) => setStockCode(e.target.value.toUpperCase())}
                   onKeyDown={(e) => e.key === "Enter" && search()}
                   sx={{ width: 160 }} />
        <TextField size="small" label="Số ngày" type="number" value={days}
                   onChange={(e) => setDays(e.target.value)} sx={{ width: 100 }} />
        <Button variant="contained" size="small" startIcon={<SearchOutlined />} onClick={search}
                disabled={loading || !stockCode.trim()}>
          Tra cứu
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LinearProgress sx={{ mb: 1 }} />}

      {timeline && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{timeline.stockCode}</Typography>
              {trendChip(timeline.trend)}
              {timeline.latestScore != null && (
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Score hiện tại: {fmt(timeline.latestScore)}
                </Typography>
              )}
              {timeline.scoreChange != null && (
                <Chip
                  size="small"
                  icon={timeline.scoreChange >= 0 ? <TrendingUpOutlined /> : <TrendingDownOutlined />}
                  label={`${timeline.scoreChange >= 0 ? "+" : ""}${fmt(timeline.scoreChange)}`}
                  color={timeline.scoreChange >= 0 ? "success" : "error"}
                  variant="outlined"
                />
              )}
            </Stack>
            {timeline.message && <Alert severity="info" sx={{ mb: 2 }}>{timeline.message}</Alert>}
            {timeline.dataPoints.length > 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ngày</TableCell>
                      <TableCell align="right">Final Score</TableCell>
                      <TableCell align="right">Quality</TableCell>
                      <TableCell align="right">Growth</TableCell>
                      <TableCell align="right">Valuation</TableCell>
                      <TableCell>Decision</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {timeline.dataPoints.map((p) => (
                      <TableRow key={p.date} hover>
                        <TableCell>{p.date}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(p.finalScore)}</TableCell>
                        <TableCell align="right">{fmt(p.qualityScore)}</TableCell>
                        <TableCell align="right">{fmt(p.growthScore)}</TableCell>
                        <TableCell align="right">{fmt(p.valuationScore)}</TableCell>
                        <TableCell>{p.decision}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Biến động score gần đây (≥ 0.5)</Typography>
      {movements.length === 0 ? (
        <Alert severity="info">Chưa có biến động đáng kể giữa các snapshot.</Alert>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Mã</TableCell>
                <TableCell align="right">Score trước</TableCell>
                <TableCell align="right">Score sau</TableCell>
                <TableCell align="right">Thay đổi</TableCell>
                <TableCell>Decision trước</TableCell>
                <TableCell>Decision sau</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movements.map((m) => (
                <TableRow key={m.stockCode} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{m.stockCode}</TableCell>
                  <TableCell align="right">{fmt(m.previousScore)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(m.currentScore)}</TableCell>
                  <TableCell align="right">
                    <Chip
                      size="small"
                      icon={m.direction === "UP" ? <TrendingUpOutlined /> : <TrendingDownOutlined />}
                      label={`${m.scoreChange >= 0 ? "+" : ""}${fmt(m.scoreChange)}`}
                      color={m.direction === "UP" ? "success" : "error"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{m.previousDecision}</TableCell>
                  <TableCell>{m.currentDecision}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

// ─── Weight Optimizer Tab ───

function WeightOptimizerTab() {
  const [report, setReport] = useState<OptimizationReport | null>(null);
  const [forwardMonths, setForwardMonths] = useState("3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      setReport(await notificationApi.optimizeWeights(parseInt(forwardMonths) || 3));
    } catch (e) {
      setError(apiErr(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ mb: 3, alignItems: "center" }}>
        <TextField size="small" label="Forward months" type="number" value={forwardMonths}
                   onChange={(e) => setForwardMonths(e.target.value)} sx={{ width: 140 }} />
        <Button variant="contained" size="small" startIcon={<TuneOutlined />} onClick={run} disabled={loading}>
          Chạy tối ưu
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LinearProgress sx={{ mb: 1 }} />}

      {report && (
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2 }}>
              <Chip label={report.status} color={report.status === "COMPLETED" ? "success" : "warning"} />
              <Typography variant="body2">Mẫu: {report.sampleCount}</Typography>
              {report.forwardMonths != null && (
                <Typography variant="body2">Forward: {report.forwardMonths} tháng</Typography>
              )}
            </Stack>

            <Alert severity={report.shouldApply ? "success" : "info"} sx={{ mb: 2 }}>{report.message}</Alert>

            {report.currentWeights && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Weights hiện tại vs đề xuất</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Thành phần</TableCell>
                        <TableCell align="right">Hiện tại</TableCell>
                        <TableCell align="right">Đề xuất</TableCell>
                        <TableCell align="right">Thay đổi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.keys(report.currentWeights).map((k) => {
                        const cur = report.currentWeights[k];
                        const sug = report.suggestedWeights?.[k];
                        const diff = sug != null ? sug - cur : null;
                        return (
                          <TableRow key={k} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{k}</TableCell>
                            <TableCell align="right">{(cur * 100).toFixed(0)}%</TableCell>
                            <TableCell align="right">{sug != null ? `${(sug * 100).toFixed(0)}%` : "—"}</TableCell>
                            <TableCell align="right">
                              {diff != null && Math.abs(diff) >= 0.01 ? (
                                <Chip
                                  size="small"
                                  label={`${diff >= 0 ? "+" : ""}${(diff * 100).toFixed(0)}%`}
                                  color={Math.abs(diff) >= 0.03 ? "warning" : "default"}
                                  variant="outlined"
                                />
                              ) : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {report.currentCorrelation != null && (
              <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                <Typography variant="body2">Correlation hiện tại: <strong>{fmt(report.currentCorrelation)}</strong></Typography>
                {report.suggestedCorrelation != null && (
                  <Typography variant="body2">Correlation đề xuất: <strong>{fmt(report.suggestedCorrelation)}</strong></Typography>
                )}
                {report.correlationImprovement != null && (
                  <Typography variant="body2">Cải thiện: <strong>{fmt(report.correlationImprovement)}</strong></Typography>
                )}
              </Stack>
            )}

            {report.insights && report.insights.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Insights</Typography>
                {report.insights.map((ins, i) => (
                  <Typography key={i} variant="body2" sx={{ ml: 1 }}>• {ins}</Typography>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

// ─── Main Page ───

export default function AlertCenterPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
        <NotificationsActiveOutlined color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Trung tâm cảnh báo</Typography>
        <Chip size="small" label="Tín hiệu mô phỏng — Không phải khuyến nghị đầu tư" color="warning" variant="outlined" />
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Thông báo realtime" />
        <Tab label="Watchlist & Cảnh báo" />
        <Tab label="Lịch sử Score" />
        <Tab label="Tối ưu Weights" />
      </Tabs>

      {tab === 0 && <NotificationsTab />}
      {tab === 1 && <WatchlistTab />}
      {tab === 2 && <ScoreHistoryTab />}
      {tab === 3 && <WeightOptimizerTab />}
    </Box>
  );
}
