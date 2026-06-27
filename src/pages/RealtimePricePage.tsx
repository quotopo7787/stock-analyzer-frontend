import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert, Box, Card, CardContent, Chip, IconButton, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography, CircularProgress, Tooltip,
} from "@mui/material";
import {
  Add, Close, FiberManualRecord, Refresh, ShowChart,
} from "@mui/icons-material";
import mqtt from "mqtt";
import { dnseApi, type MqttCredentials } from "../api/dnseApi";

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
}

const DEFAULT_SYMBOLS = ["FPT", "VNM", "MWG", "HPG", "VCB", "TCB", "MBB", "VHM", "VIC", "SSI"];

function parseStockInfo(symbol: string, raw: Record<string, unknown>): Partial<StockTick> {
  const num = (key: string) => {
    const v = raw[key];
    return typeof v === "number" ? v : v != null ? parseFloat(String(v)) : null;
  };
  const lastPrice = num("lastPrice") ?? num("close") ?? num("matchPrice");
  const refPrice = num("refPrice") ?? num("referencePrice");
  const change = lastPrice != null && refPrice != null ? lastPrice - refPrice : num("change");
  const changePct = lastPrice != null && refPrice != null && refPrice !== 0
    ? ((lastPrice - refPrice) / refPrice) * 100 : num("changePct");

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

function formatVolume(v: number | null): string {
  if (v == null) return "—";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toLocaleString("vi-VN");
}

function formatPrice(v: number | null): string {
  if (v == null) return "—";
  return v.toFixed(2);
}

export default function RealtimePricePage() {
  const [credentials, setCredentials] = useState<MqttCredentials | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [ticks, setTicks] = useState<Record<string, StockTick>>({});
  const [newSymbol, setNewSymbol] = useState("");
  const [flashMap, setFlashMap] = useState<Record<string, "up" | "down">>({});
  const clientRef = useRef<mqtt.MqttClient | null>(null);
  const prevPriceRef = useRef<Record<string, number>>({});

  const fetchCredentials = useCallback(async () => {
    try {
      const creds = await dnseApi.getMqttCredentials();
      setCredentials(creds);
      if (!creds.available) {
        setError(creds.reason ?? "MQTT không khả dụng");
      }
    } catch {
      setError("Không thể lấy thông tin kết nối MQTT");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCredentials();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchCredentials]);

  useEffect(() => {
    if (!credentials?.available || !credentials.token || !credentials.investorId) return;

    const clientId = `dnse-price-json-mqtt-ws-sub-${credentials.investorId}-${Math.random().toString(36).slice(2, 8)}`;

    const client = mqtt.connect(credentials.wsUrl!, {
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
      symbols.forEach((s) => {
        client.subscribe(`plaintext/quotes/stock/SI/${s}`);
      });
    });

    client.on("error", (err) => {
      setError("MQTT lỗi: " + err.message);
      setConnected(false);
    });

    client.on("close", () => setConnected(false));

    client.on("message", (_topic, payload) => {
      try {
        const raw = JSON.parse(payload.toString());
        const sym = (raw.symbol ?? raw.stockCode ?? _topic.split("/").pop() ?? "").toUpperCase();
        if (!sym) return;

        const parsed = parseStockInfo(sym, raw);
        setTicks((prev) => ({
          ...prev,
          [sym]: { ...prev[sym], ...parsed } as StockTick,
        }));

        if (parsed.lastPrice != null) {
          const prev = prevPriceRef.current[sym];
          if (prev != null && parsed.lastPrice !== prev) {
            setFlashMap((fm) => ({ ...fm, [sym]: parsed.lastPrice! > prev ? "up" : "down" }));
            setTimeout(() => setFlashMap((fm) => { const n = { ...fm }; delete n[sym]; return n; }), 800);
          }
          prevPriceRef.current[sym] = parsed.lastPrice;
        }
      } catch { /* ignore parse errors */ }
    });

    return () => {
      client.end(true);
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentials]);

  useEffect(() => {
    const client = clientRef.current;
    if (!client || !connected) return;

    symbols.forEach((s) => {
      client.subscribe(`plaintext/quotes/stock/SI/${s}`);
    });
  }, [symbols, connected]);

  const addSymbol = () => {
    const s = newSymbol.trim().toUpperCase();
    if (!s || symbols.includes(s)) return;
    setSymbols((prev) => [...prev, s]);
    setNewSymbol("");
  };

  const removeSymbol = (sym: string) => {
    setSymbols((prev) => prev.filter((s) => s !== sym));
    const client = clientRef.current;
    if (client && connected) {
      client.unsubscribe(`plaintext/quotes/stock/SI/${sym}`);
    }
    setTicks((prev) => { const n = { ...prev }; delete n[sym]; return n; });
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            <ShowChart sx={{ mr: 1, verticalAlign: "middle" }} />
            Bảng giá thời gian thực
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Dữ liệu từ DNSE WebSocket — chỉ mang tính tham khảo, không phải khuyến nghị đầu tư
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Chip
            icon={<FiberManualRecord sx={{ fontSize: 10 }} />}
            label={connected ? "Đang kết nối" : "Mất kết nối"}
            color={connected ? "success" : "error"}
            size="small"
            variant="outlined"
          />
          <Tooltip title="Kết nối lại">
            <IconButton size="small" onClick={fetchCredentials}><Refresh /></IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {!credentials && (
        <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /><Typography sx={{ mt: 2 }}>Đang kết nối DNSE...</Typography></Box>
      )}

      {credentials?.available === false && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Cần bật REST login (DNSE_REST_LOGIN_ENABLED=true, DNSE_USERNAME, DNSE_PASSWORD) để sử dụng bảng giá realtime.
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>Mã theo dõi:</Typography>
            {symbols.map((s) => (
              <Chip
                key={s}
                label={s}
                size="small"
                onDelete={() => removeSymbol(s)}
                deleteIcon={<Close sx={{ fontSize: 14 }} />}
                sx={{ fontWeight: 600 }}
              />
            ))}
            <TextField
              size="small"
              placeholder="Thêm mã..."
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && addSymbol()}
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
              <TableCell align="right">Trần</TableCell>
              <TableCell align="right">Sàn</TableCell>
              <TableCell align="right">TC</TableCell>
              <TableCell align="right">Giá</TableCell>
              <TableCell align="right">+/-</TableCell>
              <TableCell align="right">%</TableCell>
              <TableCell align="right">Mở cửa</TableCell>
              <TableCell align="right">Cao</TableCell>
              <TableCell align="right">Thấp</TableCell>
              <TableCell align="right">KL khớp</TableCell>
              <TableCell align="right">Tổng KL</TableCell>
              <TableCell align="center">Cập nhật</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {symbols.map((sym) => {
              const t = ticks[sym];
              const flash = flashMap[sym];
              const color = t ? priceColor(t.lastPrice, t.refPrice, t.ceiling, t.floor) : "text.secondary";
              return (
                <TableRow
                  key={sym}
                  sx={{
                    transition: "background-color 0.3s",
                    bgcolor: flash === "up" ? "rgba(76,175,80,0.12)" : flash === "down" ? "rgba(244,67,54,0.12)" : "transparent",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>{sym}</TableCell>
                  <TableCell align="right" sx={{ color: "#a020f0", fontSize: 12 }}>{t ? formatPrice(t.ceiling) : "—"}</TableCell>
                  <TableCell align="right" sx={{ color: "#00bfff", fontSize: 12 }}>{t ? formatPrice(t.floor) : "—"}</TableCell>
                  <TableCell align="right" sx={{ color: "#e8a317", fontSize: 12 }}>{t ? formatPrice(t.refPrice) : "—"}</TableCell>
                  <TableCell align="right" sx={{ color, fontWeight: 700, fontSize: 14 }}>
                    {t ? formatPrice(t.lastPrice) : "—"}
                  </TableCell>
                  <TableCell align="right" sx={{ color, fontSize: 12 }}>
                    {t?.change != null ? (t.change > 0 ? "+" : "") + t.change.toFixed(2) : "—"}
                  </TableCell>
                  <TableCell align="right" sx={{ color, fontSize: 12 }}>
                    {t?.changePct != null ? (t.changePct > 0 ? "+" : "") + t.changePct.toFixed(2) + "%" : "—"}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: 12 }}>{t ? formatPrice(t.open) : "—"}</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12 }}>{t ? formatPrice(t.high) : "—"}</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12 }}>{t ? formatPrice(t.low) : "—"}</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12 }}>{t ? formatVolume(t.volume) : "—"}</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12 }}>{t ? formatVolume(t.totalVolume) : "—"}</TableCell>
                  <TableCell align="center" sx={{ fontSize: 11, color: "text.secondary" }}>{t?.updatedAt ?? "—"}</TableCell>
                </TableRow>
              );
            })}
            {symbols.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  Thêm mã chứng khoán để theo dõi giá realtime
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="caption" sx={{ color: "text.secondary", mt: 2, display: "block", textAlign: "center" }}>
        ⚠ Dữ liệu tín hiệu mô phỏng — Không phải khuyến nghị đầu tư. Giá có thể chậm vài giây so với sàn.
      </Typography>
    </Box>
  );
}
