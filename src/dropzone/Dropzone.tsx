import {
  useEffect,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
} from 'react'

/**
 * The file-input half of the app: a drop zone that also opens the system
 * picker on click, keyboard, and tap. Owns input *validation* — exactly one
 * `.csv` — and its feedback; accepted files are handed up for conversion.
 */

/** A file counts as a CSV by extension (any case) or by MIME type. */
function isCsv(file: File): boolean {
  return file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv'
}

/** Why a non-empty selection is refused, or null when it is exactly one CSV. */
function selectionError(files: FileList): string | null {
  if (files.length > 1) {
    return 'One file at a time — drop or pick a single Ivy Wallet export.'
  }
  const file = files[0]
  if (!isCsv(file)) {
    return `"${file.name}" is not a CSV. Export your transactions from Ivy Wallet and drop the .csv file.`
  }
  return null
}

export function Dropzone({ onAccept }: { onAccept: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // dragenter/dragleave also fire for every child element inside the zone;
  // only the outermost transition (depth 0 → 1 and back) toggles the state.
  const dragDepth = useRef(0)

  // A drop that misses the zone must not make the browser navigate to the
  // file — that would throw away the page and any conversion on it.
  useEffect(() => {
    const swallow = (event: globalThis.DragEvent) => event.preventDefault()
    document.addEventListener('dragover', swallow)
    document.addEventListener('drop', swallow)
    return () => {
      document.removeEventListener('dragover', swallow)
      document.removeEventListener('drop', swallow)
    }
  }, [])

  function handleSelect(files: FileList | null) {
    if (!files || files.length === 0) return // picker cancelled — nothing chosen
    const message = selectionError(files)
    setError(message) // null clears a previous rejection on the next attempt
    if (!message) onAccept(files[0])
  }

  function handleDragEnter() {
    dragDepth.current += 1
    setDragging(true)
  }

  function handleDragLeave() {
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setDragging(false)
  }

  function handleDragOver(event: ReactDragEvent<HTMLButtonElement>) {
    // Required for the browser to treat the zone as a drop target.
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  function handleDrop(event: ReactDragEvent<HTMLButtonElement>) {
    event.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    handleSelect(event.dataTransfer.files)
  }

  return (
    <div className="dropzone-wrap">
      {/* A real button: Enter/Space natively activate it, and the picker
          opens through the visually hidden input next to it. */}
      <button
        type="button"
        className={dragging ? 'dropzone dragover' : 'dropzone'}
        onClick={() => inputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <svg
          className="dropzone-icon"
          viewBox="0 0 24 24"
          width="34"
          height="34"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path
            d="M12 16V4m0 0L8 8m4-4l4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 16v3a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-3"
            strokeLinecap="round"
          />
        </svg>
        <span className="dropzone-title">Drop your Ivy Wallet export here</span>
        <span className="dropzone-hint">or click to choose a .csv file</span>
      </button>
      {/* Operated only through the button, so kept out of the tab order and
          the accessibility tree. */}
      <input
        ref={inputRef}
        className="dropzone-input"
        type="file"
        accept=".csv,text/csv"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          handleSelect(event.target.files)
          // Re-selecting the same file must fire change again.
          event.target.value = ''
        }}
      />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
