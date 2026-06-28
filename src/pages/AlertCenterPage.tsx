import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  AddOutlined,
  DeleteOutlined,
  NotificationsActiveOutlined,
  PlayArrowOutlined,
  RefreshOutlined,
  SearchOutlined,
  TrendingDownOutlined,
  TrendingUpOutlined,
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

function fmt(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

function timeFmt(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function apiErr(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

const notificationTypeColor: Record<string, "info" | "warning" | "success" | "error" | "default"> = {
  SCORE_CHANGE: "warning",
  WATCHLIST_ALERT: "info",
  OPPORTUNITY_SIGNAL: "success",
};

function NotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setNotifications(await notificationApi.getRecent(100));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const eventSource = notificationApi.subscribe();
    eventSourceRef.current = eventSource;

    const pushNotification = (event: MessageEvent) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        setNotifications((current) => [notification, ...current].slice(0, 200));
      } catch {
        // Ignore malformed SSE payloads.
      }
    };

    eventSource.onopen = () => setSseConnected(true);
    eventSource.onerror = () => setSseConnected(false);
    eventSource.onmessage = pushNotification;
    for (const type of ["SCORE_CHANGE", "WATCHLIST_ALERT", "OPPORTUNITY_SIGNAL"]) {
      eventSource.addEventListener(type, pushNotification as EventListener);
    }

    return () => {
      window.clearTimeout(timer);
      eventSource.close();
    };
  }, [load]);

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center" }}>
        <Chip
          size="small"
          label={sseConnected ? "SSE kết nối" : "SSE ngắt"}
          color={sseConnected ? "success" : "default"}
          variant="outlined"
        />
        <Box sx={{ flex: 1 }} />
        <Button size="small" startIcon={<RefreshOutlined />} onClick={load}>
          Tải lại
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 1 }} />}
      {notifications.length === 0 && !loading && (
        <Alert severity="info">
          Chưa có thông báo nào. Thông báo sẽ xuất hiện realtime khi hệ thống phát hiện tín hiệu.
        </Alert>
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
            {notifications.map((notification, index) => (
              <TableRow key={`${notification.timestamp}-${index}`} hover>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{timeFmt(notification.timestamp)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={notification.type}
                    color={notificationTypeColor[notification.type] ?? "default"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{notification.title}</TableCell>
                <TableCell>
                  {notification.stockCode ? <Chip size="small" label={notification.stockCode} /> : "—"}
                </TableCell>
                <TableCell align="right">{fmt(notification.score)}</TableCell>
                <TableCell sx={{ maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <Tooltip title={notification.message}>
                    <span>{notification.message}</span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

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
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setActionLoading("add");
    try {
      await notificationApi.addRule({
        name: newName.trim(),
        minScore: Number.parseFloat(newMinScore) || null,
      });
      setNewName("");
      await load();
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setActionLoading("");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.removeRule(id);
      await load();
    } catch (err) {
      setError(apiErr(err));
    }
  };

  const runEvaluate = async () => {
    setActionLoading("evaluate");
    try {
      setResults(await notificationApi.evaluate());
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setActionLoading("");
    }
  };

  const runScan = async () => {
    setActionLoading("scan");
    try {
      setResults(await notificationApi.scan());
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setActionLoading("");
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Thêm quy tắc cảnh báo
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <TextField size="small" label="Tên quy tắc" value={newName} onChange={(e) => setNewName(e.target.value)} sx={{ width: 240 }} />
            <TextField size="small" label="Score tối thiểu" type="number" value={newMinScore} onChange={(e) => setNewMinScore(e.target.value)} sx={{ width: 150 }} />
            <Button variant="contained" size="small" startIcon={<AddOutlined />} onClick={handleAdd} disabled={actionLoading === "add" || !newName.trim()}>
              Thêm
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button size="small" variant="outlined" startIcon={<PlayArrowOutlined />} onClick={runEvaluate} disabled={actionLoading === "evaluate"}>
          Đánh giá rules
        </Button>
        <Button size="small" variant="outlined" startIcon={<SearchOutlined />} onClick={runScan} disabled={actionLoading === "scan"}>
          Quét cơ hội
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 1 }} />}

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Danh sách quy tắc ({rules.length})
      </Typography>
      {rules.length === 0 && !loading ? (
        <Alert severity="info" sx={{ mb: 3 }}>Chưa có quy tắc cảnh báo nào.</Alert>
      ) : (
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tên</TableCell>
                <TableCell align="right">Min score</TableCell>
                <TableCell>Ngành</TableCell>
                <TableCell>Sector inflow</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{rule.name}</TableCell>
                  <TableCell align="right">{fmt(rule.minScore)}</TableCell>
                  <TableCell>{rule.industryGroups?.join(", ") || "Tất cả"}</TableCell>
                  <TableCell>{rule.requireSectorInflow ? "Có" : "Không"}</TableCell>
                  <TableCell>
                    <Chip size="small" label={rule.active ? "Hoạt động" : "Tắt"} color={rule.active ? "success" : "default"} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleDelete(rule.id)}>
                      <DeleteOutlined fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {results.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Kết quả ({results.length} cảnh báo)
          </Typography>
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
                {results.map((result, index) => (
                  <TableRow key={`${result.stockCode}-${index}`} hover>
                    <TableCell>{result.ruleName}</TableCell>
                    <TableCell><Chip size="small" label={result.stockCode} /></TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(result.score)}</TableCell>
                    <TableCell>{result.decision}</TableCell>
                    <TableCell sx={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <Tooltip title={result.message}><span>{result.message}</span></Tooltip>
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
      setTimeline(await notificationApi.getScoreHistory(stockCode.trim().toUpperCase(), Number.parseInt(days, 10) || 90));
    } catch (err) {
      setError(apiErr(err));
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
    const item = map[trend] ?? { color: "default" as const, label: trend };
    return <Chip size="small" label={item.label} color={item.color} />;
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ mb: 3, alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          size="small"
          label="Mã cổ phiếu"
          value={stockCode}
          onChange={(e) => setStockCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && void search()}
          sx={{ width: 160 }}
        />
        <TextField size="small" label="Số ngày" type="number" value={days} onChange={(e) => setDays(e.target.value)} sx={{ width: 110 }} />
        <Button variant="contained" size="small" startIcon={<SearchOutlined />} onClick={search} disabled={loading || !stockCode.trim()}>
          Tra cứu
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LinearProgress sx={{ mb: 1 }} />}

      {timeline && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2, flexWrap: "wrap" }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{timeline.stockCode}</Typography>
              {trendChip(timeline.trend)}
              {timeline.latestScore != null && (
                <Typography variant="body1" sx={{ fontWeight: 600 }}>Score hiện tại: {fmt(timeline.latestScore)}</Typography>
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
                      <TableCell align="right">Final score</TableCell>
                      <TableCell align="right">Quality</TableCell>
                      <TableCell align="right">Growth</TableCell>
                      <TableCell align="right">Valuation</TableCell>
                      <TableCell>Decision</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {timeline.dataPoints.map((point) => (
                      <TableRow key={point.date} hover>
                        <TableCell>{point.date}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(point.finalScore)}</TableCell>
                        <TableCell align="right">{fmt(point.qualityScore)}</TableCell>
                        <TableCell align="right">{fmt(point.growthScore)}</TableCell>
                        <TableCell align="right">{fmt(point.valuationScore)}</TableCell>
                        <TableCell>{point.decision}</TableCell>
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
              {movements.map((movement) => (
                <TableRow key={movement.stockCode} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{movement.stockCode}</TableCell>
                  <TableCell align="right">{fmt(movement.previousScore)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(movement.currentScore)}</TableCell>
                  <TableCell align="right">
                    <Chip
                      size="small"
                      icon={movement.direction === "UP" ? <TrendingUpOutlined /> : <TrendingDownOutlined />}
                      label={`${movement.scoreChange >= 0 ? "+" : ""}${fmt(movement.scoreChange)}`}
                      color={movement.direction === "UP" ? "success" : "error"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{movement.previousDecision}</TableCell>
                  <TableCell>{movement.currentDecision}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

function WeightOptimizerTab() {
  const [report, setReport] = useState<OptimizationReport | null>(null);
  const [forwardMonths, setForwardMonths] = useState("3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      setReport(await notificationApi.optimizeWeights(Number.parseInt(forwardMonths, 10) || 3));
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ mb: 3, alignItems: "center" }}>
        <TextField size="small" label="Forward months" type="number" value={forwardMonths} onChange={(e) => setForwardMonths(e.target.value)} sx={{ width: 150 }} />
        <Button variant="contained" size="small" startIcon={<TuneOutlined />} onClick={run} disabled={loading}>
          Chạy tối ưu
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LinearProgress sx={{ mb: 1 }} />}

      {report && (
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2, flexWrap: "wrap" }}>
              <Chip label={report.status} color={report.status === "COMPLETED" ? "success" : "warning"} />
              <Typography variant="body2">Mẫu: {report.sampleCount}</Typography>
              {report.forwardMonths != null && <Typography variant="body2">Forward: {report.forwardMonths} tháng</Typography>}
            </Stack>

            <Alert severity={report.shouldApply ? "success" : "info"} sx={{ mb: 2 }}>{report.message}</Alert>

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
                    {Object.keys(report.currentWeights ?? {}).map((key) => {
                      const current = report.currentWeights[key];
                      const suggested = report.suggestedWeights?.[key];
                      const diff = suggested != null ? suggested - current : null;
                      return (
                        <TableRow key={key} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{key}</TableCell>
                          <TableCell align="right">{(current * 100).toFixed(0)}%</TableCell>
                          <TableCell align="right">{suggested != null ? `${(suggested * 100).toFixed(0)}%` : "—"}</TableCell>
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

            {report.currentCorrelation != null && (
              <Stack direction="row" spacing={3} sx={{ mb: 2, flexWrap: "wrap" }}>
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
                {report.insights.map((insight, index) => (
                  <Typography key={index} variant="body2" sx={{ ml: 1 }}>• {insight}</Typography>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default function AlertCenterPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3, flexWrap: "wrap" }}>
        <NotificationsActiveOutlined color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Trung tâm cảnh báo</Typography>
        <Chip size="small" label="Tín hiệu mô phỏng — Không phải khuyến nghị đầu tư" color="warning" variant="outlined" />
      </Stack>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3 }}>
        <Tab label="Thông báo realtime" />
        <Tab label="Watchlist & cảnh báo" />
        <Tab label="Lịch sử score" />
        <Tab label="Tối ưu weights" />
      </Tabs>

      {tab === 0 && <NotificationsTab />}
      {tab === 1 && <WatchlistTab />}
      {tab === 2 && <ScoreHistoryTab />}
      {tab === 3 && <WeightOptimizerTab />}
    </Box>
  );
}
