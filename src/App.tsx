import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import StockListPage from "./pages/StockListPage";
import StockDetailPage from "./pages/StockDetailPage";
import FinancialStatementFormPage from "./pages/FinancialStatementFormPage";
import RankingPage from "./pages/RankingPage";
import OpportunitiesPage from "./pages/OpportunitiesPage";
import InvestmentThesisPage from "./pages/InvestmentThesisPage";
import ResearchThesisFormPage from "./pages/ResearchThesisFormPage";
import WatchlistPage from "./pages/WatchlistPage";
import DataQualityPage from "./pages/DataQualityPage";
import DataStatusPage from "./pages/DataStatusPage";
import AdminDataGapsPage from "./pages/AdminDataGapsPage";
import DecisionPlansPage from "./pages/DecisionPlansPage";
import PortfolioPage from "./pages/PortfolioPage";
import ValuationScenariosPage from "./pages/ValuationScenariosPage";

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
          <Route path="opportunities" element={<OpportunitiesPage />} />
          <Route path="watchlist" element={<WatchlistPage />} />
          <Route path="investment-thesis/new" element={<ResearchThesisFormPage />} />
          <Route path="investment-thesis" element={<InvestmentThesisPage />} />
          <Route path="data-quality" element={<DataQualityPage />} />
          <Route path="admin/data-status" element={<DataStatusPage />} />
          <Route path="admin/data-gaps" element={<AdminDataGapsPage />} />
          <Route path="decision-plans" element={<DecisionPlansPage />} />
          <Route path="valuation-scenarios" element={<ValuationScenariosPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
