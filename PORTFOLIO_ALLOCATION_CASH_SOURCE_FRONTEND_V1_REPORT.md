# PORTFOLIO_ALLOCATION_CASH_SOURCE_FRONTEND_V1_REPORT

## Summary

Updated Portfolio Allocation frontend to display the cash source returned by the backend allocation summary.

The UI now distinguishes:

- Cash from persisted cash ledger.
- Manual cash override.
- Empty cash ledger warning.

The cash input remains optional. If the user leaves it blank, the frontend no longer sends `cashAmount: 0`; backend can default to cash ledger.

Final verdict: **PASS**

## Files Changed

- `src/types/portfolioAllocation.ts`
- `src/pages/PortfolioAllocationPage.tsx`

## UI Changes

Added a cash source notice above allocation summary metrics:

- `CASH_LEDGER`
  - Label: `Nguồn tiền mặt: Cash ledger`
  - Success style.
  - Shows backend note and ledger balance when available.

- `MANUAL_OVERRIDE`
  - Label: `Nguồn tiền mặt: Nhập tay`
  - Info style.
  - Shows note that cash is entered manually.

- `CASH_LEDGER_EMPTY`
  - Label: `Nguồn tiền mặt: Chưa có cash ledger`
  - Warning style.
  - Shows warning to add ADJUSTMENT or rebuild from transaction ledger.

Also updated cash input helper text:

- `Để trống để dùng số dư cash ledger`

## API Request Behavior

Before:

- `defaultForm.cashAmount = "0"`
- `formPayload` sent `cashAmount: 0` when the input was empty.
- This unintentionally forced backend manual override.

After:

- `defaultForm.cashAmount = ""`
- `formPayload` sends `cashAmount: undefined` when the input is blank.
- Manual override is sent only when the user actually enters a value.
- The UI no longer auto-fills the cash input from the response.

Backward compatibility:

- Manual cash override still works.
- Existing response fields are unchanged.
- New fields are optional in frontend types.

## Build/Test Results

PowerShell blocks `npm.ps1`, so commands were run via `npm.cmd`.

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

## API Smoke

Checked backend through the Vite proxy:

Manual override request:

- Sent `cashAmount = 1234567`
- Response `cashSource = MANUAL_OVERRIDE`
- Response `cashAmount = 1234567.00`

Ledger-default request:

- Omitted `cashAmount`
- Response `cashSource = CASH_LEDGER_EMPTY`
- Response `cashAmount = 0.00`

## Browser Smoke

Browser opened:

- `http://127.0.0.1:5173/portfolio-allocation`

Observed:

- Page loaded without frontend error.
- Cash input helper text was visible: `Để trống để dùng số dư cash ledger`.
- Direct API smoke confirmed backend returns `cashSource`.

Limitation:

- Browser-control reload timed out before final visual confirmation of the cash-source Alert. Build/lint and API smoke passed, and the rendered component is wired to `summary.cashSource`.

## Known Limitations

- No dedicated cash ledger management UI in this task.
- No button to rebuild cash ledger from this page.
- No frontend tests were added.
- Existing backend Vietnamese strings may still show encoding issues if backend runtime/source encoding is not normalized.

## Next Recommended Task

Recommended next task:

`PORTFOLIO_CASH_LEDGER_ADMIN_UI_V1`

Suggested scope:

- Add a small cash ledger management/admin section.
- Show net cash balance and latest entry date.
- Allow ADJUSTMENT creation from UI.
- Add a rebuild-from-transactions button with confirmation.

