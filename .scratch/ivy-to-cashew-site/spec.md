# Ivy Wallet → Cashew: static client-side CSV converter site

Status: ready-for-agent
Migrated from: GitHub issue #1 (closed on migration)

## Problem Statement

I'm migrating from Ivy Wallet to Cashew. Ivy exports transactions as a CSV with its own column layout, but Cashew imports a different CSV layout. Right now the only way across is converting by hand or with throwaway local tooling — there is no public, trustworthy converter, and hand-editing hundreds of transactions is error-prone and loses data silently.

## Solution

A public, single-page static website where any Ivy Wallet user drops their exported CSV and receives a Cashew-ready CSV to import. All conversion happens locally in the browser — the file is never uploaded anywhere — and the page says so explicitly, since this is financial data. The user sees a summary of what was converted (counts by outcome, and every skipped row with a reason) before downloading the result. No accounts, no server, no install.

## User Stories

1. As an Ivy Wallet user, I want to drop my exported CSV onto a web page, so that I get a Cashew-importable CSV without installing anything.
2. As an Ivy Wallet user, I want a visible "your file never leaves your browser" statement, so that I can trust the tool with my financial data.
3. As an Ivy Wallet user, I want to pick the file via a button as well as drag-and-drop, so that I can convert on a device or browser where dragging is awkward.
4. As an Ivy Wallet user, I want my expenses exported as negative amounts and income as positive, so that Cashew's totals are correct after import.
5. As an Ivy Wallet user, I want transfers converted into two rows (an expense on the source account and an income on the destination account), so that money moved between my accounts is represented the way Cashew expects.
6. As an Ivy Wallet user, I want transfer rows labeled with a `Transfer` category and titles like "Transfer to/from <account>", so that they are recognizable and filterable in Cashew.
7. As an Ivy Wallet user, I want dates converted into Cashew's expected format, so that transactions land on the right day and time.
8. As an Ivy Wallet user, I want amounts containing thousands separators (e.g. "2,046.06") handled correctly, so that large transactions aren't corrupted.
9. As an Ivy Wallet user, I want rows that can't be converted reported with a row number and reason, so that I don't silently lose transactions during migration.
10. As an Ivy Wallet user, I want a summary showing how many income, expense, transfer (split) and skipped rows resulted, so that I can sanity-check the conversion against what Ivy shows.
11. As an Ivy Wallet user, I want a preview table of the first ~20 converted rows before downloading, so that I can verify the mapping looks right.
12. As an Ivy Wallet user, I want long notes truncated in the preview but fully preserved in the downloaded file, so that the preview stays readable without data loss.
13. As an Ivy Wallet user, I want an explicit download button showing row count and file size, so that I know I'm getting the complete result.
14. As an Ivy Wallet user, I want the download named after my input file (e.g. `ivy-export.csv` → `cashew-ivy-export.csv`), so that I can find it easily.
15. As an Ivy Wallet user, I want dropping a new file to reset the previous result, so that consecutive conversions don't mix.
16. As an Ivy Wallet user with Vietnamese or other non-ASCII text in titles/notes/accounts, I want UTF-8 content preserved exactly, so that my data imports intact.
17. As an Ivy Wallet user, I want a clear error if my file isn't valid UTF-8, so that I understand why conversion failed and can re-export.
18. As a mobile user, I want the page to work on a small screen, so that I can convert on my phone.
19. As a visitor unfamiliar with either app, I want a short explainer of what Ivy and Cashew are (with links), so that I understand the tool's purpose.
20. As a keyboard-only user, I want the file picker reachable and operable via keyboard, so that I can use the tool without a mouse.
21. As a screen-reader user, I want the summary and errors exposed as proper live/alert text, so that conversion results are announced.
22. As a user in dark or light environments, I want the site to follow my OS color scheme automatically, so that it's comfortable to read.
23. As a returning user, I want the page to be a single static page with no build-time secrets or accounts, so that it loads fast and stays available.
24. As a future contributor, I want conversions structured as pluggable parser/serializer pairs around a neutral transaction model, so that adding another source or target app doesn't rewrite the site.
25. As a future contributor, I want the neutral transaction model to carry an optional currency field even though the Cashew serializer ignores it, so that a future converter can use it without breaking the model.
26. As a future contributor, I want the whole conversion pipeline testable through one pure function from raw bytes to result, so that refactors stay safe without brittle per-module tests.
27. As a user with a large export (thousands of rows), I want conversion to stay responsive with visible feedback, so that the page doesn't feel frozen.

## Implementation Decisions

- **Static client-side app.** Single page, React + TypeScript + Vite (existing scaffold). No backend, no upload; conversion runs in-browser. The page states this explicitly.
- **Conversion logic implemented natively in TypeScript.** Mapping rules: EXPENSE → negative absolute amount, INCOME → positive absolute; TRANSFER split into two rows (see below); Description column maps to Note; dates reformatted to the output format.
- **Neutral intermediate representation (IR).** A `Transaction` model (date, signed amount, category, title, note, account, optional currency) sits between parsing and serialization. A **Parser** maps Ivy CSV → `Transaction[]`; a **Serializer** maps `Transaction[]` → Cashew CSV. This contract came from seam design:
  ```ts
  type ConversionResult =
    | { ok: true; csv: string; counts: { income: number; expense: number; transfers: number; skipped: number }; skips: Array<{ row: number; reason: string }> }
    | { ok: false; error: string } // e.g. invalid UTF-8
  convertIvyToCashew(bytes: ArrayBuffer): ConversionResult
  ```
- **Pluggable converter registry.** Each converter registers an id, parser, and serializer (`ivy-to-cashew` first). The UI is converter-agnostic: it renders from `ConversionResult` and knows nothing about Ivy/Cashew specifics.
- **CSV parsing via papaparse.** Handles quoting and edge cases; no hand-rolled parser.
- **Transfer splitting lives in the parser.** One Ivy TRANSFER row emits two IR transactions (negative on source account, positive on destination, category `Transfer`, titles `Transfer to <account>` / `Transfer from <account>`, original title as note).
- **Sign normalization.** EXPENSE → negative absolute, INCOME → positive absolute. Amounts are emitted as raw JS numbers (e.g. `500`, `-2046.06`), not fixed-decimal strings.
- **Date output format.** `YYYY-MM-DD HH:mm:ss.SSS` via a timezone-safe string transform (no `Date` object, so no TZ drift). Note: Cashew's own import template shows `M/D/YYYY` dates; we deliberately keep the ISO-like format — worth an ADR when domain docs begin.
- **Encoding.** Strict UTF-8 decode (fatal) with BOM stripped; on failure the user gets a clear error. No encoding detection, no fallback encodings.
- **Validation policy — skip with reason, never crash, never silent.** Reasons cover: missing date, missing/unparseable amount, transfer missing amounts, unknown transaction type. Skipped rows carry 1-based row numbers relative to the input file (header-aware).
- **UI flow.** Drag-drop zone + click-to-pick → conversion summary card (counts + expandable skip list `row N: reason`) → preview table (first ~20 rows, all 6 output columns, notes truncated with full text preserved on download) → explicit "Download Cashew CSV" button (shows row count + byte size). Dropping a new file resets state.
- **Copy and theme.** English only; follows `prefers-color-scheme` (no manual toggle).
- **No sample-file button.** The page always requires the user's real file.
- **UI stays thin.** All UI views render from the single `ConversionResult`; no UI-specific conversion logic.

## Testing Decisions

- **What makes a good test here:** assert only external behavior at the one seam — raw input bytes in, complete output (CSV string + counts + skip list) out. No assertions on internal modules, mocks, or UI internals.
- **Single seam:** `convertIvyToCashew(bytes)` as specified above — the highest possible seam, exercising decode → parse → map/split → serialize with no mocks. UI wiring above it is untested by decision.
- **Framework:** Vitest, golden-file style — inline CSV fixtures, assert the full expected output CSV, counts, and skip reasons.
- **Cases (~6–8):** income/expense sign normalization; transfer split into two rows; both Ivy date variants (with/without time part); each skip reason (missing date, bad amount, transfer missing amounts, unknown type); thousands-separator amounts; invalid UTF-8 bytes → error; BOM-prefixed file; quoted fields with embedded commas/newlines.
- **Prior art:** none — this is the first tested logic in a fresh template repo.

## Out of Scope

- GitHub Pages deployment and `base` path configuration (deferred until the user is ready to publish).
- Multi-file or zip input; only a single CSV is accepted.
- Generic converter-matrix UI (multiple source/target selectors); the registry exists but the page offers Ivy→Cashew only.
- Currency conversion or FX handling; currency is carried on the IR but ignored.
- Vietnamese localization; English only.
- Browser/UI tests; no sample-file button; no manual theme toggle.

## Further Notes

- The official Cashew import template's `M/D/YYYY` date style was observed but not adopted; revisit if Cashew import ever rejects ISO-like dates.
- Local reference files (e.g. the Cashew import template CSV) are personal and must be gitignored, never committed.
- The neutral IR (with optional currency) is the extension point for any future converter pair.
