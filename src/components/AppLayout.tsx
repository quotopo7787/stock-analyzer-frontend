import { AppBar, Box, Container, Drawer, List, ListItemButton, ListItemText, Toolbar, Typography } from "@mui/material";
import { Link, Outlet, useLocation } from "react-router-dom";

const drawerWidth = 230;
const navItems = [
  { label: "Tổng quan", to: "/" },
  { label: "Cơ hội", to: "/opportunities" },
  { label: "Hồ sơ nghiên cứu", to: "/investment-thesis" },
  { label: "Watchlist", to: "/watchlist" },
  { label: "Kế hoạch đầu tư", to: "/decision-plans" },
  { label: "Danh mục đầu tư", to: "/portfolio" },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6">
            Stock Analyzer
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" } }}>
        <Toolbar />
        <Box sx={{ px: 1.5, py: 2 }}>
          <Typography variant="overline" color="text.secondary" sx={{ px: 1.5 }}>Workflow chính</Typography>
          <List>
            {navItems.map((item) => {
              const active = item.to === "/" ? location.pathname === item.to : location.pathname.startsWith(item.to);
              return <ListItemButton key={item.to} component={Link} to={item.to} selected={active} sx={{ borderRadius: 1.5, mb: 0.5 }}>
                <ListItemText primary={item.label} />
              </ListItemButton>;
            })}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Toolbar />
        <Container sx={{ mt: 4, mb: 4 }} maxWidth="xl"><Outlet /></Container>
      </Box>
    </Box>
  );
}
