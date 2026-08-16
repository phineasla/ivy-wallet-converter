import type { ConversionResult } from '../conversion/types'
import {
  byteSize,
  countLines,
  downloadName,
  formatBytes,
  plural,
  previewFromCsv,
} from './presentation'

/** One completed (or failed) conversion attempt, with the file it came from. */
export interface Conversion {
  fileName: string
  result: ConversionResult
}

/**
 * Renders everything a user needs to trust and take a conversion: summary
 * counts, the full skip list, a preview of the first rows, and the download.
 *
 * Converter-agnostic by design — it renders purely from `ConversionResult`
 * and knows nothing about Ivy or Cashew specifics.
 */
export function ResultsView({ conversion }: { conversion: Conversion }) {
  const { fileName, result } = conversion
  // App only mounts this view on success; keep the component total anyway.
  if (!result.ok) return null
  const csv = result.csv
  const preview = previewFromCsv(csv)
  const bytes = byteSize(csv)

  function handleDownload() {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = downloadName(fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    // Deferred so the download has started before the blob URL is released.
    setTimeout(() => URL.revokeObjectURL(url), 1_000)
  }

  return (
    <section className="results" aria-label="Conversion result">
      <section className="summary" aria-label="Conversion summary">
        <h2>
          Converted <span className="filename">{fileName}</span>
        </h2>
        <ul className="counts">
          {countLines(result.counts).map(({ value, unit }) => (
            <li key={unit}>
              <strong>{value}</strong> {unit}
            </li>
          ))}
        </ul>
      </section>

      {result.skips.length > 0 && (
        <details className="skips">
          <summary>Skipped rows ({result.skips.length})</summary>
          <ul>
            {result.skips.map((skip) => (
              <li key={skip.row}>
                row {skip.row}: {skip.reason}
              </li>
            ))}
          </ul>
        </details>
      )}

      <section className="preview" aria-label="Preview of converted rows">
        <h2>Preview</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {preview.columns.map((column, index) => (
                  <th key={index} scope="col">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {preview.columns.map((_column, cellIndex) => (
                    <td key={cellIndex}>{row[cellIndex] ?? ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {preview.totalRows > preview.rows.length && (
          <p className="preview-note">
            Showing the first {preview.rows.length} of {preview.totalRows}{' '}
            rows — the download contains all of them. Long values are trimmed
            for readability here but kept in full in the file.
          </p>
        )}
      </section>

      <button
        type="button"
        className="download-button"
        onClick={handleDownload}
      >
        Download CSV ({preview.totalRows}{' '}
        {plural(preview.totalRows, 'row', 'rows')} · {formatBytes(bytes)})
      </button>
      <p className="download-as">
        Saves as <span className="filename">{downloadName(fileName)}</span>
      </p>
    </section>
  )
}
