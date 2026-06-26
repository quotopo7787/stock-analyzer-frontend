# Paper Trading Job History Persistence V1 — Report

## Tổng quan
Thêm bảng `paper_trading_job_runs` để lưu lịch sử mọi job capture/evaluate vào DB PostgreSQL. Dữ liệu không mất khi restart app. Frontend dashboard hiển thị "Nhật ký job gần nhất".

## Backend — Hoàn thành ✅

### Entity & Repository
- `PaperTradingJobRun.java` — JPA entity, 20+ columns, 4 indexes
- `PaperTradingJobRunRepository.java` — 8 query methods

### Service
- `PaperTradingJobHistoryService.java` — startJob(), completeCapture(), completeEvaluate(), failJob(), getDailySummary(), listJobs(), getLatest(), getLatestForDate(), toMap()
- Status values: STARTED, SUCCESS, FAILED, DRY_RUN, DUPLICATE_ONLY, NO_DUE_EVALUATIONS

### Integration
- `PaperTradingScheduler.java` — SCHEDULED jobs tự động ghi DB
- `AdminPaperTradingController.java` — MANUAL jobs ghi DB khi gọi API
- `DailyMonitoringService.java` — Ưu tiên đọc DB, fallback in-memory

### API Endpoints mới
| Endpoint | Method | Mô tả |
|---|---|---|
| `/api/admin/paper-trading/jobs` | GET | List jobs (filter: jobName, status, runType, fromDate, toDate, limit) |
| `/api/admin/paper-trading/jobs/latest` | GET | Latest job (filter: jobName, runDate) |
| `/api/admin/paper-trading/jobs/daily-summary` | GET | Tóm tắt job hôm nay |

### Tests
- `PaperTradingJobHistoryTest.java` — 12 tests
- `DailyMonitoringTest.java` — Updated cho job history injection
- **236/236 PASS**

## Frontend — Hoàn thành ✅

### Types
- `JobRunItem`, `JobDailySummaryResponse` — `src/types/paperTrading.ts`

### API
- `getJobsDailySummary()` — `src/api/paperTradingApi.ts`

### Dashboard
- Section "Nhật ký job gần nhất" trong `PaperTradingPage.tsx`
- Bảng: Job, Type, Started at, Status, Inserted, Duplicates, Evaluated, Failed, Duration
- Ghi chú: "Dữ liệu job được lưu DB, không mất khi restart app."
- Warnings hiển thị nếu thiếu capture/evaluate job

### Build
- `npm run build` — ✅ tsc + vite thành công

## Verification

### API Smoke Test ✅
```
GET /jobs?limit=3 → 200 (1 MANUAL_CAPTURE DRY_RUN record)
GET /jobs/latest?jobName=CAPTURE → 200 (found: false — chưa có SCHEDULED capture)
GET /jobs/daily-summary → 200 (totalJobs=1, captureLatest present, evaluateLatest null)
```

### Browser ✅
- `/paper-trading` hiển thị đầy đủ section "Nhật ký job gần nhất (2026-06-26)"
- Bảng job: MANUAL_CAPTURE | MANUAL | 23:25:40 | DRY_RUN | 0 | 20 | 0 | 0 | 0.5s
- Warning: "Chưa có evaluate job hôm nay"

### DB Table ✅
- `paper_trading_job_runs` — JPA ddl-auto=update tạo tự động
- 1 record: MANUAL_CAPTURE, DRY_RUN, durationMs=505

## Lưu ý bảo mật
- Không hardcode credentials
- Tín hiệu mô phỏng — Không phải khuyến nghị đầu tư
- Không auto trade, không đặt/sửa/hủy lệnh
