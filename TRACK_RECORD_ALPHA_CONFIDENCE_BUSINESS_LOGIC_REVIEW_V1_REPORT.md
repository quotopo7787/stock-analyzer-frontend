# Track Record Alpha Confidence Business Logic Review V1 — Report

## Summary

Deep review of the business logic behind Track Record, Alpha Performance, Evaluation, and Confidence labeling. The logic is conservative and structurally correct: open signals are excluded from performance metrics, horizons are separated, alpha calculation follows standard formula, and maturity guards prevent premature evaluation. Several statistical limitations exist that are documented below. Verdict: **PASS_WITH_LIMITATIONS**.

## Business Logic Flow

```
Signal Capture → paper_trading_signals (status=OPEN)
       ↓
  evaluateDueSignals() checks: signalDate + horizonDays <= today
       ↓
  If due: lookup exit price → calculate return → lookup benchmark → calculate alpha
       ↓
  paper_trading_evaluations (stockReturnPct, benchmarkReturnPct, excessReturnPct)
       ↓
  Performance aggregation: getAlphaRecords() joins evals with signals
       ↓
  Frontend display: alpha, win rate, confidence label
```

## Tables/Entities Inspected

| Entity | Table | Purpose |
|--------|-------|---------|
| PaperTradingSignal | paper_trading_signals | Captured signals with entry price, decision, score |
| PaperTradingEvaluation | paper_trading_evaluations | Matured evaluations with return, benchmark, alpha |
| PaperTradingJobRun | paper_trading_job_runs | Job execution history |

## Services Inspected

| Service | File | Role |
|---------|------|------|
| PaperTradingSignalService | PaperTradingSignalService.java | Capture + evaluate logic |
| PaperTradingPerformanceService | PaperTradingPerformanceService.java | Alpha aggregation, confidence, grouping |
| BenchmarkEngine | BenchmarkEngine.java | Benchmark return + alpha calculation |
| TrackRecordQualityService | TrackRecordQualityService.java | Quality grade, readiness assessment |
| DailyMonitoringService | DailyMonitoringService.java | Daily health check |

## Endpoints Inspected

| Endpoint | Service method |
|----------|---------------|
| GET /performance/alpha/overview | getAlphaOverview() |
| GET /performance/alpha/by-decision | getAlphaByDecision() |
| GET /performance/alpha/top-winners | getTopAlpha(descending=true) |
| GET /performance/alpha/top-losers | getTopAlpha(descending=false) |
| GET /monitoring/daily | getDailyStatus() |
| GET /track-record/quality | getQuality() |
| GET /scheduler/status | getStatus() |
| GET /jobs/daily-summary | getDailySummary() |

## Evaluation Maturity Rules — ✅ CORRECT

**Maturity guard** (PaperTradingSignalService:170-171):
```java
LocalDate dueDate = signal.getSignalDate().plusDays(horizon);
if (dueDate.isAfter(today)) continue;
```
- Signal is only evaluated when `signalDate + horizonDays <= today`
- Duplicate guard: checks `findBySignalIdAndHorizonDays` before creating
- Only OPEN signals are evaluated: `signalRepository.findByStatus("OPEN")`
- Horizons 7, 30, 90 are evaluated independently

**Open signal exclusion** — ✅ CORRECT:
- `getAlphaRecords()` starts from `evaluationRepository.findAll()` and joins to signals
- Only signals with evaluations appear in alpha metrics
- Open signals without evaluations are naturally excluded

## Alpha Calculation Formula — ✅ CORRECT

**Signal return** (PaperTradingSignalService:204-207):
```
signalReturn = (exitPrice - entryPrice) / entryPrice × 100
```

**Benchmark return** (BenchmarkEngine:38-41):
```
benchmarkReturn = (benchmarkExitPrice - benchmarkEntryPrice) / benchmarkEntryPrice × 100
```

**Alpha** (BenchmarkEngine:42-43):
```
alpha = signalReturn - benchmarkReturn
```

- Uses VNINDEX as default benchmark
- Benchmark prices looked up via BenchmarkPriceProvider for signal date → evaluation date
- If benchmark price missing: alpha is null, evaluation marked `NOT_ENOUGH_DATA`
- Missing benchmark tracked separately: `missingBenchmarkCount` in aggregation

**Limitations documented:**
- No fees, slippage, or transaction costs
- No liquidity adjustment
- Exit price is current market price at evaluation time, not exact N-day close

## Decision/Group Aggregation Logic — ✅ CORRECT

**`getAlphaByDecision()`** (line 287-289):
- Groups AlphaRecords by `signal.getDecision()` (actual DB field, not display label)
- Count is based on evaluation records only (AlphaRecords require an evaluation)
- Aggregation uses `buildAlphaAggregation()` which computes: count, evaluationCount, benchmarkedCount, averageAlpha, medianAlpha, positiveAlphaRate, bestAlpha, worstAlpha, stdDev

**Sample size** — `count` field = number of AlphaRecords (evaluations with matching signals). Correctly excludes unevaluated signals.

## Confidence Label Logic — ⚠️ INCONSISTENCY FOUND

**Two different confidence label systems exist:**

| Service | <20 | 20-79 | 80-99 | 100-299 | ≥300 |
|---------|-----|-------|-------|---------|------|
| PaperTradingPerformanceService (alpha overview) | TOO_SMALL | LOW_SAMPLE | LOW_SAMPLE | MEDIUM_SAMPLE | HIGH_SAMPLE |
| TrackRecordQualityService (quality report) | TOO_SMALL | LOW | LOW | MEDIUM | HIGH |

**Differences:**
1. Threshold at 80 vs 100 for the second tier
2. Label names differ: `LOW_SAMPLE` vs `LOW`, `MEDIUM_SAMPLE` vs `MEDIUM`
3. Performance service uses alpha record count (evaluations with alpha); Quality service uses 7D evaluation count

**Risk:** Not a material defect because they serve different endpoints and the dashboard uses the Performance service label. But the inconsistency could confuse developers.

**Confidence is based on sample size only** — no variance, consistency, or outlier check. This is acceptable for the current stage (EARLY grade, 25 evaluations) but should be improved before reaching STATISTICALLY_USEFUL.

## Statistical Limitations

| # | Limitation | Severity | Impact |
|---|-----------|----------|--------|
| 1 | **Confidence based only on sample size**, not on variance or consistency | P1 | Could label HIGH_SAMPLE even if alpha is driven by one outlier |
| 2 | **Population std dev used** (divides by N, not N-1) | P2 | Underestimates variance for small samples; minor at N=25 |
| 3 | **No outlier detection** — one extreme alpha could skew average | P1 | bestAlpha=2.28, worstAlpha=-5.21 shows 2.4x asymmetry |
| 4 | **No confidence interval** — no error bars on alpha estimate | P2 | Users can't tell if alpha=-2.7% is statistically different from 0 |
| 5 | **Equity curve uses latest horizon** per signal, mixing 7D/30D/90D | P2 | Cumulative return curve not meaningful until horizons separate |
| 6 | **No Sharpe ratio or information ratio** | P2 | No risk-adjusted return metric |
| 7 | **No market regime control** — all periods treated equally | P2 | Alpha in bull market ≠ alpha in bear market |
| 8 | **Missing: open signals count** in alpha overview | P2 | Users can't see how many signals are still waiting for evaluation |
| 9 | **No fees/slippage/liquidity** adjustment | P1 | Real-world returns would be lower than paper trading returns |

## Metrics Already Present (Positive Findings)

The backend already computes these correctly:
- ✅ Average alpha
- ✅ Median alpha
- ✅ Standard deviation
- ✅ Positive alpha rate (win rate vs benchmark)
- ✅ Best/worst alpha
- ✅ Missing benchmark count
- ✅ Evaluation count per horizon
- ✅ Score bucket breakdown
- ✅ Source type breakdown (LIVE vs BACKTEST_IMPORT)
- ✅ Max drawdown (in analytics overview)

## Risks of Misleading Interpretation

| Risk | Status | Mitigation |
|------|--------|------------|
| User reads alpha as investment recommendation | ✅ Mitigated | Disclaimer present: "Đây là tín hiệu mô phỏng — Không phải khuyến nghị đầu tư." |
| LOW_SAMPLE shown but not explained in context | ⚠️ Partial | Frontend shows label but no tooltip explaining what it means |
| Negative alpha warning | ✅ Correct | "Alpha âm nghĩa là tín hiệu đang kém VNINDEX trong mẫu hiện tại." |
| BACKTEST_IMPORT mixed with LIVE | ⚠️ Acceptable | sourceType filter available (default ALL), but dashboard shows ALL by default |
| User thinks scheduler=off means no data | ✅ Mitigated | Frontend now shows: "Scheduler hiện tại đang tắt, nhưng lịch sử job đã chạy vẫn được lưu trong DB." |
| Small sample looks authoritative | ⚠️ Partial | Alpha interpretation notes say "Sample size too small; do not recalibrate Decision Engine yet." but this is in backend response, not prominently shown on dashboard |

## Recommended Improvements by Priority

### P0 — Must fix before relying on track record
*None found.* The logic is correct for paper trading validation. No open signals leak into evaluated metrics. Alpha formula is standard. Maturity guard works.

### P1 — Should fix soon
1. **Harmonize confidence label thresholds** between PaperTradingPerformanceService and TrackRecordQualityService (use same thresholds and label names)
2. **Add variance/consistency to confidence** — e.g., if stdDev > |averageAlpha|, downgrade confidence one tier
3. **Add outlier flag** — warn if removing top/bottom 1 record changes alpha sign
4. **Document fees/slippage limitation** more prominently in frontend

### P2 — Nice to have
5. Add confidence interval (mean ± 2×stdDev/√n) to alpha overview
6. Add open signals count to alpha overview response
7. Add sample std dev (N-1) option alongside population std dev
8. Separate LIVE vs BACKTEST alpha by default on dashboard
9. Add Sharpe-like risk-adjusted metric

## Tests / Build Results

| Check | Result |
|-------|--------|
| Backend tests (mvn test) | ✅ 236/236 PASS |
| Frontend build (npm run build) | ✅ PASS |
| BenchmarkEngineTest | ✅ 3/3 PASS |
| PaperTradingPerformanceTest | ✅ 30/30 PASS |
| TrackRecordQualityTest | ✅ 12/12 PASS |
| DailyMonitoringTest | ✅ 10/10 PASS |
| PaperTradingJobHistoryTest | ✅ 12/12 PASS |

## Changes Made

**None.** This is a read-only review. No backend, DB, frontend, or business logic was changed.

## Final Verdict

### **PASS_WITH_LIMITATIONS**

**Rationale:**
- ✅ Open signals are correctly excluded from evaluated performance metrics
- ✅ Maturity guard prevents premature evaluation (signalDate + horizonDays ≤ today)
- ✅ Alpha formula is standard and correct (signalReturn − benchmarkReturn)
- ✅ Horizons 7D/30D/90D are handled separately
- ✅ Missing benchmark data tracked and excluded from alpha aggregation
- ✅ Confidence label exists and warns about small sample
- ✅ Disclaimer present and accurate
- ⚠️ Confidence based only on sample size, not variance/consistency
- ⚠️ Two inconsistent confidence label systems exist (different thresholds, different names)
- ⚠️ No fees/slippage adjustment (documented as paper trading limitation)
- ⚠️ Population std dev used instead of sample std dev (minor at current N)

The system is **usable for paper trading validation** at the current EARLY stage (49 signals, 25 evaluations). It should not be used for investment decisions. The P1 improvements should be addressed before the system reaches STATISTICALLY_USEFUL grade.
