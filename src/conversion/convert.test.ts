import { describe, expect, it } from 'vitest'
import { convertIvyToCashew } from './convert'

const IVY_HEADER =
  'Date,Title,Amount,Account,Category,Description,Type,Transfer Amount,Receive Amount,To Account'

function toBytes(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer as ArrayBuffer
}

describe('convertIvyToCashew — happy path', () => {
  it('normalizes INCOME to positive and EXPENSE to negative absolute amounts', () => {
    const input = [
      IVY_HEADER,
      '2024-01-15T14:30:45.123,Lunch,12.5,Cash,Food,Small bite,EXPENSE,,,',
      '2024-01-16T09:00:00,Salary,2046.06,Bank,Income,January salary,INCOME,,,',
    ].join('\n')

    const result = convertIvyToCashew(toBytes(input))

    expect(result).toEqual({
      ok: true,
      // Papa.unparse joins rows with CRLF, like the csv module in the Python prototype.
      csv: [
        'Date,Amount,Category,Title,Note,Account',
        '2024-01-15 14:30:45.123,-12.5,Food,Lunch,Small bite,Cash',
        '2024-01-16 09:00:00.000,2046.06,Income,Salary,January salary,Bank',
      ].join('\r\n'),
      counts: { income: 1, expense: 1, transfers: 0, skipped: 0 },
      skips: [],
    })
  })

  it('handles both Ivy date variants: date-only and time-without-milliseconds', () => {
    const input = [
      IVY_HEADER,
      '2024-02-01,Groceries,50,Cash,Food,Weekly shop,EXPENSE,,,',
      '2024-02-02T08:30:00,Coffee,3.5,Cash,Food,,EXPENSE,,,',
    ].join('\n')

    const result = convertIvyToCashew(toBytes(input))

    expect(result).toEqual({
      ok: true,
      csv: [
        'Date,Amount,Category,Title,Note,Account',
        '2024-02-01 00:00:00.000,-50,Food,Groceries,Weekly shop,Cash',
        '2024-02-02 08:30:00.000,-3.5,Food,Coffee,,Cash',
      ].join('\r\n'),
      counts: { income: 0, expense: 2, transfers: 0, skipped: 0 },
      skips: [],
    })
  })

  it('parses thousands-separator amounts and emits raw numbers, not fixed-decimal strings', () => {
    const input = [
      IVY_HEADER,
      '2024-03-01T10:00:00.000,Salary,"2,046.06",Bank,Income,January,INCOME,,,',
      '2024-03-02,Plane tickets,"1,200",Bank,Travel,Two seats,EXPENSE,,,',
      '2024-03-03,Cash gift,500,Cash,Income,,INCOME,,,',
    ].join('\n')

    const result = convertIvyToCashew(toBytes(input))

    expect(result).toEqual({
      ok: true,
      csv: [
        'Date,Amount,Category,Title,Note,Account',
        '2024-03-01 10:00:00.000,2046.06,Income,Salary,January,Bank',
        '2024-03-02 00:00:00.000,-1200,Travel,Plane tickets,Two seats,Bank',
        '2024-03-03 00:00:00.000,500,Income,Cash gift,,Cash',
      ].join('\r\n'),
      counts: { income: 2, expense: 1, transfers: 0, skipped: 0 },
      skips: [],
    })
  })

  it('preserves quoted fields with embedded commas, quotes and newlines', () => {
    const input = [
      IVY_HEADER,
      '2024-04-01T12:00:00.000,"Dinner, with friends","60.25",Cash,Food,"Paid at ""The Corner"", split later',
      'see receipt",EXPENSE,,,',
    ].join('\n')

    const result = convertIvyToCashew(toBytes(input))

    expect(result).toEqual({
      ok: true,
      csv: [
        'Date,Amount,Category,Title,Note,Account',
        '2024-04-01 12:00:00.000,-60.25,Food,"Dinner, with friends","Paid at ""The Corner"", split later\nsee receipt",Cash',
      ].join('\r\n'),
      counts: { income: 0, expense: 1, transfers: 0, skipped: 0 },
      skips: [],
    })
  })
})
