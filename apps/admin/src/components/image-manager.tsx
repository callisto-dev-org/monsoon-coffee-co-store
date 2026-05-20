"use client"

import { useRef, useState, useTransition } from "react"
import { uploadImages } from "@/app/(authed)/inventory/actions"

export function ImageManager({
  images,
  onChange,
}: {
  images: string[]
  onChange: (next: string[]) => void
}) {
  const [urlInput, setUrlInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [uploading, startUpload] = useTransition()
  const [draggingOverList, setDraggingOverList] = useState(false)
  const dragIndex = useRef<number | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  function addUrl() {
    const url = urlInput.trim()
    if (!url) return
    if (images.includes(url)) {
      setError("That URL is already in the list.")
      return
    }
    setError(null)
    onChange([...images, url])
    setUrlInput("")
  }

  function removeAt(i: number) {
    onChange(images.filter((_, idx) => idx !== i))
  }

  function onDragStart(i: number) {
    return (e: React.DragEvent) => {
      dragIndex.current = i
      e.dataTransfer.effectAllowed = "move"
    }
  }

  function onDragOverTile(i: number) {
    return (e: React.DragEvent) => {
      e.preventDefault()
      if (dragIndex.current == null || dragIndex.current === i) return
      const from = dragIndex.current
      const next = [...images]
      const [moved] = next.splice(from, 1)
      next.splice(i, 0, moved)
      dragIndex.current = i
      onChange(next)
    }
  }

  function onDragEnd() {
    dragIndex.current = null
  }

  function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"))
    if (!arr.length) return
    setError(null)
    const fd = new FormData()
    for (const f of arr) fd.append("files", f, f.name)
    startUpload(async () => {
      const res = await uploadImages(fd)
      if (res.ok) {
        const uploaded = res.data?.urls || []
        onChange([...images, ...uploaded])
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-mc-secondary">
        Images
      </p>

      {/* Tiles + drop zone */}
      <div
        onDragOver={(e) => {
          // Allow dropping external files anywhere on the grid area.
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault()
            setDraggingOverList(true)
          }
        }}
        onDragLeave={() => setDraggingOverList(false)}
        onDrop={(e) => {
          setDraggingOverList(false)
          if (e.dataTransfer.files?.length) {
            e.preventDefault()
            handleFiles(e.dataTransfer.files)
          }
        }}
        className={`mt-2 grid grid-cols-3 gap-2 border-2 border-dashed p-2 sm:grid-cols-4 ${
          draggingOverList ? "border-mc-primary bg-mc-primary/5" : "border-mc-ink/25"
        }`}
      >
        {images.length === 0 && (
          <div className="col-span-full grid h-28 place-items-center text-xs text-mc-secondary">
            Drop image files here, or add a URL below.
          </div>
        )}

        {images.map((url, i) => (
          <div
            key={`${url}-${i}`}
            draggable
            onDragStart={onDragStart(i)}
            onDragOver={onDragOverTile(i)}
            onDragEnd={onDragEnd}
            className="group relative aspect-square cursor-grab overflow-hidden border-2 border-mc-ink/30 bg-mc-ink/5 active:cursor-grabbing"
            title={url}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1 top-1 border border-mc-ink bg-mc-primary px-1.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-widest text-mc-ink">
                main
              </span>
            )}
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label="Remove image"
              className="absolute right-1 top-1 hidden h-6 w-6 place-items-center border border-mc-ink bg-mc-surface text-mc-ink group-hover:grid hover:bg-red-100 hover:text-red-700"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 2l8 8M10 2L2 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="square"
                />
              </svg>
            </button>
            <span className="absolute bottom-1 left-1 border border-mc-ink/40 bg-mc-surface/90 px-1 font-mono text-[10px] text-mc-secondary">
              {i + 1}
            </span>
          </div>
        ))}
      </div>

      {/* Inputs */}
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addUrl()
            }
          }}
          placeholder="https://image-url…"
          className="flex-1 min-w-[200px] border-2 border-mc-ink/30 bg-transparent px-3 py-2 text-sm outline-none focus:border-mc-primary"
        />
        <button
          type="button"
          onClick={addUrl}
          disabled={!urlInput.trim()}
          className="border-2 border-mc-ink/30 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-mc-secondary hover:border-mc-ink hover:text-mc-ink disabled:opacity-50"
        >
          Add URL
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="border-2 border-mc-ink bg-mc-ink px-3 py-2 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-mc-surface hover:bg-mc-accent hover:border-mc-accent disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload files"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      <p className="mt-1.5 text-[11px] text-mc-secondary">
        Drag the tiles to reorder. The first image is used as the thumbnail.
      </p>

      {error && (
        <p className="mt-2 border-l-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
