# PORTFOLIO_TRANSACTION_LEDGER_ADMIN_UI_V1_REPORT

## Summary

Implemented a frontend admin UI for Portfolio Transaction Ledger.

New page:

- `/portfolio-transactions`
- Menu label: `So giao dich`

The page lets users:

- View transaction summary.
- View/filter paginated transactions.
- Create BUY/SELL/DIVIDEND/CASH_IN/CASH_OUT/FEE/TAX.
- Edit transactions.
- Delete transactions.
- Rebuild cash ledger after transaction changes.

No position reconciliation, realized PnL, average-cost recalculation, or order placement was added.

Final verdict: **PASS**

## Files Changed

Frontend added:

- `src/api/portfolioTransactionApi.ts`
- `src/types/portfolioTransaction.ts`
- `src/pages/PortfolioTransactionLedgerPage.tsx`

Frontend updated:

- `src/App.tsx`
- `src/components/AppLayout.tsx`

Backend small fix:

- `src/main/java/com/example/stockanalyzer/repository/PortfolioCashLedgerRepository.java`
- `src/main/java/com/example/stockanalyzer/service/PortfolioTransactionService.java`
- `src/test/java/com/example/stockanalyzer/service/PortfolioTransactionServiceTest.java`

Backend fix reason:

- After cash ledger rebuild, generated cash entries reference `portfolio_transactions`.
- Deleting a transaction could fail because generated cash entries still held `source_transaction_id`.
- Delete now removes generated cash ledger entries for that transaction before deleting the transaction.
- Manual `ADJUSTMENT` entries are not touched.

## Route/Menu Added

Route:

- `/portfolio-transactions`

Menu:

- `So giao dich`

## API Client/Types

Added API methods:

- `getSummary()`
- `listTransactions({ stockCode, type, fromDate, toDate, page, size })`
- `getTransaction(id)`
- `createTransaction(payload)`
- `updateTransaction(id, payload)`
- `deleteTransaction(id)`

Added types:

- `PortfolioTransactionType`
- `PortfolioTransaction`
- `PortfolioTransactionPage`
- `PortfolioTransactionRequest`
- `PortfolioTransactionSummary`
- `PortfolioTransactionTypeSummary`
- `PortfolioTransactionListParams`

## UI Behavior

Summary cards:

- Tong mua
- Tong ban
- Co tuc
- Phi
- Thue
- Net cash flow
- So giao dich

Filters:

- Ma co phieu
- Loai giao dich
- Tu ngay
- Den ngay
- Reset

Create/edit dialog:

- Loai giao dich
- Ngay giao dich
- Ma co phieu
- So luong
- Gia
- Amount
- Fee
- Tax
- Ghi chu

Transaction table:

- Ngay
- Loai
- Ma
- So luong
- Gia
- Amount
- Fee
- Tax
- Ghi chu
- Sua/Xoa

Cash ledger reminder:

- After create/update/delete, UI shows:
  - `Giao dich da thay doi. Hay rebuild So tien mat de cap nhat cash ledger.`
- A `Rebuild So tien mat` button calls cash ledger rebuild API.

## Validation Behavior

Frontend validation:

- `transactionDate` required.
- `transactionType` required.
- BUY/SELL:
  - `stockCode` required.
  - `quantity > 0`.
  - `price > 0`.
  - `amount` may be blank so backend can calculate `quantity * price`.
- Non BUY/SELL:
  - `amount > 0`.
- `fee >= 0` if entered.
- `tax >= 0` if entered.
- Empty numeric strings are sent as `undefined`, not `0`.

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

Backend verification after small fix:

```bash
mvn -Dtest=PortfolioTransactionServiceTest test
mvn -Dtest=PortfolioCashLedgerServiceTest test
mvn test
```

Result:

- `PortfolioTransactionServiceTest`: PASS 8/8
- `PortfolioCashLedgerServiceTest`: PASS 9/9
- Full backend: PASS 282/282

## Browser/API Smoke

Browser smoke:

- Opened `http://127.0.0.1:5173/portfolio-transactions`
- Page loaded without visible error.
- Verified visible UI:
  - `So giao dich`
  - `Them giao dich`
  - `Rebuild So tien mat`
  - `Danh sach giao dich`

API smoke through Vite proxy:

- Created `CASH_IN`: PASS
- Created `BUY` with `stockCode=FPT`: PASS
- BUY amount auto-calculated by backend: PASS
- Updated CASH_IN amount: PASS
- Summary/list reloaded: PASS
- Rebuild cash ledger: PASS
- Deleted smoke transactions: PASS
- Rebuilt cash ledger after cleanup: PASS
- Remaining smoke transactions: 0

## Known Limitations

- No transaction ledger analytics beyond summary.
- No realized PnL.
- No average-cost recalculation.
- No position reconciliation.
- No auto rebuild after every transaction by design.
- No autocomplete for stock code yet.

## Next Recommended Task

Recommended next task:

`PORTFOLIO_POSITION_RECONCILIATION_PREVIEW_V1`

Suggested scope:

- Add report-only reconciliation between transaction ledger and current `portfolio_positions`.
- Show expected quantity/cost from transactions vs aggregate position.
- Do not mutate positions yet.
- Use this as a safety layer before any future automatic sync.
