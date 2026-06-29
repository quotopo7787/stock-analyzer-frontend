import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert, Box, Card, CardContent, Chip, CircularProgress, IconButton, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Tooltip, Typography,
} from "@mui/material";
import { Add, Close, FiberManualRecord, Refresh, ShowChart } from "@mui/icons-material";
import mqtt from "mqtt";
import { dnseApi, type DnseChartQuote, type MqttCredentials } from "../api/dnseApi";
import MetricTooltip from "../components/MetricTooltip";

interface StockTick {
  symbol: string;
  lastPrice: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  change: number | null;
  changePct: number | null;
  refPrice: number | null;
  ceiling: number | null;
  floor: number | null;
  totalVolume: number | null;
  totalValue: number | null;
  updatedAt: string;
  prevClose: number | null;
  source?: string | null;
  tradingDate?: string | null;
}

const DEFAULT_SYMBOLS = ["FPT", "VNM", "MWG", "HPG", "VCB", "TCB", "MBB", "VHM", "VIC", "SSI"];

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseStockInfo(symbol: string, raw: Record<string, unknown>): Partial<StockTick> {
  const num = (key: string) => parseNumber(raw[key]);
  const lastPrice = num("lastPrice") ?? num("close") ?? num("matchPrice");
  const refPrice = num("refPrice") ?? num("referencePrice");
  const change = lastPrice != null && refPrice != null ? lastPrice - refPrice : num("change");
  const changePct = lastPrice != null && refPrice != null && refPrice !== 0
    ? ((lastPrice - refPrice) / refPrice) * 100
    : num("changePct");

  return {
    symbol,
    lastPrice,
    open: num("open") ?? num("openPrice"),
    high: num("high") ?? num("highPrice"),
    low: num("low") ?? num("lowPrice"),
    close: num("close"),
    volume: num("matchVolume") ?? num("nmTotalTradedQty"),
    refPrice,
    ceiling: num("ceiling") ?? num("ceilingPrice"),
    floor: num("floor") ?? num("floorPrice"),
    totalVolume: num("totalVolume") ?? num("nmTotalTradedQty"),
    totalValue: num("totalValue") ?? num("nmTotalTradedValue"),
    change,
    changePct,
    updatedAt: new Date().toLocaleTimeString("vi-VN"),
    source: "DNSE_MQTT",
  };
}

function parseChartQuote(raw: DnseChartQuote): Partial<StockTick> {
  const lastPrice = raw.lastPrice ?? raw.close ?? null;
  return {
    symbol: raw.symbol.toUpperCase(),
    lastPrice,
    open: raw.open ?? null,
    high: raw.high ?? null,
    low: raw.low ?? null,
    close: raw.close ?? null,
    volume: raw.volume ?? null,
    refPrice: raw.close ?? null,
    ceiling: null,
    floor: null,
    totalVolume: raw.volume ?? null,
    totalValue: null,
    change: null,
    changePct: null,
    updatedAt: raw.tradingDate ?? new Date().toLocaleTimeString("vi-VN"),
    source: raw.source ?? "DNSE_CHART_API",
    tradingDate: raw.tradingDate ?? null,
  };
}

function priceColor(lastPrice: number | null, refPrice: number | null, ceiling: number | null, floor: number | null): string {
  if (lastPrice == null || refPrice == null) return "text.primary";
  if (ceiling != null && lastPrice >= ceiling) return "#a020f0";
  if (floor != null && lastPrice <= floor) return "#00bfff";
  if (lastPrice > refPrice) return "success.main";
  if (lastPrice < refPrice) return "error.main";
  return "#e8a317";
}

function formatVolume(value: number | null): string {
  if (value == null) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("vi-VN");
}

function formatPrice(value: number | null): string {
  if (value == null) return "—";
  return value.toFixed(2);
}

export default function RealtimePricePage() {
  const [credentials, setCredentials] = useState<MqttCredentials | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [ticks, setTicks] = useState<Record<string, StockTick>>({});
  const [newSymbol, setNewSymbol] = useState("");
  const [flashMap, setFlashMap] = useState<Record<string, "up" | "down">>({});
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const clientRef = useRef<mqtt.MqttClient | null>(null);
  const prevPriceRef = useRef<Record<string, number>>({});

  const refreshFallbackQuotes = useCallback(async () => {
    if (symbols.length === 0) return;
    setFallbackLoading(true);
    try {
      const results = await Promise.allSettled(symbols.map((symbol) => dnseApi.getChartQuote(symbol)));
      const next: Record<string, Partial<StockTick>> = {};
      results.forEach((result, index) => {
        if (result.status !== "fulfilled" || result.value.status === "NO_DATA") return;
        next[symbols[index]] = parseChartQuote(result.value);
      });
      if (Object.keys(next).length > 0) {
        setTicks((prev) => {
          const merged = { ...prev };
          for (const [symbol, tick] of Object.entries(next)) {
            merged[symbol] = { ...merged[symbol], ...tick } as StockTick;
          }
          return merged;
        });
      }
    } catch {
      setError("Không thể tải dữ liệu dự phòng từ DNSE Chart API.");
    } finally {
      setFallbackLoading(false);
    }
  }, [symbols]);

  const fetchCredentials = useCallback(async () => {
    try {
      const creds = await dnseApi.getMqttCredentials();
      setCredentials(creds);
      if (!creds.available) {
        setError(creds.reason ?? "MQTT chưa khả dụng. Đang dùng Chart API làm dữ liệu dự phòng.");
      }
    } catch {
      setError("Không thể lấy thông tin kết nối MQTT. Đang thử dùng Chart API dự phòng.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCredentials();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchCredentials]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void refreshFallbackQuotes();
    }, 0);
    const timer = window.setInterval(() => {
      void refreshFallbackQuotes();
    }, 15000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [refreshFallbackQuotes]);

  useEffect(() => {
    if (!credentials?.available || !credentials.token || !credentials.investorId || !credentials.wsUrl) return;

    const clientId = `dnse-price-json-mqtt-ws-sub-${credentials.investorId}-${Math.random().toString(36).slice(2, 8)}`;
    const client = mqtt.connect(credentials.wsUrl, {
      clientId,
      username: credentials.investorId,
      password: credentials.token,
      protocol: "wss",
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    });

    clientRef.current = client;
    client.on("connect", () => {
      setConnected(true);
      setError(null);
      symbols.forEach((symbol) => client.subscribe(`plaintext/quotes/stock/SI/${symbol}`));
    });

    client.on("error", (err) => {
      setError(`MQTT lỗi: ${err.message}. Bảng vẫn dùng Chart API dự phòng.`);
      setConnected(false);
    });
    client.on("close", () => setConnected(false));
    client.on("message", (topic, payload) => {
      try {
        const raw = JSON.parse(payload.toString()) as Record<string, unknown>;
        const symbol = String(raw.symbol ?? raw.stockCode ?? topic.split("/").pop() ?? "").toUpperCase();
        if (!symbol) return;

        const parsed = parseStockInfo(symbol, raw);
        setTicks((prev) => ({
          ...prev,
          [symbol]: { ...prev[symbol], ...parsed } as StockTick,
        }));

        if (parsed.lastPrice != null) {
          const previous = prevPriceRef.current[symbol];
          if (previous != null && parsed.lastPrice !== previous) {
            setFlashMap((current) => ({ ...current, [symbol]: parsed.lastPrice! > previous ? "up" : "down" }));
            window.setTimeout(() => {
              setFlashMap((current) => {
                const next = { ...current };
                delete next[symbol];
                return next;
              });
            }, 800);
          }
          prevPriceRef.current[symbol] = parsed.lastPrice;
        }
      } catch {
        // Ignore malformed realtime payloads.
      }
    });

    return () => {
      client.end(true);
      clientRef.current = null;
    };
    // MQTT subscription is initialized once per credential refresh; symbol changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentials]);

  useEffect(() => {
    const client = clientRef.current;
    if (!client || !connected) return;
    symbols.forEach((symbol) => client.subscribe(`plaintext/quotes/stock/SI/${symbol}`));
  }, [symbols, connected]);

  const addSymbol = () => {
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol || symbols.includes(symbol)) return;
    setSymbols((prev) => [...prev, symbol]);
    setNewSymbol("");
  };

  const removeSymbol = (symbol: string) => {
    setSymbols((prev) => prev.filter((item) => item !== symbol));
    const client = clientRef.current;
    if (client && connected) client.unsubscribe(`plaintext/quotes/stock/SI/${symbol}`);
    setTicks((prev) => {
      const next = { ...prev };
      delete next[symbol];
      return next;
    });
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            <ShowChart sx={{ mr: 1, verticalAlign: "middle" }} />
            Bảng giá realtime
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Dữ liệu từ DNSE MQTT; nếu realtime chưa có tín hiệu, hệ thống tự dùng Chart API làm nguồn dự phòng.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Chip
            icon={<FiberManualRecord sx={{ fontSize: 10 }} />}
            label={connected ? "MQTT đang kết nối" : fallbackLoading ? "Đang tải dự phòng" : "Chart API dự phòng"}
            color={connected ? "success" : "warning"}
            size="small"
            variant="outlined"
          />
          <Tooltip title="Tải lại dữ liệu">
            <IconButton size="small" onClick={() => { void fetchCredentials(); void refreshFallbackQuotes(); }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {!credentials && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Đang kết nối DNSE...</Typography>
        </Box>
      )}

      {credentials?.available === false && (
        <Alert severity="info" sx={{ mb: 2 }}>
          MQTT chưa khả dụng. Bảng vẫn hiển thị dữ liệu gần nhất từ DNSE Chart API.
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>Mã theo dõi:</Typography>
            {symbols.map((symbol) => (
              <Chip
                key={symbol}
                label={symbol}
                size="small"
                onDelete={() => removeSymbol(symbol)}
                deleteIcon={<Close sx={{ fontSize: 14 }} />}
                sx={{ fontWeight: 600 }}
              />
            ))}
            <TextField
              size="small"
              placeholder="Thêm mã..."
              value={newSymbol}
              onChange={(event) => setNewSymbol(event.target.value.toUpperCase())}
              onKeyDown={(event) => event.key === "Enter" && addSymbol()}
              sx={{ width: 110, "& .MuiInputBase-input": { py: 0.5, fontSize: 13 } }}
            />
            <IconButton size="small" onClick={addSymbol} color="primary"><Add /></IconButton>
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Card} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 12, color: "text.secondary", py: 1.2 } }}>
              <TableCell>Mã CK</TableCell>
              <TableCell align="right"><MetricTooltip label="Trần" title="Giá cao nhất được phép giao dịch trong phiên." /></TableCell>
              <TableCell align="right"><MetricTooltip label="Sàn" title="Giá thấp nhất được phép giao dịch trong phiên." /></TableCell>
              <TableCell align="right"><MetricTooltip label="TC" title="Giá tham chiếu, thường là mốc để tính tăng/giảm trong phiên." /></TableCell>
              <TableCell align="right"><MetricTooltip label="Giá" title="Giá khớp hoặc lần cập nhật gần nhất từ DNSE." /></TableCell>
              <TableCell align="right"><MetricTooltip label="+/-" title="Mức thay đổi tuyệt đối so với giá tham chiếu." /></TableCell>
              <TableCell align="right">%</TableCell>
              <TableCell align="right">Mở cửa</TableCell>
              <TableCell align="right">Cao</TableCell>
              <TableCell align="right">Thấp</TableCell>
              <TableCell align="right"><MetricTooltip label="KL khớp" title="Khối lượng của lần khớp hoặc cập nhật gần nhất." /></TableCell>
              <TableCell align="right"><MetricTooltip label="Tổng KL" title="Tổng khối lượng đã giao dịch trong phiên." /></TableCell>
              <TableCell align="center">Nguồn</TableCell>
              <TableCell align="center">Cập nhật</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {symbols.map((symbol) => {
              const tick = ticks[symbol];
              const flash = flashMap[symbol];
              const color = tick ? priceColor(tick.lastPrice, tick.refPrice, tick.ceiling, tick.floor) : "text.secondary";
              return (
                <TableRow
                  key={symbol}
                  sx={{
                    transition: "background-color 0.3s",
                    bgcolor: flash === "up" ? "rgba(76,175,80,0.12)" : flash === "down" ? "rgba(244,67,54,0.12)" : "transparent",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>{symbol}</TableCell>
                  <TableCell align="right" sx={{ color: "#a020f0", fontSize: 12 }}>{tick ? formatPrice(tick.ceiling) : "—"}</TableCell>
                  <TableCell align="right" sx={{ color: "#00bfff", fontSize: 12 }}>{tick ? formatPrice(tick.floor) : "—"}</TableCell>
                  <TableCell align="right" sx={{ color: "#e8a317", fontSize: 12 }}>{tick ? formatPrice(tick.refPrice) : "—"}</TableCell>
                  <TableCell align="right" sx={{ color, fontWeight: 700, fontSize: 14 }}>{tick ? formatPrice(tick.lastPrice) : "—"}</TableCell>
                  <TableCell align="right" sx={{ color, fontSize: 12 }}>
                    {tick?.change != null ? `${tick.change > 0 ? "+" : ""}${tick.change.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell align="right" sx={{ color, fontSize: 12 }}>
                    {tick?.changePct != null ? `${tick.changePct > 0 ? "+" : ""}${tick.changePct.toFixed(2)}%` : "—"}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: 12 }}>{tick ? formatPrice(tick.open) : "—"}</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12 }}>{tick ? formatPrice(tick.high) : "—"}</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12 }}>{tick ? formatPrice(tick.low) : "—"}</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12 }}>{tick ? formatVolume(tick.volume) : "—"}</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12 }}>{tick ? formatVolume(tick.totalVolume) : "—"}</TableCell>
                  <TableCell align="center" sx={{ fontSize: 11, color: "text.secondary" }}>
                    {tick?.source === "DNSE_MQTT" ? "MQTT" : tick ? "Chart" : "—"}
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: 11, color: "text.secondary" }}>{tick?.updatedAt ?? "—"}</TableCell>
                </TableRow>
              );
            })}
            {symbols.length === 0 && (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  Thêm mã chứng khoán để theo dõi giá realtime
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="caption" sx={{ color: "text.secondary", mt: 2, display: "block", textAlign: "center" }}>
        Dữ liệu chỉ phục vụ theo dõi và nghiên cứu, không phải khuyến nghị đầu tư. Giá có thể chậm vài giây so với sàn.
      </Typography>
    </Box>
  );
}
