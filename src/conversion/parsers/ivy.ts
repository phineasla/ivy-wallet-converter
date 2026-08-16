import Papa from 'papaparse'
import type { ParseResult, SkipEntry, Transaction } from '../types'
import { normalizeIvyDate } from '../dates'

/**
 * Parse Ivy Wallet export CSV into the neutral transaction IR.
 *
 * Mapping rules:
 * - EXPENSE → negative absolute amount, INCOME → positive absolute amount
 * - Ivy `Description` → Cashew `Note`
 * - Dates normalized via a timezone-safe string transform
 * - Thousands separators (`"2,046.06"`) parse correctly
 * - A TRANSFER row splits into two transactions: an expense on the source
 *   account and an income on the destination account, both categorized
 *   `Transfer` with the original title as note and amounts taken from the
 *   transfer/receive amount columns.
 *
 * Rows that can't convert are skipped with a 1-based row number and a reason —
 * never crash, never silent. Row numbers track the input file itself: the
 * header is row 1, blank lines occupy their row, and a quoted field spanning
 * several physical lines counts those lines for the records after it.
 */
export function parseIvy(text: string): ParseResult {
  // Blank lines keep their slot in `data` (no skipping) so row numbers can
  // track the file; they are filtered out below.
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: false })

  const transactions: Transaction[] = []
  const counts = { income: 0, expense: 0, transfers: 0 }
  const skips: SkipEntry[] = []

  if (parsed.data.length === 0) {
    return { transactions, counts, skips }
  }

  const [header, ...records] = parsed.data

  const columnIndex = new Map<string, number>()
  header.forEach((name, index) => columnIndex.set(name.trim(), index))

  // A record starts on the line right after the previous one ends; newlines
  // embedded in quoted fields make a record span extra physical lines.
  let nextRowLine = 2 + countNewlines(header)

  for (const record of records) {
    const rowNumber = nextRowLine
    nextRowLine = rowNumber + 1 + countNewlines(record)

    if (isBlank(record)) continue

    const skip = (reason: string) => skips.push({ row: rowNumber, reason })
    const field = (name: string) => (record[columnIndex.get(name) ?? -1] ?? '').trim()

    const type = field('Type')
    if (type !== 'INCOME' && type !== 'EXPENSE' && type !== 'TRANSFER') {
      skip(`unknown transaction type: "${type}"`)
      continue
    }

    const rawDate = field('Date')
    const date = normalizeIvyDate(rawDate)
    if (date === null) {
      skip(rawDate === '' ? 'missing date' : `unparseable date: "${rawDate}"`)
      continue
    }

    if (type === 'TRANSFER') {
      const transferAmount = parseAmount(field('Transfer Amount'))
      const receiveAmount = parseAmount(field('Receive Amount'))
      if (transferAmount === null || receiveAmount === null) {
        skip('transfer missing amounts')
        continue
      }

      const account = field('Account')
      const toAccount = field('To Account')
      const title = field('Title')
      const currency = field('Currency')
      transactions.push(
        {
          date,
          amount: -Math.abs(transferAmount),
          category: 'Transfer',
          title: `Transfer to ${toAccount}`,
          note: title,
          account,
          ...(currency === '' ? {} : { currency }),
        },
        {
          date,
          amount: Math.abs(receiveAmount),
          category: 'Transfer',
          title: `Transfer from ${account}`,
          note: title,
          account: toAccount,
          ...(currency === '' ? {} : { currency }),
        },
      )
      counts.transfers += 1
      continue
    }

    const rawAmount = field('Amount')
    const amount = parseAmount(rawAmount)
    if (amount === null) {
      skip(rawAmount === '' ? 'missing amount' : `unparseable amount: "${rawAmount}"`)
      continue
    }

    const currency = field('Currency')
    transactions.push({
      date,
      amount: type === 'EXPENSE' ? -Math.abs(amount) : Math.abs(amount),
      category: field('Category'),
      title: field('Title'),
      note: field('Description'),
      account: field('Account'),
      ...(currency === '' ? {} : { currency }),
    })
    counts[type === 'EXPENSE' ? 'expense' : 'income'] += 1
  }

  return { transactions, counts, skips }
}

/** Count a record's physical line breaks — quoted fields may contain newlines. */
function countNewlines(record: string[]): number {
  return record.reduce((total, field) => total + (field.match(/\n/g)?.length ?? 0), 0)
}

/** True for records produced by blank or whitespace-only lines. */
function isBlank(record: string[]): boolean {
  return record.length <= 1 && record.every((field) => field.trim() === '')
}

/**
 * Parse an Ivy amount string, tolerating thousands separators (`"2,046.06"`).
 * Returns `null` for missing or unparseable values.
 */
function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim()
  if (cleaned === '') return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}
