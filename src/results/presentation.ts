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
  /** The first `limit` data rows of the result CSV. */
  rows: string[][]
  /** Total data rows in the full CSV — what the download contains. */
  totalRows: number
}

/**
 * Shape the result CSV into a previewable table. Generic over any converter's
 * output: whatever columns the CSV's header row declares are the columns shown.
 */
export function previewFromCsv(
  csv: string,
  limit = PREVIEW_ROW_LIMIT,
): CsvPreview {
  const { data } = Papa.parse<string[]>(csv, { skipEmptyLines: false })
  const [columns = [], ...rows] = data
  return { columns, rows: rows.slice(0, limit), totalRows: rows.length }
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

/** Screen-reader sentence announcing a finished conversion. */
export function summarySentence(
  fileName: string,
  counts: ConversionCounts,
): string {
  const { income, expense, transfers, skipped } = counts
  return [
    `Converted ${fileName}:`,
    `${income} income,`,
    `${expense} ${plural(expense, 'expense', 'expenses')},`,
    `${transfers} ${plural(transfers, 'transfer', 'transfers')},`,
    `${skipped} ${plural(skipped, 'row skipped', 'rows skipped')}.`,
  ].join(' ')
}
