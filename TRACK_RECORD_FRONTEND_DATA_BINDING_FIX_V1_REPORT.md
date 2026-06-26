# Track Record Frontend Data Binding Fix V1 — Report

## 1. Scope
- Frontend changed: `src/types/paperTrading.ts`, `src/pages/PaperTradingPage.tsx`
- Backend changed: None
- DB changed: None
- Business logic changed: None
- Trading endpoint used: None
- Auto trade enabled: No

## 2. Root cause

| Issue | Root cause | Fix |
|-------|------------|-----|
| Decision blank | Frontend used `row.decision`, backend returns `group` | Changed to `row.group` |
| Sample count blank/0 | Frontend used `row.sampleSize`, backend returns `count` | Changed to `row.count` |
| Stock code blank | Frontend used `r.stockCode`, backend returns `symbol` | Changed to `r.symbol` |
| Score blank | Frontend used `r.finalScore`, backend returns `score` | Changed to `r.score` |
| Alpha Mẫu = 0 | Frontend used `alpha.sampleSize`, backend returns `count`/`evaluationCount` | Changed to `alpha.evaluationCount ?? alpha.count` |
| Confidence "—" | Frontend used `alpha.confidenceLabel`, backend returns `alphaConfidenceLabel` | Changed to `alpha.alphaConfidenceLabel` |
| Scheduler mismatch | No explanation when scheduler off but job history exists | Added conditional message |

## 3. API field mapping

| Endpoint | UI field | Actual backend field | Final mapping |
|----------|----------|----------------------|---------------|
| alpha/overview | Mẫu | `evaluationCount` / `count` | `alpha.evaluationCount ?? alpha.count` |
| alpha/overview | Độ tin cậy | `alphaConfidenceLabel` | `alpha.alphaConfidenceLabel` |
| alpha/by-decision | Decision | `group` | `row.group` |
| alpha/by-decision | Số mẫu | `count` | `row.count` |
| alpha/top-winners | Mã | `symbol` | `r.symbol` |
| alpha/top-winners | Score | `score` | `r.score` |
| alpha/top-losers | Mã | `symbol` | `r.symbol` |
| alpha/top-losers | Score | `score` | `r.score` |

## 4. UI verification

| Section | Before | After |
|---------|--------|-------|
| Alpha theo Decision - Decision | Blank | REVIEW, WATCHLIST |
| Alpha theo Decision - Số mẫu | Blank | 19, 6 |
| Top Winners/Losers - Mã | Blank | NAB, DHN, HDB, SGC, GHC, NT2... |
| Top Winners/Losers - Score | "—" all rows | 7.5, 7.3, 7.9... |
| Alpha overview - Mẫu | 0 | 25 |
| Alpha overview - Độ tin cậy | "—" | LOW_SAMPLE |
| Scheduler section | Generic message | Context-aware: explains scheduler off + DB job history exists |
| Alpha notes | None | "Alpha chỉ tính trên tín hiệu đã đủ hạn đánh giá. 30D/90D sẽ xuất hiện sau khi tín hiệu đủ ngày." |

## 5. Job history compatibility

| Area | Status | Notes |
|------|--------|-------|
| jobs/daily-summary | ✅ Working | Returns 200, 1 job record |
| Nhật ký job đã lưu DB | ✅ Rendering | MANUAL_CAPTURE / MANUAL / DRY_RUN / 0.5s |
| scheduler/runtime explanation | ✅ Clear | "Scheduler hiện tại đang tắt, nhưng lịch sử job đã chạy vẫn được lưu trong DB." |

## 6. Build / tests

| Command | Result |
|---------|--------|
| npm run build (tsc + vite) | ✅ PASS |
| Browser /paper-trading | ✅ All sections render correctly |
| API calls | ✅ All 200 |

## 7. Caveats

| Severity | Caveat | Next action |
|----------|--------|-------------|
| LOW | Chunk > 500kB warning from Vite | Consider code-splitting in future polish |
| INFO | Alpha negative (-2.7241%) | Expected — sample size small, data collection ongoing |

## 8. Readiness

PAPER_TRADING_VALIDATION_READY

## 9. Conclusion
- PASS/FAIL: **PASS**
- Can lock Track Record Frontend Data Binding Fix V1: **Yes**
- Recommended next task: **Data Quality Audit V1**
