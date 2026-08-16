/**
 * Neutral transaction IR sitting between a source parser and a target serializer.
 * Any converter pair composes through this model; `currency` is optional because
 * the Cashew serializer ignores it, but a future target may use it.
 */
export interface Transaction {
  /** Normalized timestamp, `YYYY-MM-DD HH:mm:ss.SSS`. */
  date: string
  /** Signed amount: expenses negative, income positive. */
  amount: number
  category: string
  title: string
  note: string
  account: string
  currency?: string
}

/** A row that could not be converted. `row` is 1-based, relative to the input file (header is row 1). */
export interface SkipEntry {
  row: number
  reason: string
}

export interface ConversionCounts {
  income: number
  expense: number
  transfers: number
  skipped: number
}

/** The single conversion seam: raw input bytes in, complete result out. */
export type ConversionResult =
  | {
      ok: true
      csv: string
      counts: ConversionCounts
      skips: SkipEntry[]
    }
  | { ok: false; error: string }

/** Outcome of parsing a source file into the neutral IR. */
export interface ParseResult {
  transactions: Transaction[]
  counts: Omit<ConversionCounts, 'skipped'>
  skips: SkipEntry[]
}

/** Maps decoded source-file text to transactions. */
export type Parser = (text: string) => ParseResult

/** Maps transactions to target-file CSV text. */
export type Serializer = (transactions: Transaction[]) => string

/** A source→target pair composed through the neutral IR. */
export interface Converter {
  id: string
  parse: Parser
  serialize: Serializer
}
