# 03 — Results view: summary card, skip list, preview, download

**What to build:** After a conversion, the user sees everything needed to trust and take the result:

- A **summary card** with the four counts (income, expense, transfers, skipped) so the totals can be sanity-checked against what Ivy shows
- An **expandable skip list** showing every skipped row as `row N: reason`, so nothing disappears silently
- A **preview table** of the first ~20 converted rows with all six Cashew columns, long notes truncated for readability — the full text is preserved in the downloaded file
- An explicit **download button** showing row count and byte size, saving as `cashew-<original-filename>` (e.g. `ivy-export.csv` → `cashew-ivy-export.csv`)

The view is converter-agnostic: it renders purely from `ConversionResult` and knows nothing about Ivy or Cashew specifics. Results are announced to screen-reader users via a live region, and everything is keyboard-reachable.

**Blocked by:** 02 — Conversion completeness: transfers, skip-with-reason, strict UTF-8.

**Status:** done

- [x] Summary card shows income, expense, transfers, and skipped counts
- [x] Skip list is expandable and lists every skipped row as `row N: reason`
- [x] Preview table shows the first ~20 rows, all 6 columns, with notes truncated (e.g. ellipsis) while the download keeps full text
- [x] Download button shows row count + byte size and the filename is `cashew-<input name>`
- [x] Summary and errors are exposed as live/alert text; the view is operable without a mouse
- [x] The view renders only from `ConversionResult` — no source/target-specific conversion logic in it

## Comments

**Done in 3bf30c8 + 99ff1d8** (review fixes), all tests/typecheck/lint green.

- **No new tests, by user decision** — the spec's "UI wiring above the conversion seam is untested" decision was honored over extracting a tested presentation seam (option offered, declined).
- **`ConversionSuccess` added to `conversion/types.ts`** — `Extract` of the success branch; benign scope creep per spec review, kept.
- **Counts wording lives once** — `countLines` in `src/results/presentation.ts` feeds both the summary card and the `role="status"` announcement, including the `(split into 2N rows)` transfer note ticket 02 asked for. That note and the `cashew-` download prefix are the only target-specific display facts, both isolated in `presentation.ts`.
- **Truncation is CSS-only** — preview cells keep full text in the DOM (`max-width` + `text-overflow: ellipsis`), so screen readers and the download always see everything; verified via `scrollWidth > clientWidth` in the browser.
- **Live region re-announce** — `role="status"` only announces on text change, so converting the same file twice appends an alternating invisible zero-width space to force a change.
- **Download** — anchor appended to the document, object URL revoked after 1s (not synchronously; a sync revoke after `click()` can cancel the download in some browsers). Saving as `cashew-<input name>` verified.
- **Verification was DOM-based** — vision was unavailable to both the main agent and the Image Analyst subagent in this session, so visual claims (truncation, overflow, contrast) were checked via Playwright `page.evaluate` measurements instead of screenshots.
- **`useMemo` dropped** in ResultsView — preview/byte-size recompute per render, but renders only happen on file drops, so memoization was speculative.
