import { useMemo } from 'react'
import type { ConversionSuccess } from '../conversion/types'
import {
  byteSize,
  downloadName,
  formatBytes,
  plural,
  previewFromCsv,
} from './presentation'

interface ResultsViewProps {
  result: ConversionSuccess
  fileName: string
}

/**
 * Renders everything a user needs to trust and take a conversion: summary
 * counts, the full skip list, a preview of the first rows, and the download.
 *
 * Converter-agnostic by design — it renders purely from `ConversionResult`
 * and knows nothing about Ivy or Cashew specifics.
 */
export function ResultsView({ result, fileName }: ResultsViewProps) {
  const preview = useMemo(() => previewFromCsv(result.csv), [result])
  const bytes = useMemo(() => byteSize(result.csv), [result])
  const { income, expense, transfers, skipped } = result.counts

  function handleDownload() {
    const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = downloadName(fileName)
    // The anchor must be in the document for the click to start a download,
    // and the URL can only be revoked once the download has been kicked off.
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url))
  }

  return (
    <section className="results" aria-label="Conversion result">
      <section className="summary" aria-label="Conversion summary">
        <h2>
          Converted <span className="filename">{fileName}</span>
        </h2>
        <ul className="counts">
          <li>
            <strong>{income}</strong> income
          </li>
          <li>
            <strong>{expense}</strong> {plural(expense, 'expense', 'expenses')}
          </li>
          <li>
            <strong>{transfers}</strong>{' '}
            {plural(transfers, 'transfer', 'transfers')}
            {transfers > 0 && (
              <span className="split-note">
                {' '}
                (split into {transfers * 2} rows)
              </span>
            )}
          </li>
          <li>
            <strong>{skipped}</strong> {plural(skipped, 'row', 'rows')} skipped
          </li>
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

      <button type="button" className="download-button" onClick={handleDownload}>
        Download CSV ({preview.totalRows} {plural(preview.totalRows, 'row', 'rows')} ·{' '}
        {formatBytes(bytes)})
      </button>
      <p className="download-as">
        Saves as <span className="filename">{downloadName(fileName)}</span>
      </p>
    </section>
  )
}
