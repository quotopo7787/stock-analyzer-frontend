import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { Link, Outlet, useLocation } from "react-router-dom";

const navItems = [
  { label: "Tổng quan", to: "/" },
  { label: "Cổ phiếu", to: "/stocks" },
  { label: "Nhập BCTC", to: "/financial-statements/new" },
  { label: "Xếp hạng", to: "/rankings" },
  { label: "Cơ hội", to: "/opportunities" },
  { label: "Lịch sử hồ sơ", to: "/investment-thesis" },
  { label: "Dữ liệu", to: "/data-quality" },
  { label: "Watchlist", to: "/watchlist" },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Stock Analyzer
          </Typography>

          {navItems.map((item) => {
            const active = item.to === "/" ? location.pathname === item.to : location.pathname.startsWith(item.to);

            return (
              <Button
                key={item.to}
                color="inherit"
                component={Link}
                to={item.to}
                sx={{
                  mx: 0.25,
                  bgcolor: active ? "rgba(255,255,255,0.18)" : "transparent",
                  border: "1px solid",
                  borderColor: active ? "rgba(255,255,255,0.34)" : "transparent",
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4, mb: 4 }} maxWidth="xl">
        <Outlet />
      </Container>
    </Box>
  );
}
