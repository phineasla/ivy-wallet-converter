import Papa from 'papaparse'
import type { Serializer } from '../types'

const FIELDS = ['Date', 'Amount', 'Category', 'Title', 'Note', 'Account'] as const

/**
 * Serialize neutral transactions to Cashew's import CSV.
 *
 * Amounts emit as raw numbers (`500`, `-2046.06`), not fixed-decimal strings.
 * Quoting (embedded commas, quotes, newlines) is handled by papaparse.
 */
export const serializeCashew: Serializer = (transactions) =>
  Papa.unparse({
    fields: [...FIELDS],
    data: transactions.map((t) => [
      t.date,
      t.amount,
      t.category,
      t.title,
      t.note,
      t.account,
    ]),
  })
