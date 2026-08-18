# 05 — Page polish: explainer, theme, responsiveness, big-file feedback

**What to build:** The page explains itself and feels finished:

- A **short explainer** of what Ivy Wallet and Cashew are, with links, understandable to a visitor who knows neither app
- **Automatic theming** that follows the OS color scheme (`prefers-color-scheme`) with no manual toggle
- A **responsive layout** that reads comfortably on small screens
- **Big-file feedback**: converting a multi-thousand-row export shows visible busy feedback instead of a frozen-feeling page

Copy stays English-only per the spec.

**Blocked by:** 03 — Results view: summary card, skip list, preview, download; 04 — Drop zone input UX.

**Status:** ready-for-agent

- [ ] Explainer names both apps with links and makes the tool's purpose clear to a newcomer
- [ ] Light/dark follows `prefers-color-scheme`; there is no manual toggle
- [ ] Layout is comfortable at phone-width viewport
- [ ] Converting a large export (thousands of rows) shows visible feedback and the page never feels frozen
- [ ] All copy is English
