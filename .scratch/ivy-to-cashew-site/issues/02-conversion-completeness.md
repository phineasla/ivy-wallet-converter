# 02 — Conversion completeness: transfers, skip-with-reason, strict UTF-8

**What to build:** A real-world Ivy export converts with nothing silently lost and no crash. Three behaviours complete the conversion core:

**Transfers.** One Ivy TRANSFER row becomes two rows: an expense on the source account titled `Transfer to <account>` and an income on the destination account titled `Transfer from <account>`, both with category `Transfer`, the original title as note, and amounts taken from the transfer/receive amount columns. `counts.transfers` counts the split transfers.

**Skip with reason — never crash, never silent.** Rows that can't convert are skipped and reported with a 1-based row number (header-aware, relative to the input file) and a reason covering: missing date; missing/unparseable amount; transfer missing amounts; unknown transaction type. `counts.skipped` and the skips list populate; everything else still converts.

**Encoding.** Input bytes are decoded strictly as UTF-8 (fatal) with the BOM stripped. Invalid bytes return `ok: false` with a clear error the page displays so the user knows to re-export. Vietnamese and other non-ASCII content in titles/notes/accounts passes through exactly.

**Blocked by:** 01 — Happy-path Ivy→Cashew conversion in the browser.

**Status:** done

- [x] A TRANSFER row converts to two rows with correct accounts, signs, titles, `Transfer` category, and original title as note; `counts.transfers` reflects it
- [x] Each of the four skip reasons produces a `row N: reason` entry with correct 1-based numbering against the input file
- [x] Invalid UTF-8 bytes produce an `ok: false` error surfaced in the UI; a BOM-prefixed file converts as if the BOM were absent
- [x] Non-ASCII titles/notes/accounts are preserved exactly in the output
- [x] Golden-file tests at the seam cover: transfer split; each skip reason; invalid UTF-8; BOM-prefixed fixture

## Comments

**Done in 1c1ee6b + f590966** (review fixes), all tests/typecheck/lint green.

- **`counts.transfers` semantics:** +1 per source TRANSFER row (the split transfer), not +2 — `income + expense + transfers + skipped` stays a partition of input rows, which is what the summary sanity-check needs. Ticket 03 should render it as "N transfers (split into 2N rows)".
- **Row numbering:** reworked the Ivy parser from header-mode Papa parsing to raw records with a column map so skip row numbers track the input file exactly — header is row 1, blank lines occupy their row, and quoted fields spanning physical lines count those lines for later records.
- **Skip reasons:** the four required reasons plus the pre-existing `unparseable date` variant (dates report missing vs unparseable, like amounts).
- **Known limitation (future ticket if ever needed):** `parseAmount` strips all commas, so a comma-decimal amount like `25,40` would read as 2540 rather than skip. Ivy exports use dot decimals with proper thousands grouping, so this is theoretical; tightening it risks false skips on legitimate grouping.
- **Review notes:** declined the invalid-UTF-8-bytes-helper suggestion (`toBytes(string)` can't produce invalid UTF-8) and the sign/counter-key micro-refactor; the "error not displayed in UI" finding was incorrect — `App.tsx` renders `result.error` with `role="alert"` since ticket 01.
