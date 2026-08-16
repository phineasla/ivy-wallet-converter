import Papa from 'papaparse'
import type { ConversionCounts } from '../conversion/types'

/**
 * Pure presentation helpers for the results view.
 *
 * Everything here renders from the converter-agnostic `ConversionResult`
 * contract — no Ivy/Cashew conversion logic. The one target-specific choice
 * (the `cashew-` download prefix) is isolated in `downloadName`.
 */

/** How many converted rows the preview table shows before truncating. */
export const PREVIEW_ROW_LIMIT = 20

/** Download filename: `ivy-export.csv` → `cashew-ivy-export.csv`. */
export function downloadName(fileName: string): string {
  return `cashew-${fileName}`
}

export interface CsvPreview {
  /** Header cells of the result CSV, in column order. */
  columns: string[]
  /** The first `PREVIEW_ROW_LIMIT` data rows of the result CSV. */
  rows: string[][]
  /** Total data rows in the full CSV — what the download contains. */
  totalRows: number
}

/**
 * Shape the result CSV into a previewable table. Generic over any converter's
 * output: whatever columns the CSV's header row declares are the columns shown.
 * Purely-empty records (a trailing newline) don't count as rows.
 */
export function previewFromCsv(csv: string): CsvPreview {
  const { data } = Papa.parse<string[]>(csv, { skipEmptyLines: false })
  const [columns = [], ...records] = data
  const rows = records.filter((row) => row.some((cell) => cell !== ''))
  return {
    columns,
    rows: rows.slice(0, PREVIEW_ROW_LIMIT),
    totalRows: rows.length,
  }
}

/** UTF-8 byte length of the CSV — the exact size of the downloaded file. */
export function byteSize(csv: string): number {
  return new TextEncoder().encode(csv).length
}

/** Human-readable byte size: `823 B`, `4.2 KB`, `1.3 MB`. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${rounded(bytes / 1024)} KB`
  return `${rounded(bytes / (1024 * 1024))} MB`
}

function rounded(n: number): string {
  return n.toFixed(1).replace(/\.0$/, '')
}

/** `n === 1` picks the singular form, anything else the plural. */
export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many
}

export interface CountLine {
  value: number
  /** Label following the bolded value, already pluralized. */
  unit: string
}

/**
 * The four summary counts as display lines — the single source for both the
 * summary card and the screen-reader announcement, so their wording can't drift.
 *
 * The "(split into 2N rows)" note is the one transfer-display rule the results
 * view carries (per the conversion contract: `counts.transfers` counts source
 * transfer rows, each splitting into two output rows). It lives here, beside
 * `downloadName`, not in the component.
 */
export function countLines(counts: ConversionCounts): CountLine[] {
  const { income, expense, transfers, skipped } = counts
  const split =
    transfers > 0 ? ` (split into ${transfers * 2} rows)` : ''
  return [
    { value: income, unit: 'income' },
    { value: expense, unit: plural(expense, 'expense', 'expenses') },
    { value: transfers, unit: `${plural(transfers, 'transfer', 'transfers')}${split}` },
    { value: skipped, unit: plural(skipped, 'row skipped', 'rows skipped') },
  ]
}

/** Screen-reader sentence announcing a finished conversion. */
export function summarySentence(
  fileName: string,
  counts: ConversionCounts,
): string {
  const lines = countLines(counts)
    .map(({ value, unit }) => `${value} ${unit}`)
    .join(', ')
  return `Converted ${fileName}: ${lines}.`
}
