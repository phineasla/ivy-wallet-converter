import { useState } from 'react'
import { convertIvyToCashew } from './conversion/convert'
import type { ConversionResult } from './conversion/types'
import './App.css'

function App() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [result, setResult] = useState<ConversionResult | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setFileName(file.name)
    setResult(convertIvyToCashew(await file.arrayBuffer()))
  }

  return (
    <main>
      <h1>Ivy Wallet → Cashew</h1>
      <p className="tagline">
        Convert an Ivy Wallet transaction export into a Cashew-ready CSV.
      </p>
      <p className="privacy">
        Everything runs locally in your browser. Your file never leaves your
        device — nothing is uploaded, stored, or sent anywhere.
      </p>

      <label className="pick-button">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            void handleFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
        Choose Ivy export file (.csv)
      </label>

      {result && !result.ok && (
        <p className="error" role="alert">
          {result.error}
        </p>
      )}

      {result?.ok && (
        <section className="summary" aria-label="Conversion summary">
          <h2>
            Converted <span className="filename">{fileName}</span>
          </h2>
          <ul className="counts">
            <li>
              <strong>{result.counts.income}</strong> income
            </li>
            <li>
              <strong>{result.counts.expense}</strong> expenses
            </li>
            <li>
              <strong>{result.counts.transfers}</strong> transfers
            </li>
            <li>
              <strong>{result.counts.skipped}</strong> skipped
            </li>
          </ul>
        </section>
      )}
    </main>
  )
}

export default App
