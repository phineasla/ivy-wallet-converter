# 03 — Results view: summary card, skip list, preview, download

**What to build:** After a conversion, the user sees everything needed to trust and take the result:

- A **summary card** with the four counts (income, expense, transfers, skipped) so the totals can be sanity-checked against what Ivy shows
- An **expandable skip list** showing every skipped row as `row N: reason`, so nothing disappears silently
- A **preview table** of the first ~20 converted rows with all six Cashew columns, long notes truncated for readability — the full text is preserved in the downloaded file
- An explicit **download button** showing row count and byte size, saving as `cashew-<original-filename>` (e.g. `ivy-export.csv` → `cashew-ivy-export.csv`)

The view is converter-agnostic: it renders purely from `ConversionResult` and knows nothing about Ivy or Cashew specifics. Results are announced to screen-reader users via a live region, and everything is keyboard-reachable.

**Blocked by:** 02 — Conversion completeness: transfers, skip-with-reason, strict UTF-8.

**Status:** ready-for-agent

- [ ] Summary card shows income, expense, transfers, and skipped counts
- [ ] Skip list is expandable and lists every skipped row as `row N: reason`
- [ ] Preview table shows the first ~20 rows, all 6 columns, with notes truncated (e.g. ellipsis) while the download keeps full text
- [ ] Download button shows row count + byte size and the filename is `cashew-<input name>`
- [ ] Summary and errors are exposed as live/alert text; the view is operable without a mouse
- [ ] The view renders only from `ConversionResult` — no source/target-specific conversion logic in it
