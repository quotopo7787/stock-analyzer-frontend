import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1677ee", dark: "#0f5fc4" },
    success: { main: "#17974c" },
    warning: { main: "#f97316" },
    error: { main: "#e5484d" },
    background: { default: "#f5f8fc", paper: "#ffffff" },
    text: { primary: "#14213d", secondary: "#68758a" },
    divider: "#e4eaf2",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, "Segoe UI", Roboto, Arial, sans-serif',
    h4: { fontWeight: 750, letterSpacing: "-0.025em" },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 650, textTransform: "none" },
  },
  components: {
    MuiCard: { styleOverrides: { root: { border: "1px solid #e4eaf2", boxShadow: "0 4px 14px rgba(31, 50, 81, 0.06)" } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 8 } } },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
