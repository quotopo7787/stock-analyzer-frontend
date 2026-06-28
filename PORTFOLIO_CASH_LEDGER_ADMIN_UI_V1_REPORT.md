# PORTFOLIO_CASH_LEDGER_ADMIN_UI_V1_REPORT

## Summary

Implemented a frontend admin UI for persisted portfolio cash ledger.

New page:

- `/portfolio-cash-ledger`
- Menu label: `Sổ tiền mặt`

The page lets users:

- View cash ledger summary.
- View paginated cash ledger entries.
- Filter by date/type.
- Create manual `ADJUSTMENT` entries.
- Rebuild generated cash entries from `portfolio_transactions`.

No backend changes were required. No transaction ledger UI, realized PnL, position reconciliation, or order placement was added.

Final verdict: **PASS**

## Files Changed

Added:

- `src/api/portfolioCashLedgerApi.ts`
- `src/types/portfolioCashLedger.ts`
- `src/pages/PortfolioCashLedgerPage.tsx`

Updated:

- `src/App.tsx`
- `src/components/AppLayout.tsx`

## Routes/Menu Added

Route:

- `/portfolio-cash-ledger`

Menu:

- `Sổ tiền mặt`

## API Client/Types

Added API methods:

- `getSummary()`
- `listEntries({ fromDate, toDate, type, page, size })`
- `createAdjustment({ entryDate, amount, direction, notes })`
- `deleteEntry(id)`
- `rebuildFromTransactions()`

Added types:

- `PortfolioCashDirection`
- `PortfolioCashEntryType`
- `PortfolioCashLedgerEntry`
- `PortfolioCashLedgerPage`
- `PortfolioCashLedgerSummary`
- `PortfolioCashLedgerTypeSummary`
- `PortfolioCashRebuildResponse`
- `PortfolioCashLedgerAdjustmentRequest`
- `PortfolioCashLedgerListParams`

## UI Behavior

Summary cards:

- Số dư tiền mặt
- Tổng tiền vào
- Tổng tiền ra
- Số entry
- Entry gần nhất

Adjustment form:

- Ngày
- Chiều tiền: `Tiền vào` / `Tiền ra`
- Số tiền
- Ghi chú
- Button: `Thêm điều chỉnh`

Entry table:

- Ngày
- Loại entry
- Chiều tiền
- Số tiền
- Ghi chú
- Nguồn transaction
- Hành động xóa

Generated entries:

- If `sourceTransactionId != null`, delete is disabled.
- User should modify transaction source and rebuild instead.

Manual adjustment entries:

- Delete is allowed with confirmation.

Rebuild:

- Button: `Rebuild từ giao dịch`
- Uses `window.confirm`.
- Calls `/api/portfolio-cash-ledger/rebuild-from-transactions`.
- Reloads summary/list after completion.
- Shows created/deleted/preserved counts.

## Build/Lint Results

```bash
npm.cmd run build
```

Result:

- PASS
- TypeScript build PASS
- Vite production build PASS

```bash
npm.cmd run lint
```

Result:

- PASS

## Browser/API Smoke

Browser smoke:

- Opened `http://127.0.0.1:5173/portfolio-cash-ledger`
- Page loaded without visible error.
- Verified visible UI:
  - `Sổ tiền mặt`
  - `Thêm điều chỉnh`
  - `Rebuild từ giao dịch`
  - `Dòng tiền`

API smoke through Vite proxy:

- `GET /api/portfolio-cash-ledger/summary`: PASS
- `GET /api/portfolio-cash-ledger?page=0&size=5`: PASS
- `POST /api/portfolio-cash-ledger/adjustment`: PASS
  - Created `ADJUSTMENT` / `INFLOW`
- `POST /api/portfolio-cash-ledger/rebuild-from-transactions`: PASS
- `DELETE /api/portfolio-cash-ledger/{id}`: PASS
  - Cleanup deleted the smoke adjustment.
- Final summary/list returned clean state after cleanup.

## Known Limitations

- No transaction ledger management UI in this task.
- No realized PnL.
- No average-cost recalculation.
- No position reconciliation.
- Rebuild is manual.
- Generated entries cannot be deleted directly in UI by design.

## Next Recommended Task

Recommended next task:

`PORTFOLIO_TRANSACTION_LEDGER_ADMIN_UI_V1`

Suggested scope:

- Add UI to view/create/edit/delete `portfolio_transactions`.
- Keep rebuild cash ledger as explicit action.
- Do not mutate `portfolio_positions` yet.
- Prepare for later reconciliation/report-only flow.

