# 04 — Drop zone input UX

**What to build:** The file input becomes a proper drop zone. A user can drag an Ivy CSV onto the zone or click it to pick a file — whichever suits their device or browser. Keyboard-only users can reach and operate the zone. Only a single `.csv` is accepted; anything else gets clear feedback and converts nothing. Dropping a new file resets the previous result entirely, so consecutive conversions never mix. The zone stays usable on a small screen.

**Blocked by:** 03 — Results view: summary card, skip list, preview, download.

**Status:** done

- [x] Drag-and-drop and click-to-pick both trigger conversion of the chosen file
- [x] The zone is focusable and fully operable keyboard-only (Enter/Space opens the picker)
- [x] A non-CSV file or multiple files gives clear feedback and converts nothing
- [x] Dropping a new file replaces the previous result — no stale counts, preview, or download
- [x] The input works comfortably on a phone-sized screen

## Comments

**Done in 55eacd8 + 63736af** (review fixes), all tests/typecheck/lint green.

- **No new tests, by standing decision** — spec's "UI wiring above the conversion seam is untested" decision (same as ticket 03); `isCsv`/`selectionError` in the Dropzone are pure but stay untested per that decision.
- **Zone is a real `<button>`** — native Enter/Space activation, no ARIA role juggling; the picker opens via a visually hidden `<input type="file">` kept out of the tab order (`tabIndex={-1}`) but labeled for assistive tech (no `aria-hidden` on a focusable element). Chromium's full AX tree shows the zone as the single named button.
- **Validation rule is extension-only** (`.csv`, any case) per the ticket's "only a single .csv"; review flagged MIME leniency as a deviation — removed. Cancelled picker (empty `FileList`) is a no-op — browser verification caught a real crash there (`files[0]` on an empty list) before it shipped.
- **Rejections keep the previous result** — "converts nothing" read as no state change: a rejected drop shows its own `role="alert"` inside the zone wrapper and never wipes a usable download.
- **Result replacement is atomic** — `attempt` counter + `ConversionResult` land in one commit, and `key={attempt}` remounts the results view so even a same-named re-dropped file starts fresh (no inherited `<details>`/scroll state). The counter also drives the ZWSP alternation for live-region re-announcement (replaces the old ref).
- **Read failures surface as alerts** — `arrayBuffer()` rejection becomes an `ok: false` result through the existing error path (story 21).
- **Judgment calls kept (flagged by review, deemed fine):** document-level `dragover`/`drop` suppression so a missed drop never navigates the browser to the file; dragover highlight + drag-depth counter; Ivy-specific copy inside the Dropzone (spec's Out of Scope blesses the single-converter page).
- **Verification was DOM-based** — vision was unavailable to both the main agent and the Image Analyst subagent (again), so criteria were verified via Playwright DOM/AX-tree/computed-style checks (drag sequence via `DataTransfer`, keyboard Enter/Space with an instrumented picker, 375px viewport with no horizontal scroll, dark+light computed colors, CDP `Accessibility.getFullAXTree`).
