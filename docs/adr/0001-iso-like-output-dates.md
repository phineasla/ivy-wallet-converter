# ADR-0001: Emit ISO-like dates in Cashew output

## Status

Accepted

## Context

Cashew's official import template (`Date` column) shows dates as `M/D/YYYY`
(e.g. `9/5/2023`, `9/13/2023 15:23:00`). Ivy Wallet exports dates as ISO-like
strings (`2024-01-15T14:30:45.123`, sometimes without the time or millisecond
part).

The converter must reformat Ivy dates into something Cashew imports correctly.
Two options:

1. Mimic the template exactly: `M/D/YYYY` (optionally with a time part).
2. Keep an ISO-like shape: `YYYY-MM-DD HH:mm:ss.SSS`.

## Decision

Emit `YYYY-MM-DD HH:mm:ss.SSS`.

Reasons:

- The reformat is a pure string transform — no `Date` object, so no timezone
  drift between what Ivy exported and what we emit. Round-tripping through
  `Date` would risk shifting transactions across days for users whose device
  timezone differs from the export's implicit one.
- The format is unambiguous (no `D/M` vs `M/D` confusion) and lexicographically
  sortable.
- Cashew's import parser accepts ISO-like timestamps in practice; the template
  merely illustrates one acceptable style, not a required one.

## Consequences

- Output dates differ in style from Cashew's template samples; this is
  cosmetic.
- **Revisit trigger:** if a Cashew import ever rejects ISO-like dates, switch
  the serializer's date rendering to the template's `M/D/YYYY` style. The
  change is isolated to the Cashew serializer (dates are normalized on the
  neutral `Transaction` IR, not at the edges).
