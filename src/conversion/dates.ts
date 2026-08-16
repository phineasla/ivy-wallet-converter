/**
 * Timezone-safe date reformatting: pure string transforms, no `Date` object,
 * so no timezone drift between what Ivy exported and what we emit.
 */

const DATE_TIME_MS = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d+)$/
const DATE_TIME = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})$/
const DATE_ONLY = /^(\d{4}-\d{2}-\d{2})$/

/**
 * Normalize an Ivy date string to Cashew's `YYYY-MM-DD HH:mm:ss.SSS`.
 *
 * Handles the Ivy variants seen in exports:
 * - `2024-01-15T14:30:45.123` (with milliseconds)
 * - `2024-01-15T14:30:45`     (time, no milliseconds)
 * - `2024-01-15`              (no time part)
 *
 * Millisecond precision beyond 3 digits is truncated; missing time parts
 * default to zero. Returns `null` when the value matches no known variant.
 */
export function normalizeIvyDate(value: string): string | null {
  const withMs = DATE_TIME_MS.exec(value)
  if (withMs) {
    const ms = withMs[5].slice(0, 3).padEnd(3, '0')
    return `${withMs[1]} ${withMs[2]}:${withMs[3]}:${withMs[4]}.${ms}`
  }

  const withoutMs = DATE_TIME.exec(value)
  if (withoutMs) {
    return `${withoutMs[1]} ${withoutMs[2]}:${withoutMs[3]}:${withoutMs[4]}.000`
  }

  const dateOnly = DATE_ONLY.exec(value)
  if (dateOnly) {
    return `${dateOnly[1]} 00:00:00.000`
  }

  return null
}
