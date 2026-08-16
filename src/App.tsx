import { useState } from 'react'
import { convertIvyToCashew } from './conversion/convert'
import type { ConversionResult } from './conversion/types'
import { ResultsView } from './results/ResultsView'
import { summarySentence } from './results/presentation'
import './App.css'

/** One completed (or failed) conversion attempt, with the file it came from. */
interface Conversion {
  fileName: string
  result: ConversionResult
}

function App() {
  const [conversion, setConversion] = useState<Conversion | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setConversion({
      fileName: file.name,
      result: convertIvyToCashew(await file.arrayBuffer()),
    })
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

      {/* Persistent live region: each conversion's summary text changes in
          place, so screen readers reliably announce it. Errors use the alert
          role below. */}
      <p role="status" className="sr-only">
        {conversion?.result.ok
          ? summarySentence(conversion.fileName, conversion.result.counts)
          : ''}
      </p>

      {conversion && !conversion.result.ok && (
        <p className="error" role="alert">
          {conversion.result.error}
        </p>
      )}

      {conversion?.result.ok && (
        <ResultsView result={conversion.result} fileName={conversion.fileName} />
      )}
    </main>
  )
}

export default App
