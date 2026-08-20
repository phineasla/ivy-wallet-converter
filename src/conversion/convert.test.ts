import { describe, expect, it } from 'vitest'
import { convertIvyToCashew } from './convert'

const IVY_HEADER =
  'Date,Title,Amount,Account,Category,Description,Type,Transfer Amount,Receive Amount,To Account'

function toBytes(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer as ArrayBuffer
}

/** Encode text as BOM-prefixed UTF-16 — `littleEndian` picks the byte order. */
function toUtf16(text: string, littleEndian: boolean): ArrayBuffer {
  const bytes = new Uint8Array(2 + text.length * 2)
  bytes[0] = littleEndian ? 0xff : 0xfe
  bytes[1] = littleEndian ? 0xfe : 0xff
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    bytes[2 + i * 2] = littleEndian ? code & 0xff : code >> 8
    bytes[3 + i * 2] = littleEndian ? code >> 8 : code & 0xff
  }
  return bytes.buffer
}

describe('convertIvyToCashew — transfers', () => {
  it('splits one TRANSFER row into an expense on the source account and an income on the destination', () => {
    const input = [
      IVY_HEADER,
      '2024-05-01T09:15:30.000,Move to savings,200,Bank,Savings,Monthly save,TRANSFER,200,200,Savings',
    ].join('\n')

    const result = convertIvyToCashew(toBytes(input))

    expect(result).toEqual({
      ok: true,
      csv: [
        'Date,Amount,Category,Title,Note,Account',
        '2024-05-01 09:15:30.000,-200,Transfer,Transfer to Savings,Move to savings,Bank',
        '2024-05-01 09:15:30.000,200,Transfer,Transfer from Bank,Move to savings,Savings',
      ].join('\r\n'),
      counts: { income: 0, expense: 0, transfers: 1, skipped: 0 },
      skips: [],
    })
  })

  it('uses transfer and receive amounts when they differ, with thousands separators', () => {
    const input = [
      IVY_HEADER,
      '2024-05-02T18:45:00,USD to VND,100,Vietcombank,Currency exchange,Rate fix,TRANSFER,"1,000","25,400,000",Cash',
    ].join('\n')

    const result = convertIvyToCashew(toBytes(input))

    expect(result).toEqual({
      ok: true,
      csv: [
        'Date,Amount,Category,Title,Note,Account',
        '2024-05-02 18:45:00.000,-1000,Transfer,Transfer to Cash,USD to VND,Vietcombank',
        '2024-05-02 18:45:00.000,25400000,Transfer,Transfer from Vietcombank,USD to VND,Cash',
      ].join('\r\n'),
      counts: { income: 0, expense: 0, transfers: 1, skipped: 0 },
      skips: [],
    })
  })
})

describe('convertIvyToCashew — skips and row numbering', () => {
  it('skips bad rows with a reason and 1-based row numbers relative to the input file, converting the rest', () => {
    const input = [
      IVY_HEADER, // row 1: header
      '2024-06-01T10:00:00.000,Coffee,4.5,Cash,Food,Espresso,EXPENSE,,,', // row 2: converts
      '', // row 3: blank line — ignored, but still occupies a file row
      ',Mystery,20,Cash,Food,No date given,EXPENSE,,,', // row 4: missing date
      '2024-06-03T10:00:00.000,Adjustment,10,Cash,Other,Correction,ADJUSTMENT,,,', // row 5: unknown type
      '2024-06-04T10:00:00.000,Broken transfer,50,Bank,Savings,Half written,TRANSFER,50,,', // row 6: transfer missing amounts (receive side absent)
      '2024-06-05T10:00:00.000,Free lunch,,Cash,Food,No amount,EXPENSE,,,', // row 7: missing amount
      '2024-06-06T10:00:00.000,Garbage,abc,Cash,Food,Bad amount,EXPENSE,,,', // row 8: unparseable amount
      '2024-06-07T10:00:00.000,Refund,30,Bank,Income,Returned item,INCOME,,,', // row 9: converts
    ].join('\n')

    const result = convertIvyToCashew(toBytes(input))

    expect(result).toEqual({
      ok: true,
      csv: [
        'Date,Amount,Category,Title,Note,Account',
        '2024-06-01 10:00:00.000,-4.5,Food,Coffee,Espresso,Cash',
        '2024-06-07 10:00:00.000,30,Income,Refund,Returned item,Bank',
      ].join('\r\n'),
      counts: { income: 1, expense: 1, transfers: 0, skipped: 5 },
      skips: [
        { row: 4, reason: 'missing date' },
        { row: 5, reason: 'unknown transaction type: "ADJUSTMENT"' },
        { row: 6, reason: 'transfer missing amounts' },
        { row: 7, reason: 'missing amount' },
        { row: 8, reason: 'unparseable amount: "abc"' },
      ],
    })
  })

  it('numbers skips after a record whose quoted note spans two physical lines', () => {
    const input = [
      IVY_HEADER, // row 1
      '2024-07-01T09:00:00,Dinner,60,Cash,Food,"spans\ntwo lines",EXPENSE,,,', // rows 2–3
      '2024-07-02T09:00:00,Garbage,abc,Cash,Food,Bad amount,EXPENSE,,,', // row 4: skip
    ].join('\n')

    const result = convertIvyToCashew(toBytes(input))

    expect(result).toEqual({
      ok: true,
      csv: [
        'Date,Amount,Category,Title,Note,Account',
        '2024-07-01 09:00:00.000,-60,Food,Dinner,"spans\ntwo lines",Cash',
      ].join('\r\n'),
      counts: { income: 0, expense: 1, transfers: 0, skipped: 1 },
      skips: [{ row: 4, reason: 'unparseable amount: "abc"' }],
    })
  })
})

describe('convertIvyToCashew — encoding', () => {
  it('preserves non-ASCII titles, notes and accounts exactly, including transfer titles', () => {
    const input = [
      IVY_HEADER,
      '2024-07-01T08:00:00,Lương tháng bảy,15000000,Vietcombank,Lương,Khoản lương,INCOME,,,',
      '2024-07-02T09:30:00.000,Chuyển tiền tiết kiệm,5000000,Vietcombank,Tiết kiệm,,TRANSFER,5000000,5000000,TK Tiết kiệm',
    ].join('\n')

    const result = convertIvyToCashew(toBytes(input))

    expect(result).toEqual({
      ok: true,
      csv: [
        'Date,Amount,Category,Title,Note,Account',
        '2024-07-01 08:00:00.000,15000000,Lương,Lương tháng bảy,Khoản lương,Vietcombank',
        '2024-07-02 09:30:00.000,-5000000,Transfer,Transfer to TK Tiết kiệm,Chuyển tiền tiết kiệm,Vietcombank',
        '2024-07-02 09:30:00.000,5000000,Transfer,Transfer from Vietcombank,Chuyển tiền tiết kiệm,TK Tiết kiệm',
      ].join('\r\n'),
      counts: { income: 1, expense: 0, transfers: 1, skipped: 0 },
      skips: [],
    })
  })

  it('converts a BOM-prefixed file as if the BOM were absent', () => {
    const input = [
      '\uFEFF' + IVY_HEADER,
      '2024-08-01T12:00:00.000,Coffee,4.5,Cash,Food,Espresso,EXPENSE,,,',
    ].join('\n')

    const result = convertIvyToCashew(toBytes(input))

    expect(result).toEqual({
      ok: true,
      csv: [
        'Date,Amount,Category,Title,Note,Account',
        '2024-08-01 12:00:00.000,-4.5,Food,Coffee,Espresso,Cash',
      ].join('\r\n'),
      counts: { income: 0, expense: 1, transfers: 0, skipped: 0 },
      skips: [],
    })
  })

  it('replaces invalid UTF-8 bytes with U+FFFD instead of failing the file', () => {
    const encoder = new TextEncoder()
    const bytes = new Uint8Array([
      ...encoder.encode(IVY_HEADER + '\n2024-08-02T09:00:00.000,Caf'),
      0xff, // invalid UTF-8 start byte
      ...encoder.encode(',4.5,Cash,Food,Espresso,EXPENSE,,,\n'),
    ])

    const result = convertIvyToCashew(bytes.buffer as ArrayBuffer)

    expect(result).toEqual({
      ok: true,
      csv: [
        'Date,Amount,Category,Title,Note,Account',
        '2024-08-02 09:00:00.000,-4.5,Food,Caf\uFFFD,Espresso,Cash',
      ].join('\r\n'),
      counts: { income: 0, expense: 1, transfers: 0, skipped: 0 },
      skips: [],
    })
  })
})

describe('convertIvyToCashew — real 2026 export shape', () => {
  // Column order of actual 2026 exports: 15 columns, Currency included.
  const IVY_2026_HEADER =
    'Date,Title,Category,Account,Amount,Currency,Type,Transfer Amount,Transfer Currency,To Account,Receive Amount,Receive Currency,Description,Due Date,ID'
  const EXPENSE_ROW =
    '2026-08-08T16:03:00.431,Game Big Walk,Entertainment,Bank,"185,000.00",VND,EXPENSE,,,,,,,,c751b6b5-ad42-42c8-a15f-63f7af5d2b59'

  it('converts a UTF-16 BE file (BOM fe ff), as when the export was re-saved by another tool', () => {
    const result = convertIvyToCashew(toUtf16([IVY_2026_HEADER, EXPENSE_ROW].join('\n'), false))

    expect(result).toEqual({
      ok: true,
      csv: [
        'Date,Amount,Category,Title,Note,Account',
        '2026-08-08 16:03:00.431,-185000,Entertainment,Game Big Walk,,Bank',
      ].join('\r\n'),
      counts: { income: 0, expense: 1, transfers: 0, skipped: 0 },
      skips: [],
    })
  })

  it('converts a UTF-16 LE file (BOM ff fe) the same way', () => {
    const result = convertIvyToCashew(toUtf16([IVY_2026_HEADER, EXPENSE_ROW].join('\n'), true))

    expect(result).toEqual({
      ok: true,
      csv: [
        'Date,Amount,Category,Title,Note,Account',
        '2026-08-08 16:03:00.431,-185000,Entertainment,Game Big Walk,,Bank',
      ].join('\r\n'),
      counts: { income: 0, expense: 1, transfers: 0, skipped: 0 },
      skips: [],
    })
  })

  it('skips planned payments (empty Date, Due Date set) with a due-date reason', () => {
    const input = [
      IVY_2026_HEADER,
      ',Savings,Misc,Bank,"5,000,000.00",VND,INCOME,,,,,,,2026-08-25T12:00:00,c1127621-5731-435f-b9fd-dfaf4f8239af',
    ].join('\n')

    const result = convertIvyToCashew(toBytes(input))

    expect(result).toEqual({
      ok: true,
      // With no transactions, the CSV is just the header line.
      csv: 'Date,Amount,Category,Title,Note,Account\r\n',
      counts: { income: 0, expense: 0, transfers: 0, skipped: 1 },
      skips: [{ row: 2, reason: 'planned transaction (due 2026-08-25T12:00:00)' }],
    })
  })
})

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
