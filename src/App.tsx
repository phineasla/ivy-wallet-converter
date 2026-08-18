import { useState } from 'react'
import { convertIvyToCashew } from './conversion/convert'
import type { ConversionResult } from './conversion/types'
import { Dropzone } from './dropzone/Dropzone'
import { ResultsView, type Conversion } from './results/ResultsView'
import { summarySentence } from './results/presentation'
import './App.css'

function App() {
  const [conversion, setConversion] = useState<Conversion | null>(null)
  // Increments per accepted file: remounts the results view so a new file
  // starts fresh (no inherited expand/scroll state), and alternates an
  // invisible zero-width space in the live region — live regions only
  // announce on *change*, so re-converting the same file stays announced.
  const [attempt, setAttempt] = useState(0)

  // Each accepted file replaces the previous conversion wholesale, so no
  // counts, preview, or download from an earlier file can survive it. The
  // attempt counter and result land in one commit — the old view never
  // re-renders with the new attempt number but stale data.
  async function handleAccept(file: File) {
    let result: ConversionResult
    try {
      result = convertIvyToCashew(await file.arrayBuffer())
    } catch {
      result = {
        ok: false,
        error: `"${file.name}" could not be read — please try selecting it again.`,
      }
    }
    setAttempt((n) => n + 1)
    setConversion({ fileName: file.name, result })
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

      <Dropzone onAccept={handleAccept} />

      {/* Persistent live region: each conversion's summary text changes in
          place, so screen readers reliably announce it. Errors use the alert
          role below. */}
      <p role="status" className="sr-only">
        {conversion?.result.ok
          ? summarySentence(conversion.fileName, conversion.result.counts) +
            '\u200b'.repeat(attempt % 2)
          : ''}
      </p>

      {conversion && !conversion.result.ok && (
        <p className="error" role="alert">
          {conversion.result.error}
        </p>
      )}

      {conversion?.result.ok && (
        <ResultsView key={attempt} conversion={conversion} />
      )}
    </main>
  )
}

export default App
