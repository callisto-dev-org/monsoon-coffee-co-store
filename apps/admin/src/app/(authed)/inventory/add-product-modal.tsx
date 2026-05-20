"use client"

import { useState, useTransition } from "react"
import {
  Modal,
  FormRow,
  inputCls,
  btnPrimaryCls,
  btnGhostCls,
} from "@/components/modal"
import { ImageManager } from "@/components/image-manager"
import { createProduct } from "./actions"

export function AddProductModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [handle, setHandle] = useState("")
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [description, setDescription] = useState("")
  const [images, setImages] = useState<string[]>([])

  function reset() {
    setTitle("")
    setHandle("")
    setStatus("draft")
    setDescription("")
    setImages([])
    setError(null)
  }

  function close() {
    if (pending) return
    reset()
    onClose()
  }

  function submit() {
    setError(null)
    start(async () => {
      const res = await createProduct({
        title,
        handle: handle || undefined,
        status,
        description: description || undefined,
        images: images.length ? images : undefined,
      })
      if (res.ok) {
        reset()
        onClose()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="New product"
      subtitle="Create a product shell. Add variants from Manage variants."
      size="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="space-y-5"
      >
        <FormRow label="Title">
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </FormRow>

        <div className="grid grid-cols-2 gap-4">
          <FormRow label="Handle" hint="Lowercase, dashed. Leave empty to auto-generate.">
            <input
              className={inputCls}
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="auto"
            />
          </FormRow>
          <FormRow label="Status">
            <select
              className={inputCls}
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </FormRow>
        </div>

        <FormRow label="Description">
          <textarea
            className={inputCls + " min-h-[80px]"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormRow>

        <ImageManager images={images} onChange={setImages} />

        {error && (
          <p className="border-l-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" className={btnGhostCls} onClick={close} disabled={pending}>
            Cancel
          </button>
          <button type="submit" className={btnPrimaryCls} disabled={pending}>
            {pending ? "Creating…" : "Create product"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
