# 02 — Conversion completeness: transfers, skip-with-reason, strict UTF-8

**What to build:** A real-world Ivy export converts with nothing silently lost and no crash. Three behaviours complete the conversion core:

**Transfers.** One Ivy TRANSFER row becomes two rows: an expense on the source account titled `Transfer to <account>` and an income on the destination account titled `Transfer from <account>`, both with category `Transfer`, the original title as note, and amounts taken from the transfer/receive amount columns. `counts.transfers` counts the split transfers.

**Skip with reason — never crash, never silent.** Rows that can't convert are skipped and reported with a 1-based row number (header-aware, relative to the input file) and a reason covering: missing date; missing/unparseable amount; transfer missing amounts; unknown transaction type. `counts.skipped` and the skips list populate; everything else still converts.

**Encoding.** Input bytes are decoded strictly as UTF-8 (fatal) with the BOM stripped. Invalid bytes return `ok: false` with a clear error the page displays so the user knows to re-export. Vietnamese and other non-ASCII content in titles/notes/accounts passes through exactly.

**Blocked by:** 01 — Happy-path Ivy→Cashew conversion in the browser.

**Status:** ready-for-agent

- [ ] A TRANSFER row converts to two rows with correct accounts, signs, titles, `Transfer` category, and original title as note; `counts.transfers` reflects it
- [ ] Each of the four skip reasons produces a `row N: reason` entry with correct 1-based numbering against the input file
- [ ] Invalid UTF-8 bytes produce an `ok: false` error surfaced in the UI; a BOM-prefixed file converts as if the BOM were absent
- [ ] Non-ASCII titles/notes/accounts are preserved exactly in the output
- [ ] Golden-file tests at the seam cover: transfer split; each skip reason; invalid UTF-8; BOM-prefixed fixture
