import './registry'
import { getConverter } from './registry'
import type { ConversionResult } from './types'

/**
 * Convert an Ivy Wallet export to a Cashew import CSV, entirely from raw bytes.
 * The single pure seam of the site: decode → parse → map → serialize, no mocks.
 */
export function convertIvyToCashew(bytes: ArrayBuffer): ConversionResult {
  return convertWith('ivy-to-cashew', bytes)
}

/** Run any registered converter over raw input bytes. */
export function convertWith(id: string, bytes: ArrayBuffer): ConversionResult {
  const converter = getConverter(id)
  if (!converter) {
    return { ok: false, error: `Unknown converter: "${id}"` }
  }

  let text: string
  try {
    // Fatal + BOM-stripping: TextDecoder removes a leading UTF-8 BOM by default.
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return {
      ok: false,
      error:
        'File is not valid UTF-8. Please re-export your CSV from Ivy Wallet and try again.',
    }
  }

  const { transactions, counts, skips } = converter.parse(text)
  return {
    ok: true,
    csv: converter.serialize(transactions),
    counts: { ...counts, skipped: skips.length },
    skips,
  }
}
