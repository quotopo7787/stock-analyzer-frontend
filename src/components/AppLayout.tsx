import { useEffect, useRef, useState } from "react";
import {
  AppBar, Avatar, Badge, Box, Collapse, Drawer, IconButton, List, ListItemButton, ListItemIcon,
  ListItemText, Menu, MenuItem, Paper, Stack, Toolbar, Typography, Chip,
} from "@mui/material";
import {
  AccountBalanceWalletOutlined, CalculateOutlined, DashboardOutlined, EventNoteOutlined, ExpandMore, FolderOutlined, LightModeOutlined,
  NotificationsActiveOutlined, NotificationsNoneOutlined, PieChartOutlined, QueryStatsOutlined, ScienceOutlined, ShowChart, SignalCellularAlt,
  StarBorderOutlined, SearchOutlined, ChevronLeft, ChevronRight, SettingsOutlined, SavingsOutlined, ReceiptLongOutlined, PublicOutlined,
} from "@mui/icons-material";
import type { ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

const drawerWidth = 252;
const collapsedDrawerWidth = 86;
const sidebarBg = "#061b33";
const sidebarBg2 = "#082544";
const sidebarText = "rgba(236, 246, 255, 0.88)";
const sidebarMuted = "rgba(207, 225, 245, 0.62)";

type NavItem = {
  label: string;
  to: string;
  icon: ReactNode;
};

type NavSection = NavItem | {
  label: string;
  items: NavItem[];
};

const hasSectionItems = (section: NavSection): section is Extract<NavSection, { items: NavItem[] }> =>
  "items" in section;

const navSections: NavSection[] = [
  {
    label: "Tổng quan",
    to: "/",
    icon: <DashboardOutlined />,
  },
  {
    label: "Thị trường & Cơ hội",
    items: [
      { label: "Cơ hội", to: "/opportunities", icon: <QueryStatsOutlined /> },
      { label: "Bảng giá realtime", to: "/realtime", icon: <ShowChart /> },
      { label: "Bối cảnh vĩ mô", to: "/macro-context", icon: <PublicOutlined /> },
      { label: "Trung tâm cảnh báo", to: "/alert-center", icon: <NotificationsActiveOutlined /> },
    ],
  },
  {
    label: "Nghiên cứu cổ phiếu",
    items: [
      { label: "Hồ sơ nghiên cứu", to: "/investment-thesis", icon: <FolderOutlined /> },
      { label: "Watchlist", to: "/watchlist", icon: <StarBorderOutlined /> },
      { label: "Định giá", to: "/valuation-scenarios", icon: <CalculateOutlined /> },
    ],
  },
  {
    label: "Danh mục & Vốn",
    items: [
      { label: "Danh mục đầu tư", to: "/portfolio", icon: <PieChartOutlined /> },
      { label: "Phân bổ vốn", to: "/portfolio-allocation", icon: <AccountBalanceWalletOutlined /> },
      { label: "Kế hoạch đầu tư", to: "/decision-plans", icon: <EventNoteOutlined /> },
    ],
  },
  {
    label: "Sổ sách",
    items: [
      { label: "Sổ giao dịch", to: "/portfolio-transactions", icon: <ReceiptLongOutlined /> },
      { label: "Sổ tiền mặt", to: "/portfolio-cash-ledger", icon: <SavingsOutlined /> },
    ],
  },
  {
    label: "Kiểm chứng",
    items: [
      { label: "Paper Trading", to: "/paper-trading", icon: <ScienceOutlined /> },
      { label: "Backtest tín hiệu", to: "/backtest", icon: <ScienceOutlined /> },
    ],
  },
];
const navItems = navSections.flatMap((section) => hasSectionItems(section) ? section.items : [section]);

interface NotifItem {
  type: string;
  title: string;
  message: string;
  stockCode: string | null;
  score: number | null;
  timestamp: string;
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/notifications/subscribe");
    esRef.current = es;
    const handler = (e: MessageEvent) => {
      try {
        const n: NotifItem = JSON.parse(e.data);
        setNotifications((prev) => [n, ...prev].slice(0, 50));
        setUnreadCount((c) => c + 1);
      } catch { /* ignore */ }
    };
    es.onmessage = handler;
    for (const t of ["SCORE_CHANGE", "WATCHLIST_ALERT", "OPPORTUNITY_SIGNAL"]) {
      es.addEventListener(t, handler as EventListener);
    }
    fetch("/api/notifications/recent?limit=10")
      .then((r) => r.json())
      .then((data: NotifItem[]) => { if (Array.isArray(data)) setNotifications(data); })
      .catch(() => {});
    return () => es.close();
  }, []);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navSections.filter(hasSectionItems).map((section) => [section.label, false])),
  );
  const now = new Date();
  const currentDrawerWidth = sidebarCollapsed ? collapsedDrawerWidth : drawerWidth;
  const activeItem = navItems.find((item) =>
    item.to === "/" ? location.pathname === item.to : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
  );
  const isItemActive = (to: string) =>
    to === "/" ? location.pathname === to : location.pathname === to || location.pathname.startsWith(`${to}/`);
  const isSectionActive = (section: NavSection) => hasSectionItems(section) && section.items.some((item) => isItemActive(item.to));
  const toggleSection = (label: string) => {
    setExpandedSections((current) => ({ ...current, [label]: !current[label] }));
  };

  return <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        ml: `${currentDrawerWidth}px`,
        width: `calc(100% - ${currentDrawerWidth}px)`,
        borderBottom: 0,
        bgcolor: "rgba(248, 251, 255, 0.82)",
        backdropFilter: "blur(16px)",
        boxShadow: "inset 0 -1px 0 rgba(16, 24, 40, 0.06)",
        transition: "margin-left .22s ease, width .22s ease",
      }}
    >
      <Toolbar sx={{ minHeight: "68px !important", justifyContent: "space-between", gap: 2 }}>
        <Stack direction="row" spacing={1.4} sx={{ alignItems: "center", minWidth: 0 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: "white", border: 1, borderColor: "divider", display: "grid", placeItems: "center", color: "primary.main" }}>
            {activeItem?.icon ?? <DashboardOutlined />}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Workspace
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.15 }} noWrap>
              {activeItem?.label ?? "Stock Analyzer"}
            </Typography>
          </Box>
          <Chip size="small" label="Live local" color="success" variant="outlined" sx={{ ml: 1, bgcolor: "white" }} />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              display: { xs: "none", lg: "flex" },
              alignItems: "center",
              gap: 1,
              width: 280,
              height: 38,
              px: 1.4,
              borderRadius: 2.5,
              bgcolor: "rgba(255,255,255,0.86)",
              border: 1,
              borderColor: "divider",
              color: "text.secondary",
              boxShadow: "0 6px 18px rgba(16, 24, 40, 0.04)",
            }}
          >
            <SearchOutlined fontSize="small" />
            <Typography variant="body2" sx={{ flex: 1 }}>Tìm nhanh mã, hồ sơ, kế hoạch</Typography>
            <Typography variant="caption" sx={{ px: 0.8, py: 0.2, borderRadius: 1, bgcolor: "#f2f6fb", border: 1, borderColor: "divider" }}>Ctrl K</Typography>
          </Box>
          <IconButton aria-label="Giao diện sáng" sx={{ bgcolor: "white", border: 1, borderColor: "divider" }}><LightModeOutlined /></IconButton>
          <IconButton
            aria-label="Thông báo"
            sx={{ bgcolor: "white", border: 1, borderColor: "divider" }}
            onClick={(e) => { setNotifAnchor(e.currentTarget); setUnreadCount(0); }}
          >
            <Badge badgeContent={unreadCount} color="primary">
              {unreadCount > 0 ? <NotificationsActiveOutlined /> : <NotificationsNoneOutlined />}
            </Badge>
          </IconButton>
          <Menu
            anchorEl={notifAnchor}
            open={Boolean(notifAnchor)}
            onClose={() => setNotifAnchor(null)}
            slotProps={{ paper: { sx: { width: 380, maxHeight: 420 } } }}
          >
            <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Thông báo gần đây</Typography>
            </Box>
            {notifications.length === 0 && (
              <MenuItem disabled><Typography variant="body2" color="text.secondary">Chưa có thông báo</Typography></MenuItem>
            )}
            {notifications.slice(0, 8).map((n, i) => (
              <MenuItem key={`${n.timestamp}-${i}`} onClick={() => { setNotifAnchor(null); navigate("/alert-center"); }} sx={{ whiteSpace: "normal", py: 1 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{n.title}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", maxWidth: 340, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {n.message}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
            {notifications.length > 0 && (
              <MenuItem onClick={() => { setNotifAnchor(null); navigate("/alert-center"); }} sx={{ justifyContent: "center", borderTop: 1, borderColor: "divider" }}>
                <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>Xem tất cả</Typography>
              </MenuItem>
            )}
          </Menu>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", ml: 1, pl: 1, borderLeft: 1, borderColor: "divider" }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "#e9f2ff", color: "primary.dark", fontSize: 14, fontWeight: 750 }}>AD</Avatar>
            <ExpandMore fontSize="small" color="action" />
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>

    <Drawer
      variant="permanent"
      sx={{
        width: currentDrawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: currentDrawerWidth,
          boxSizing: "border-box",
          borderRight: 0,
          color: sidebarText,
          background:
            `radial-gradient(circle at 34px 24px, rgba(45,127,255,0.28), transparent 24%), linear-gradient(180deg, ${sidebarBg} 0%, ${sidebarBg2} 54%, #041425 100%)`,
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          overflow: "hidden",
          boxShadow: "12px 0 38px rgba(2, 8, 23, 0.22)",
          transition: "width .22s ease",
          "&::after": {
            content: '""',
            position: "absolute",
            top: 68,
            right: 0,
            bottom: 0,
            width: 1,
            background: "linear-gradient(180deg, rgba(83, 156, 255, 0), rgba(83, 156, 255, 0.18) 18%, rgba(255,255,255,0.08))",
            pointerEvents: "none",
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 68,
            left: 22,
            right: 18,
            height: 1,
            background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.12) 18%, rgba(255,255,255,0.08) 72%, rgba(255,255,255,0))",
            pointerEvents: "none",
          },
        },
      }}
    >
      <Toolbar
        sx={{
          minHeight: "76px !important",
          px: sidebarCollapsed ? "16px !important" : "20px !important",
          borderBottom: 0,
          justifyContent: sidebarCollapsed ? "center" : "flex-start",
          position: "relative",
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 3,
            background: "linear-gradient(135deg, #2f7fff 0%, #0f5fc4 72%, #0a3a88 100%)",
            color: "white",
            display: "grid",
            placeItems: "center",
            mr: sidebarCollapsed ? 0 : 1.5,
            boxShadow: "0 14px 30px rgba(13, 71, 161, 0.26)",
            "& svg": { fontSize: 21 },
          }}
        >
          <ShowChart />
        </Box>
        {!sidebarCollapsed && (
          <Typography variant="h6" sx={{ whiteSpace: "nowrap", fontWeight: 800, letterSpacing: 0, color: "#f8fbff" }}>
            Stock Analyzer
          </Typography>
        )}
        <IconButton
          aria-label={sidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
          onClick={() => setSidebarCollapsed((value) => !value)}
          size="small"
          sx={{
            position: "absolute",
            right: -14,
            top: 24,
            width: 28,
            height: 28,
            bgcolor: "white",
            border: 1,
            borderColor: "divider",
            boxShadow: "0 8px 18px rgba(16, 24, 40, 0.12)",
            zIndex: 2,
            "&:hover": { bgcolor: "#f7fbff" },
          }}
        >
          {sidebarCollapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
        </IconButton>
      </Toolbar>
      <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, p: sidebarCollapsed ? 1.1 : 1.6 }}>
        <List sx={{ pt: 1.2, overflowY: "auto", pr: sidebarCollapsed ? 0 : 0.5 }}>
          {navSections.map((section) => {
            if (!hasSectionItems(section)) {
              const active = isItemActive(section.to);
              return (
                <Box key={section.label} sx={{ mb: sidebarCollapsed ? 1 : 1.35 }}>
                  <ListItemButton
                    component={Link}
                    to={section.to}
                    selected={active}
                    title={sidebarCollapsed ? section.label : undefined}
                    sx={{
                      borderRadius: 2.5,
                      mb: 0.45,
                      minHeight: 44,
                      px: sidebarCollapsed ? 1 : 1.2,
                      justifyContent: sidebarCollapsed ? "center" : "flex-start",
                      color: active ? "#ffffff" : sidebarText,
                      transition: "background-color .18s ease, color .18s ease, transform .18s ease, box-shadow .18s ease",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.08)", transform: "translateX(2px)" },
                      "&.Mui-selected": {
                        background: "linear-gradient(135deg, rgba(47,127,255,0.95) 0%, rgba(13,87,201,0.92) 100%)",
                        color: "#ffffff",
                        boxShadow: "inset 3px 0 0 rgba(255,255,255,0.92), 0 14px 28px rgba(0, 83, 197, 0.26)",
                      },
                      "&.Mui-selected:hover": { bgcolor: "rgba(47,127,255,0.95)" },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        justifyContent: "center",
                        mr: sidebarCollapsed ? 0 : undefined,
                        color: active ? "#ffffff" : sidebarMuted,
                        "& svg": {
                          fontSize: 22,
                          p: active ? 0.55 : 0,
                          borderRadius: active ? 2 : 0,
                          bgcolor: active ? "rgba(255,255,255,0.16)" : "transparent",
                          boxSizing: "content-box",
                        },
                      }}
                    >
                      {section.icon}
                    </ListItemIcon>
                    {!sidebarCollapsed && (
                      <ListItemText primary={section.label} slotProps={{ primary: { sx: { fontWeight: active ? 750 : 560, fontSize: 14, letterSpacing: 0 } } }} />
                    )}
                  </ListItemButton>
                </Box>
              );
            }
            const sectionActive = isSectionActive(section);
            const sectionOpen = sidebarCollapsed || expandedSections[section.label];
            return (
            <Box key={section.label} sx={{ mb: sidebarCollapsed ? 1 : 1.35 }}>
              {!sidebarCollapsed && (
                <ListItemButton
                  onClick={() => toggleSection(section.label)}
                  sx={{
                    minHeight: 30,
                    px: 1.3,
                    py: 0.45,
                    mb: 0.45,
                    borderRadius: 2,
                    color: sectionActive ? "#dcecff" : "rgba(207, 225, 245, 0.58)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                  }}
                >
                  <ListItemText
                    primary={section.label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: 11,
                          fontWeight: 850,
                          letterSpacing: 0.7,
                          textTransform: "uppercase",
                        },
                      },
                    }}
                  />
                  <ExpandMore
                    fontSize="small"
                    sx={{
                      color: "rgba(207, 225, 245, 0.66)",
                      transform: sectionOpen ? "rotate(0deg)" : "rotate(-90deg)",
                      transition: "transform .18s ease",
                    }}
                  />
                </ListItemButton>
              )}
              {sidebarCollapsed && (
                <Box
                  title={section.label}
                  sx={{
                    width: 30,
                    height: 1,
                    mx: "auto",
                    mb: 0.7,
                    bgcolor: "rgba(255,255,255,0.12)",
                  }}
                />
              )}
              <Collapse in={sectionOpen} timeout="auto" unmountOnExit={!sectionActive && !sidebarCollapsed}>
                {section.items.map((item) => {
                  const active = isItemActive(item.to);
                  return <ListItemButton
                    key={item.to}
                    component={Link}
                    to={item.to}
                    selected={active}
                    title={sidebarCollapsed ? item.label : undefined}
                    sx={{
                      borderRadius: 2.5,
                      mb: 0.45,
                      minHeight: 44,
                      px: sidebarCollapsed ? 1 : 1.2,
                      justifyContent: sidebarCollapsed ? "center" : "flex-start",
                      color: active ? "#ffffff" : sidebarText,
                      transition: "background-color .18s ease, color .18s ease, transform .18s ease, box-shadow .18s ease",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.08)", transform: "translateX(2px)" },
                      "&.Mui-selected": {
                        background: "linear-gradient(135deg, rgba(47,127,255,0.95) 0%, rgba(13,87,201,0.92) 100%)",
                        color: "#ffffff",
                        boxShadow: "inset 3px 0 0 rgba(255,255,255,0.92), 0 14px 28px rgba(0, 83, 197, 0.26)",
                      },
                      "&.Mui-selected:hover": { bgcolor: "rgba(47,127,255,0.95)" },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        justifyContent: "center",
                        mr: sidebarCollapsed ? 0 : undefined,
                        color: active ? "#ffffff" : sidebarMuted,
                        "& svg": {
                          fontSize: 22,
                          p: active ? 0.55 : 0,
                          borderRadius: active ? 2 : 0,
                          bgcolor: active ? "rgba(255,255,255,0.16)" : "transparent",
                          boxSizing: "content-box",
                        },
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!sidebarCollapsed && (
                      <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: active ? 750 : 560, fontSize: 14, letterSpacing: 0 } } }} />
                    )}
                  </ListItemButton>;
                })}
              </Collapse>
            </Box>
          );})}
        </List>
        {!sidebarCollapsed && <Box sx={{ mt: "auto" }}>
          <Paper variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: "rgba(255,255,255,0.07)", boxShadow: "none", borderColor: "rgba(255,255,255,0.12)", borderRadius: 3, color: sidebarText }}>
            <Stack direction="row" spacing={1.2} sx={{ alignItems: "center" }}>
              <Box sx={{ width: 34, height: 34, borderRadius: 1.2, bgcolor: "rgba(255,255,255,0.10)", color: "#8fc1ff", display: "grid", placeItems: "center", border: 1, borderColor: "rgba(255,255,255,0.12)" }}><SignalCellularAlt fontSize="small" /></Box>
              <Box sx={{ minWidth: 0, flex: 1 }}><Typography variant="body2" sx={{ fontWeight: 650, color: "#f8fbff" }}>Dữ liệu cập nhật</Typography><Typography variant="caption" sx={{ color: sidebarMuted }}>{now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} {now.toLocaleDateString("vi-VN")}</Typography></Box>
              <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "success.main" }} />
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: 1.2, bgcolor: "rgba(255,255,255,0.04)", boxShadow: "none", borderColor: "rgba(255,255,255,0.10)", borderRadius: 2.5, color: sidebarText }}>
            <Stack direction="row" spacing={1.1} sx={{ alignItems: "center" }}>
              <SettingsOutlined sx={{ color: sidebarMuted, fontSize: 19 }} />
              <Typography variant="body2" sx={{ fontWeight: 650 }}>Cài đặt workspace</Typography>
            </Stack>
          </Paper>
        </Box>}
      </Box>
    </Drawer>

    <Box component="main" sx={{ flexGrow: 1, minWidth: 0, bgcolor: "background.default" }}>
      <Toolbar sx={{ minHeight: "68px !important" }} />
      <Box sx={{ px: { xs: 2, lg: 4 }, py: 3, maxWidth: 1600, mx: "auto" }}><Outlet /></Box>
    </Box>
  </Box>;
}

