import { useRef, useState } from 'react'
import { convertIvyToCashew } from './conversion/convert'
import { ResultsView, type Conversion } from './results/ResultsView'
import { summarySentence } from './results/presentation'
import './App.css'

function App() {
  const [conversion, setConversion] = useState<Conversion | null>(null)
  // Live regions only announce on *change*; alternating an invisible
  // zero-width space keeps re-converting the same file announced too.
  const announcementCount = useRef(0)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setConversion({
      fileName: file.name,
      result: convertIvyToCashew(await file.arrayBuffer()),
    })
    announcementCount.current += 1
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
          ? summarySentence(conversion.fileName, conversion.result.counts) +
            '\u200b'.repeat(announcementCount.current % 2)
          : ''}
      </p>

      {conversion && !conversion.result.ok && (
        <p className="error" role="alert">
          {conversion.result.error}
        </p>
      )}

      {conversion?.result.ok && <ResultsView conversion={conversion} />}
    </main>
  )
}

export default App
