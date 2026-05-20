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
import { updateProduct } from "./actions"

export type EditableProduct = {
  id: string
  title: string
  handle?: string | null
  status?: string | null
  description?: string | null
  thumbnail?: string | null
  images?: string[]
}

export function EditProductModal({
  open,
  onClose,
  product,
}: {
  open: boolean
  onClose: () => void
  product: EditableProduct
}) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(product.title || "")
  const [handle, setHandle] = useState(product.handle || "")
  const [status, setStatus] = useState<string>(product.status || "draft")
  const [description, setDescription] = useState(product.description || "")
  const [images, setImages] = useState<string[]>(() => {
    // Seed with existing images; fall back to thumbnail if images list is empty.
    if (product.images?.length) return [...product.images]
    return product.thumbnail ? [product.thumbnail] : []
  })

  function close() {
    if (pending) return
    setError(null)
    onClose()
  }

  function submit() {
    setError(null)
    start(async () => {
      const res = await updateProduct({
        id: product.id,
        title,
        handle: handle || undefined,
        status: status as any,
        description,
        images,
      })
      if (res.ok) onClose()
      else setError(res.error)
    })
  }

  return (
    <Modal open={open} onClose={close} title="Edit product" subtitle={product.id} size="lg">
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
          />
        </FormRow>

        <div className="grid grid-cols-2 gap-4">
          <FormRow label="Handle">
            <input
              className={inputCls}
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
          </FormRow>
          <FormRow label="Status">
            <select
              className={inputCls}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="proposed">Proposed</option>
              <option value="rejected">Rejected</option>
            </select>
          </FormRow>
        </div>

        <FormRow label="Description">
          <textarea
            className={inputCls + " min-h-[100px]"}
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
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
