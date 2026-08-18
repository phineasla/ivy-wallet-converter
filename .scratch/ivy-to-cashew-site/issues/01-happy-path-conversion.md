# 01 — Happy-path Ivy→Cashew conversion in the browser

**What to build:** The walking skeleton. A user opens the site, sees the "your file never leaves your browser" statement, clicks a button to pick their Ivy export, and — for a clean file containing only INCOME and EXPENSE rows — sees the conversion counts. Everything runs locally; no upload.

Under the hood this lands the full architecture behind one pure seam (shape came from the spec's seam design / the `ivy2cashew.py` prototype — it encodes the contract decisions):

```ts
type ConversionResult =
  | { ok: true; csv: string; counts: { income: number; expense: number; transfers: number; skipped: number }; skips: Array<{ row: number; reason: string }> }
  | { ok: false; error: string }
convertIvyToCashew(bytes: ArrayBuffer): ConversionResult
```

A neutral `Transaction` IR (date, signed amount, category, title, note, account, optional currency) sits between an Ivy **parser** and a Cashew **serializer**, registered in a converter registry (`ivy-to-cashew` first). CSV parsing via papaparse — no hand-rolled parser.

Mapping rules in this slice: EXPENSE → negative absolute amount, INCOME → positive absolute; Ivy Description → Cashew Note; dates reformatted to `YYYY-MM-DD HH:mm:ss.SSS` via a timezone-safe string transform (no `Date` object) handling both Ivy variants — with and without time part; thousands separators (`"2,046.06"`) parse correctly; amounts emit as raw numbers, not fixed-decimal strings; quoted fields with embedded commas/newlines survive.

Also in this slice: strip the scaffold demo (counter, logos, sample sections) down to a minimal page shell; install papaparse + vitest with a test script; gitignore local reference CSVs (e.g. the Cashew import template) so personal files can never be committed; and record ADR-0001 (in `docs/adr/` per repo convention) for the deliberate choice of ISO-like output dates over the template's `M/D/YYYY`.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Picking a clean INCOME/EXPENSE Ivy CSV via a button converts it fully in-browser and shows counts (income/expense populated, transfers/skipped 0)
- [x] The page states explicitly that the file never leaves the browser
- [x] Golden-file tests at the `convertIvyToCashew` seam assert the full output CSV + counts, with no mocks, for: sign normalization; both Ivy date variants; thousands-separator amounts; quoted fields with embedded commas/newlines
- [x] Scaffold demo removed; dev, build, and test scripts all green
- [x] papaparse and vitest installed, with a working test script
- [x] Local reference CSVs are gitignored — an accidental commit is impossible
- [x] ADR-0001 records the ISO-like date decision and the revisit trigger (Cashew rejecting ISO-like dates)

## Comments

- 2026-08-16: Implemented. Architecture landed under `src/conversion/`: `types.ts` (Transaction IR + `ConversionResult` seam), `parsers/ivy.ts`, `serializers/cashew.ts`, `registry.ts` (`ivy-to-cashew` registered), `convert.ts` (`convertIvyToCashew`). 4 golden tests at the seam in `convert.test.ts`. UI is a minimal shell (privacy statement, picker, counts, error display). Verified end-to-end in the browser via the dev server.
- Transitional: TRANSFER rows currently surface as skips ("transfers are not supported yet") — ticket 02 replaces this with the two-row split. Fatal UTF-8 decoding (with free BOM stripping via TextDecoder) is already in place; ticket 02 pins it with tests.
- Noted behavior: Papa.unparse joins rows with CRLF (matches the Python prototype's `csv.writer` output) and omits a trailing newline; golden tests pin this.
