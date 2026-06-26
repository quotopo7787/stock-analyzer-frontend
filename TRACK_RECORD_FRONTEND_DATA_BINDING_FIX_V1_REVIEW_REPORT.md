# Track Record Frontend Data Binding Fix V1 — Post-Fix Review Report

## Summary

Post-fix review of the Track Record dashboard frontend after correcting TypeScript interface field names to match backend API contract. All frontend types now align with actual backend JSON responses. No stale field names remain in paper trading code. No backend, DB, or business logic was changed.

## Files inspected

| File | Purpose |
|------|---------|
| `src/types/paperTrading.ts` | TypeScript interfaces for all paper trading API responses |
| `src/api/paperTradingApi.ts` | API client methods |
| `src/pages/PaperTradingPage.tsx` | Dashboard rendering |
| `src/components/AppLayout.tsx` | Sidebar nav (Paper Trading link) |
| `src/App.tsx` | Route definition |
| Backend: `AdminPaperTradingController.java` | Endpoint definitions (read-only inspection) |
| Backend: `PaperTradingPerformanceService.java` | Response shape source (read-only inspection) |
| Backend: `DailyMonitoringService.java` | Monitoring response shape (read-only inspection) |
| Backend: `PaperTradingJobHistoryService.java` | Job summary response shape (read-only inspection) |
| Backend: `PaperTradingScheduler.java` | Scheduler status response shape (read-only inspection) |

## Fields verified

| Endpoint | Frontend type | Field | Backend field | Match |
|----------|--------------|-------|---------------|-------|
| alpha/overview | AlphaOverviewResponse | group | group | ✅ |
| alpha/overview | AlphaOverviewResponse | count | count | ✅ |
| alpha/overview | AlphaOverviewResponse | evaluationCount | evaluationCount | ✅ |
| alpha/overview | AlphaOverviewResponse | alphaConfidenceLabel | alphaConfidenceLabel | ✅ |
| alpha/overview | AlphaOverviewResponse | interpretation | interpretation | ✅ |
| alpha/by-decision | AlphaByDecisionItem | group | group | ✅ |
| alpha/by-decision | AlphaByDecisionItem | count | count | ✅ |
| alpha/top-winners | AlphaTopItem | symbol | symbol | ✅ |
| alpha/top-winners | AlphaTopItem | decision | decision | ✅ |
| alpha/top-winners | AlphaTopItem | score | score | ✅ |
| alpha/top-losers | AlphaTopItem | symbol | symbol | ✅ |
| alpha/top-losers | AlphaTopItem | score | score | ✅ |
| monitoring/daily | DailyMonitoringResponse | all nested fields | all nested fields | ✅ |
| monitoring/daily/check | DailyCheckResponse | all fields | all fields | ✅ |
| scheduler/status | SchedulerStatusResponse | all fields + index sig | all fields | ✅ |
| jobs/daily-summary | JobDailySummaryResponse | all fields | all fields | ✅ |
| jobs/daily-summary | JobRunItem (nested) | all fields | all fields | ✅ |

## Stale fields found and removed

None remaining. Grep for `sampleSize`, `finalScore`, `confidenceLabel`, `stockCode` in paper trading files returned zero matches. Occurrences of these names in other modules (dashboard.ts, opportunities, watchlist, valuation) are correct for their own backend contracts — unrelated to paper trading.

## Build / test results

| Check | Result |
|-------|--------|
| `npm run build` (tsc + vite) | ✅ PASS — 0 TypeScript errors, 0 build errors |
| Stale field grep (paper trading scope) | ✅ 0 matches |
| Frontend test suite | N/A — no test infrastructure exists |
| `any` type suppression | None used |
| Type weakening | None applied |

## Browser verification (manual)

Verified on dev server at `http://localhost:3002/#/paper-trading`:

| Section | Check | Result |
|---------|-------|--------|
| Alpha theo Decision | Decision column | REVIEW, WATCHLIST visible ✅ |
| Alpha theo Decision | Số mẫu column | 19, 6 visible ✅ |
| Top Alpha Winners | Mã column | NAB, DHN, HDB, SGC, GHC visible ✅ |
| Top Alpha Winners | Score column | 7.5, 7.3, 7.9 etc. visible ✅ |
| Top Alpha Losers | Mã column | NT2, DBC, QTP, MBB, SGC visible ✅ |
| Top Alpha Losers | Score column | 7.4, 7.4, 7.3, 7.3, 8.4 visible ✅ |
| Alpha overview | Mẫu | 25 (correct, not 0) ✅ |
| Alpha overview | Độ tin cậy | LOW_SAMPLE visible ✅ |
| Alpha overview | Alpha note | "Alpha chỉ tính trên tín hiệu đã đủ hạn đánh giá. 30D/90D sẽ xuất hiện sau khi tín hiệu đủ ngày." ✅ |
| Negative alpha warning | Visible | "Alpha âm nghĩa là tín hiệu đang kém VNINDEX trong mẫu hiện tại." ✅ |
| Scheduler section | Title | "Trạng thái scheduler hiện tại" ✅ |
| Scheduler section | Context message | "Scheduler hiện tại đang tắt, nhưng lịch sử job đã chạy vẫn được lưu trong DB." ✅ |
| Job history section | Title | "Nhật ký job đã lưu DB (2026-06-26)" ✅ |
| Job history section | Data | MANUAL_CAPTURE / MANUAL / DRY_RUN / 0.5s ✅ |
| Job history section | Warning | "Chưa có evaluate job hôm nay" ✅ |
| Disclaimer | Visible | "Đây là tín hiệu mô phỏng — Không phải khuyến nghị đầu tư." ✅ |

## Null/empty state handling

| Scenario | Handling | Status |
|----------|----------|--------|
| No evaluated signals | `fmt()` returns "—" for null values | ✅ |
| Empty top winners/losers | "Chưa có dữ liệu" message | ✅ |
| Alpha overview missing | Section not rendered (`{alpha && (...)}`) | ✅ |
| Job summary unavailable | `.catch(() => null)` + conditional render | ✅ |
| Duration null | Shows "—" via null check | ✅ |
| No raw undefined/NaN | All numeric displays guarded by `fmt()` or null checks | ✅ |

## Manual verification steps (for future regression)

1. Start backend on port 8080, frontend dev server on port 3002
2. Navigate to `http://localhost:3002/#/paper-trading`
3. Verify Alpha theo Decision table: Decision column shows REVIEW/WATCHLIST, Số mẫu shows numbers
4. Verify Top Alpha Winners/Losers: Mã column shows stock symbols, Score shows numbers
5. Verify Alpha overview: Mẫu shows evaluated count (not 0), Độ tin cậy shows label
6. Verify Scheduler section title: "Trạng thái scheduler hiện tại"
7. Verify Job history section title: "Nhật ký job đã lưu DB"
8. Verify no blank/undefined/NaN values in any table cell
9. Run `npm run build` — must pass with 0 TypeScript errors

## Remaining risks

| Severity | Risk | Mitigation |
|----------|------|------------|
| LOW | No automated frontend tests | Manual verification steps documented above |
| LOW | SchedulerStatusResponse uses `[key: string]: unknown` index signature | Acceptable — backend may add fields, frontend uses only known ones |
| NONE | Backend/DB/business logic change risk | No backend changes made in this review |

## Final verdict

**PASS**

- Frontend types match backend JSON: ✅
- Dashboard renders correct data: ✅
- No stale field names remain: ✅
- Build passes: ✅
- Scheduler status and job history clearly separated: ✅
- No backend/DB/business logic changed: ✅
