import { useState } from "react";
import {
  AppBar, Avatar, Badge, Box, Drawer, IconButton, List, ListItemButton, ListItemIcon,
  ListItemText, Paper, Stack, Toolbar, Typography, Chip,
} from "@mui/material";
import {
  AccountBalanceWalletOutlined, CalculateOutlined, DashboardOutlined, EventNoteOutlined, ExpandMore, FolderOutlined, LightModeOutlined,
  NotificationsNoneOutlined, PieChartOutlined, QueryStatsOutlined, ScienceOutlined, ShowChart, SignalCellularAlt,
  StarBorderOutlined, SearchOutlined, ChevronLeft, ChevronRight, SettingsOutlined, SavingsOutlined, ReceiptLongOutlined,
} from "@mui/icons-material";
import { Link, Outlet, useLocation } from "react-router-dom";

const drawerWidth = 252;
const collapsedDrawerWidth = 86;
const sidebarBg = "#061b33";
const sidebarBg2 = "#082544";
const sidebarText = "rgba(236, 246, 255, 0.88)";
const sidebarMuted = "rgba(207, 225, 245, 0.62)";
const navItems = [
  { label: "Tổng quan", to: "/", icon: <DashboardOutlined /> },
  { label: "Cơ hội", to: "/opportunities", icon: <QueryStatsOutlined /> },
  { label: "Hồ sơ nghiên cứu", to: "/investment-thesis", icon: <FolderOutlined /> },
  { label: "Watchlist", to: "/watchlist", icon: <StarBorderOutlined /> },
  { label: "Kế hoạch đầu tư", to: "/decision-plans", icon: <EventNoteOutlined /> },
  { label: "Định giá", to: "/valuation-scenarios", icon: <CalculateOutlined /> },
  { label: "Danh mục đầu tư", to: "/portfolio", icon: <PieChartOutlined /> },
  { label: "Phân bổ vốn", to: "/portfolio-allocation", icon: <AccountBalanceWalletOutlined /> },
  { label: "Sổ tiền mặt", to: "/portfolio-cash-ledger", icon: <SavingsOutlined /> },
  { label: "Sổ giao dịch", to: "/portfolio-transactions", icon: <ReceiptLongOutlined /> },
  { label: "Paper Trading", to: "/paper-trading", icon: <ScienceOutlined /> },
  { label: "Backtest tín hiệu", to: "/backtest", icon: <ScienceOutlined /> },
  { label: "Bảng giá realtime", to: "/realtime", icon: <ShowChart /> },
];

export default function AppLayout() {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const now = new Date();
  const currentDrawerWidth = sidebarCollapsed ? collapsedDrawerWidth : drawerWidth;
  const activeItem = navItems.find((item) =>
    item.to === "/" ? location.pathname === item.to : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
  );

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
          <IconButton aria-label="Thông báo" sx={{ bgcolor: "white", border: 1, borderColor: "divider" }}><Badge badgeContent={3} color="primary"><NotificationsNoneOutlined /></Badge></IconButton>
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
          {navItems.map((item) => {
            const active = item.to === "/" ? location.pathname === item.to : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            return <ListItemButton
              key={item.to}
              component={Link}
              to={item.to}
              selected={active}
              title={sidebarCollapsed ? item.label : undefined}
              sx={{
                borderRadius: 2.5,
                mb: 0.45,
                minHeight: 46,
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

