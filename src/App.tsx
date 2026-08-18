import { useRef, useState } from 'react'
import { convertIvyToCashew } from './conversion/convert'
import { Dropzone } from './dropzone/Dropzone'
import { ResultsView, type Conversion } from './results/ResultsView'
import { summarySentence } from './results/presentation'
import './App.css'

function App() {
  const [conversion, setConversion] = useState<Conversion | null>(null)
  // Live regions only announce on *change*; alternating an invisible
  // zero-width space keeps re-converting the same file announced too.
  const announcementCount = useRef(0)

  // Each accepted file replaces the previous conversion wholesale, so no
  // counts, preview, or download from an earlier file can survive it.
  async function handleAccept(file: File) {
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

      <Dropzone onAccept={handleAccept} />

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

      {/* Keyed by filename: a new file starts from a fresh results view
          instead of inheriting expand/scroll state from the previous one. */}
      {conversion?.result.ok && (
        <ResultsView key={conversion.fileName} conversion={conversion} />
      )}
    </main>
  )
}

export default App
