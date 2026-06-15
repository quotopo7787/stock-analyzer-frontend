import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import StockListPage from "./pages/StockListPage";
import StockDetailPage from "./pages/StockDetailPage";
import FinancialStatementFormPage from "./pages/FinancialStatementFormPage";
import RankingPage from "./pages/RankingPage";
import InvestmentThesisPage from "./pages/InvestmentThesisPage";
import WatchlistPage from "./pages/WatchlistPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />

          <Route path="stocks" element={<StockListPage />} />
          <Route path="stocks/:code" element={<StockDetailPage />} />
          <Route path="financial-statements/new" element={<FinancialStatementFormPage />} />
          <Route path="rankings" element={<RankingPage />} />
          <Route path="watchlist" element={<WatchlistPage />} />
          <Route path="investment-thesis" element={<InvestmentThesisPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
