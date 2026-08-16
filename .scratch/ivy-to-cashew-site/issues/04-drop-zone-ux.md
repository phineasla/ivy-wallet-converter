# 04 — Drop zone input UX

**What to build:** The file input becomes a proper drop zone. A user can drag an Ivy CSV onto the zone or click it to pick a file — whichever suits their device or browser. Keyboard-only users can reach and operate the zone. Only a single `.csv` is accepted; anything else gets clear feedback and converts nothing. Dropping a new file resets the previous result entirely, so consecutive conversions never mix. The zone stays usable on a small screen.

**Blocked by:** 03 — Results view: summary card, skip list, preview, download.

**Status:** ready-for-agent

- [ ] Drag-and-drop and click-to-pick both trigger conversion of the chosen file
- [ ] The zone is focusable and fully operable keyboard-only (Enter/Space opens the picker)
- [ ] A non-CSV file or multiple files gives clear feedback and converts nothing
- [ ] Dropping a new file replaces the previous result — no stale counts, preview, or download
- [ ] The input works comfortably on a phone-sized screen
