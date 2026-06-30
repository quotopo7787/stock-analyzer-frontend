import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.FRONTEND_SMOKE_BASE_URL ?? "http://127.0.0.1:5173";
const ARTIFACT_DIR = process.env.FRONTEND_SMOKE_ARTIFACT_DIR ?? path.resolve("smoke-artifacts", "frontend");
const RAW_INVALID_PATTERN = /\b(undefined|null|NaN)\b/i;
const MOJIBAKE_PATTERN = /Ã|Ä|áº|á»|Â|â€”|â€“|â€™|â€œ|â€/;

const apiChecks = [
  { name: "Dashboard", path: "/api/dashboard" },
  { name: "Opportunities", path: "/api/opportunities" },
  { name: "Portfolio summary", path: "/api/portfolio/summary" },
  { name: "Portfolio allocation summary", path: "/api/portfolio-allocation/summary" },
  { name: "Paper trading daily", path: "/api/admin/paper-trading/monitoring/daily" },
  { name: "Paper trading alpha overview", path: "/api/admin/paper-trading/performance/alpha/overview" },
  { name: "Backtest list", path: "/api/admin/paper-trading/backtests" },
  { name: "Latest macro regime", path: "/api/admin/macro-regimes/latest" },
  { name: "Market news context", path: "/api/news-signals/context/market" },
];

const routeChecks = [
  {
    name: "Dashboard",
    path: "/",
    selectors: ["text=Workspace"],
  },
  {
    name: "Opportunities",
    path: "/opportunities",
    selectors: ["text=Cơ hội đầu tư", "text=Danh sách mã"],
    afterLoad: checkOpportunityDetailModal,
  },
  {
    name: "Portfolio",
    path: "/portfolio",
    selectors: ["text=/Danh mục|Portfolio|Vị thế|Tổng quan/i"],
  },
  {
    name: "Portfolio Allocation",
    path: "/portfolio-allocation",
    selectors: ["text=/Phân bổ|Nguồn tiền mặt|Danh mục|Allocation/i"],
  },
  {
    name: "Paper Trading",
    path: "/paper-trading",
    selectors: [
      "text=Theo dõi Paper Trading",
      "text=Đây là tín hiệu mô phỏng",
      "text=Không phải khuyến nghị đầu tư",
    ],
  },
  {
    name: "Backtest",
    path: "/backtest",
    selectors: [
      "text=Backtest tín hiệu",
      "text=Không phải khuyến nghị đầu tư",
    ],
  },
  {
    name: "Macro Context",
    path: "/macro-context",
    selectors: ["text=Bối cảnh vĩ mô", "text=/Lãi suất|Chỉ số vĩ mô|World Bank/i"],
    failOnMojibake: true,
  },
  {
    name: "News Signals",
    path: "/news-signals",
    selectors: ["text=Tín hiệu tin tức", "text=/Thị trường|Ngữ cảnh|Tin tức/i"],
  },
];

function absoluteUrl(pathname) {
  return new URL(pathname, BASE_URL).toString();
}

async function ensureDir() {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
}

async function apiSmoke() {
  const results = [];
  for (const check of apiChecks) {
    const url = absoluteUrl(check.path);
    const started = Date.now();
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      const elapsedMs = Date.now() - started;
      results.push({
        ...check,
        url,
        status: response.status,
        ok: response.ok,
        elapsedMs,
      });
    } catch (error) {
      results.push({
        ...check,
        url,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return results;
}

function isIgnoredConsoleMessage(message) {
  const text = message.text();
  return (
    text.includes("Download the React DevTools") ||
    text.includes("MUI: The `anchorEl` prop")
  );
}

function isIgnoredRequestFailure(request) {
  const url = request.url();
  const failure = request.failure()?.errorText ?? "";
  return (
    failure.includes("net::ERR_ABORTED") ||
    url.includes("/api/notifications/subscribe") ||
    url.includes("favicon") ||
    url.startsWith("chrome-extension://")
  );
}

async function visibleText(page) {
  return page.locator("body").innerText({ timeout: 5_000 }).catch(() => "");
}

async function assertNoRawInvalidText(page, routeName) {
  const text = await visibleText(page);
  const match = text.match(RAW_INVALID_PATTERN);
  if (match) {
    throw new Error(`${routeName}: visible raw invalid value "${match[0]}" found`);
  }
}

async function assertNoMojibake(page, routeName) {
  const text = await visibleText(page);
  const match = text.match(MOJIBAKE_PATTERN);
  if (match) {
    throw new Error(`${routeName}: possible mojibake "${match[0]}" found`);
  }
}

async function waitForAnySelector(page, selectors, routeName) {
  const errors = [];
  for (const selector of selectors) {
    try {
      await page.locator(selector).first().waitFor({ state: "visible", timeout: 8_000 });
      return selector;
    } catch (error) {
      errors.push(`${selector}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`${routeName}: none of expected selectors became visible: ${selectors.join(", ")}`);
}

async function checkOpportunityDetailModal(page, result) {
  const detailButtons = page.locator('button[aria-label^="Xem chi tiết"]');
  const count = await detailButtons.count();
  if (count === 0) {
    result.modal = {
      status: "SKIPPED",
      reason: "No opportunity detail button found. Dataset may be empty or page is in empty/error state.",
    };
    return;
  }

  await detailButtons.first().click();
  const dialog = page.locator('[role="dialog"]').first();
  await dialog.waitFor({ state: "visible", timeout: 12_000 });
  await waitForAnySelector(page, ["text=Alpha snapshot", "text=Biểu đồ giá", "text=Luận điểm chính"], "Opportunity detail modal");
  await assertNoRawInvalidText(page, "Opportunity detail modal");
  result.modal = { status: "PASS" };

  const closeButton = page.locator('button[aria-label="Đóng"]').first();
  if (await closeButton.count()) {
    await closeButton.click();
  }
}

async function routeSmoke(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];

  page.on("console", (message) => {
    if (message.type() === "error" && !isIgnoredConsoleMessage(message)) {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    if (!isIgnoredRequestFailure(request)) {
      requestFailures.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText ?? "unknown",
      });
    }
  });

  const results = [];
  for (const check of routeChecks) {
    const result = {
      name: check.name,
      path: check.path,
      url: absoluteUrl(check.path),
      ok: false,
      matchedSelector: null,
      screenshot: null,
      modal: null,
      error: null,
    };

    const beforeConsole = consoleErrors.length;
    const beforePageErrors = pageErrors.length;
    const beforeRequestFailures = requestFailures.length;

    try {
      await page.goto(result.url, { waitUntil: "domcontentloaded", timeout: 25_000 });
      await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
      result.matchedSelector = await waitForAnySelector(page, check.selectors, check.name);
      await assertNoRawInvalidText(page, check.name);
      if (check.failOnMojibake) {
        await assertNoMojibake(page, check.name);
      }
      if (check.afterLoad) {
        await check.afterLoad(page, result);
      }

      const newConsoleErrors = consoleErrors.slice(beforeConsole);
      const newPageErrors = pageErrors.slice(beforePageErrors);
      const newRequestFailures = requestFailures.slice(beforeRequestFailures);
      if (newConsoleErrors.length || newPageErrors.length || newRequestFailures.length) {
        throw new Error(JSON.stringify({ consoleErrors: newConsoleErrors, pageErrors: newPageErrors, requestFailures: newRequestFailures }, null, 2));
      }

      result.ok = true;
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      const fileName = `${check.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "route"}.png`;
      result.screenshot = path.join(ARTIFACT_DIR, fileName);
      await page.screenshot({ path: result.screenshot, fullPage: true }).catch(() => {});
    }
    results.push(result);
  }

  await context.close();
  return results;
}

async function main() {
  await ensureDir();
  const startedAt = new Date().toISOString();

  const health = await fetch(BASE_URL, { signal: AbortSignal.timeout(10_000) })
    .then((response) => ({ ok: response.ok, status: response.status }))
    .catch((error) => ({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  if (!health.ok) {
    throw new Error(`Frontend is not reachable at ${BASE_URL}. Start Vite/backend first. Details: ${JSON.stringify(health)}`);
  }

  const apiResults = await apiSmoke();
  const browser = await chromium.launch({ headless: true });
  const routeResults = await routeSmoke(browser);
  await browser.close();

  const finishedAt = new Date().toISOString();
  const apiFailures = apiResults.filter((result) => !result.ok);
  const routeFailures = routeResults.filter((result) => !result.ok);
  const summary = {
    startedAt,
    finishedAt,
    baseUrl: BASE_URL,
    artifactDir: ARTIFACT_DIR,
    api: {
      total: apiResults.length,
      passed: apiResults.length - apiFailures.length,
      failed: apiFailures.length,
    },
    routes: {
      total: routeResults.length,
      passed: routeResults.length - routeFailures.length,
      failed: routeFailures.length,
    },
    apiResults,
    routeResults,
  };

  const jsonPath = path.join(ARTIFACT_DIR, "frontend-regression-smoke-results.json");
  await fs.writeFile(jsonPath, JSON.stringify(summary, null, 2), "utf8");

  console.log(JSON.stringify({
    baseUrl: BASE_URL,
    artifactDir: ARTIFACT_DIR,
    api: summary.api,
    routes: summary.routes,
    resultFile: jsonPath,
  }, null, 2));

  if (apiFailures.length || routeFailures.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
