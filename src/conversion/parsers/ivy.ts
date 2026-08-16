import Papa from 'papaparse'
import type { ParseResult, SkipEntry, Transaction } from '../types'
import { normalizeIvyDate } from '../dates'

type IvyRow = Record<string, string | undefined>

/**
 * Parse Ivy Wallet export CSV into the neutral transaction IR.
 *
 * Mapping rules (happy path):
 * - EXPENSE → negative absolute amount, INCOME → positive absolute amount
 * - Ivy `Description` → Cashew `Note`
 * - Dates normalized via a timezone-safe string transform
 * - Thousands separators (`"2,046.06"`) parse correctly
 *
 * Rows that can't convert are skipped with a 1-based row number (header is
 * row 1) and a reason — never crash, never silent. Transfers are not split
 * yet; they surface as skips until that lands.
 */
export function parseIvy(text: string): ParseResult {
  const parsed = Papa.parse<IvyRow>(text, {
    header: true,
    skipEmptyLines: 'greedy',
  })

  const transactions: Transaction[] = []
  const counts = { income: 0, expense: 0, transfers: 0 }
  const skips: SkipEntry[] = []

  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2 // 1-based; row 1 is the header
    const skip = (reason: string) => skips.push({ row: rowNumber, reason })

    const type = (row['Type'] ?? '').trim()
    const rawAmount = (row['Amount'] ?? '').trim()
    const rawDate = (row['Date'] ?? '').trim()

    if (type === 'TRANSFER') {
      skip('transfers are not supported yet')
      return
    }

    if (type !== 'INCOME' && type !== 'EXPENSE') {
      skip(`unknown transaction type: "${type}"`)
      return
    }

    const date = normalizeIvyDate(rawDate)
    if (date === null) {
      skip(rawDate === '' ? 'missing date' : `unparseable date: "${rawDate}"`)
      return
    }

    const amount = parseAmount(rawAmount)
    if (amount === null) {
      skip(rawAmount === '' ? 'missing amount' : `unparseable amount: "${rawAmount}"`)
      return
    }

    const currency = (row['Currency'] ?? '').trim()
    transactions.push({
      date,
      amount: type === 'EXPENSE' ? -Math.abs(amount) : Math.abs(amount),
      category: (row['Category'] ?? '').trim(),
      title: (row['Title'] ?? '').trim(),
      note: (row['Description'] ?? '').trim(),
      account: (row['Account'] ?? '').trim(),
      ...(currency === '' ? {} : { currency }),
    })
    counts[type === 'EXPENSE' ? 'expense' : 'income'] += 1
  })

  return { transactions, counts, skips }
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
