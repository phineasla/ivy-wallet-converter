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

  const text = decodeText(bytes)

  const { transactions, counts, skips } = converter.parse(text)
  return {
    ok: true,
    csv: converter.serialize(transactions),
    counts: { ...counts, skipped: skips.length },
    skips,
  }
}

function decodeText(bytes: ArrayBuffer): string {
  const prefix = new Uint8Array(bytes)
  if (prefix[0] === 0xff && prefix[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes)
  }
  if (prefix[0] === 0xfe && prefix[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes)
  }
  return new TextDecoder('utf-8').decode(bytes)
}
