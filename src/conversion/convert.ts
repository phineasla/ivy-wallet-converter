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

  const text = new TextDecoder('utf-8').decode(bytes)

  const { transactions, counts, skips } = converter.parse(text)
  return {
    ok: true,
    csv: converter.serialize(transactions),
    counts: { ...counts, skipped: skips.length },
    skips,
  }
}
