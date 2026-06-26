# Track Record Confidence Hardening V1 — Report

## Summary

Created shared `AlphaConfidencePolicy` class to harmonize confidence label thresholds across services, added variance/consistency downgrade rules, outlier warnings, and improved interpretation text. Frontend displays warnings in Vietnamese. Backend 250/250 tests PASS, frontend build PASS.

## Files Changed

### Backend (new)
- `service/AlphaConfidencePolicy.java` — Shared confidence policy with evaluate(), baseLabelByCount(), downgrade rules
- `test/AlphaConfidencePolicyTest.java` — 14 focused tests

### Backend (modified)
- `service/PaperTradingPerformanceService.java` — Uses AlphaConfidencePolicy.evaluate() instead of inline confidenceLabel(); improved buildAlphaInterpretation()
- `service/TrackRecordQualityService.java` — Uses AlphaConfidencePolicy.baseLabelByCount() instead of inline thresholds; updated switch labels

### Frontend (modified)
- `src/types/paperTrading.ts` — Added optional fields: alphaConfidenceBaseLabel, alphaConfidenceWarnings, alphaConfidenceDowngraded, alphaConfidenceDowngradeReasons
- `src/pages/PaperTradingPage.tsx` — Added confidenceWarningLabel map (Vietnamese), warning display, downgrade indicator on confidence chip

## Shared Confidence Policy

### Old vs New Thresholds

| Range | PaperTradingPerformanceService (old) | TrackRecordQualityService (old) | Shared policy (new) |
|-------|--------------------------------------|--------------------------------|---------------------|
| n < 20 | TOO_SMALL | TOO_SMALL | TOO_SMALL |
| 20 ≤ n < 80 | LOW_SAMPLE | LOW | LOW_SAMPLE |
| 80 ≤ n < 100 | LOW_SAMPLE | MEDIUM | LOW_SAMPLE |
| 100 ≤ n < 300 | MEDIUM_SAMPLE | MEDIUM | MEDIUM_SAMPLE |
| n ≥ 300 | HIGH_SAMPLE | HIGH | HIGH_SAMPLE |

Both services now use `AlphaConfidencePolicy.baseLabelByCount()` with identical thresholds.

## Variance Downgrade Rules

| Rule | Condition | Effect |
|------|-----------|--------|
| HIGH_VARIANCE | stdDev > abs(averageAlpha) × 2 | Downgrade one tier |
| MIXED_SIGNAL | averageAlpha and medianAlpha have different signs | Downgrade one tier |
| NEAR_RANDOM_WIN_RATE | positiveAlphaRate between 45% and 55% | Prevents HIGH_SAMPLE (downgrade to MEDIUM_SAMPLE) |

Downgrades stack: if both HIGH_VARIANCE and MIXED_SIGNAL trigger, confidence drops two tiers.

## Outlier Warning Rules

| Warning | Condition |
|---------|-----------|
| OUTLIER_RISK | max(bestAlpha, worstAlpha magnitude) / min > 3.0 |
| HIGH_VARIANCE | stdDev > abs(averageAlpha) × 2 |
| MIXED_SIGNAL | averageAlpha and medianAlpha disagree in sign |
| LOW_SAMPLE | count < 100 |
| PAPER_TRADING_LIMITATION | Always present |
| NEAR_RANDOM_WIN_RATE | positiveAlphaRate between 45-55% |

## API Response (New Fields)

```json
{
  "alphaConfidenceLabel": "LOW_SAMPLE",
  "alphaConfidenceBaseLabel": "LOW_SAMPLE",
  "alphaConfidenceWarnings": ["LOW_SAMPLE", "PAPER_TRADING_LIMITATION"],
  "alphaConfidenceDowngraded": false,
  "alphaConfidenceDowngradeReasons": []
}
```

All new fields are additive — existing `alphaConfidenceLabel` field preserved.

## Frontend Display

| Warning code | Vietnamese label |
|---|---|
| OUTLIER_RISK | Có rủi ro mẫu bị méo bởi điểm ngoại lai. |
| HIGH_VARIANCE | Alpha biến động lớn so với alpha trung bình. |
| MIXED_SIGNAL | Trung bình và trung vị alpha chưa đồng thuận. |
| LOW_SAMPLE | Số mẫu còn thấp, chưa nên kết luận mạnh. |
| PAPER_TRADING_LIMITATION | Chưa tính phí giao dịch, trượt giá và thanh khoản. |
| NEAR_RANDOM_WIN_RATE | Tỷ lệ thắng gần ngẫu nhiên (45-55%). |

Confidence chip shows warning color when downgraded, with "(hạ từ BASE_LABEL)" text.

## Tests Added/Updated

| Test class | Tests | Status |
|---|---|---|
| AlphaConfidencePolicyTest (NEW) | 14 tests | ✅ PASS |
| PaperTradingPerformanceTest (existing) | 30 tests | ✅ PASS (unchanged) |
| TrackRecordQualityTest (existing) | 12 tests | ✅ PASS (unchanged) |

### AlphaConfidencePolicyTest coverage:
- under20_alwaysTooSmall
- count20_lowSample, count100_mediumSample, count300_highSample
- highVariance_downgradesOneLevel
- signMismatch_downgradesOneLevel
- nearRandomWinRate_preventsHighSample
- outlierRisk_warningPresent, noOutlierRisk_whenBalanced
- paperTradingLimitation_alwaysPresent
- lowSampleWarning_whenUnder100
- multipleDowngrades_canStack
- nullMetrics_noDowngrade
- baseLabelByCount_consistent

## Build / Test Results

| Command | Result |
|---------|--------|
| mvn test | ✅ 250/250 PASS (was 236, +14 new) |
| npm run build | ✅ PASS |
| Browser /paper-trading | ✅ Warnings display in Vietnamese |

## Current Live Data Verification

With 25 evaluations (avgAlpha=-2.72, medianAlpha=-2.80, stdDev=1.45):
- Base label: LOW_SAMPLE (25 < 100)
- Effective label: LOW_SAMPLE (no downgrade — stdDev=1.45 < abs(-2.72)×2=5.44, same sign avg/median)
- Warnings: LOW_SAMPLE, PAPER_TRADING_LIMITATION
- No OUTLIER_RISK (best/worst ratio = 5.21/2.28 = 2.28 < 3.0)

## Remaining Limitations

| # | Limitation | Priority |
|---|-----------|----------|
| 1 | No confidence interval (mean ± 2×SE) | P2 |
| 2 | Population std dev (N) vs sample std dev (N-1) | P2 |
| 3 | No Sharpe/information ratio | P2 |
| 4 | No market regime control | P2 |

## What Was NOT Changed
- Signal capture logic: unchanged
- Evaluation maturity logic: unchanged
- Alpha formula: unchanged
- Database schema: unchanged
- Existing field bindings: unchanged

## Final Verdict

### **PASS**

- ✅ Confidence thresholds consistent across services (shared AlphaConfidencePolicy)
- ✅ Confidence no longer based only on sample size (variance, sign mismatch, win rate rules)
- ✅ High variance or inconsistent alpha can reduce confidence
- ✅ Warnings/interpretation explain limitations clearly (Vietnamese labels)
- ✅ Alpha formula and maturity guard unchanged
- ✅ Backend tests pass: 250/250
- ✅ Frontend build passes
- ✅ Backward compatible (new fields optional)
