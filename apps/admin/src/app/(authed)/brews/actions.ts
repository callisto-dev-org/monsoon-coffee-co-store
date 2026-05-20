"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { SESSION_COOKIE } from "@/lib/session"

const BACKEND = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

async function authedFetch<T>(
  path: string,
  init?: RequestInit
): Promise<ActionResult<T>> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return { ok: false, error: "Not authenticated." }
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
      cache: "no-store",
    })
    if (!res.ok) {
      const body = await res.text()
      return {
        ok: false,
        error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}`,
      }
    }
    const text = await res.text()
    const json = text ? (JSON.parse(text) as T) : (undefined as T)
    return { ok: true, data: json }
  } catch (e: any) {
    return { ok: false, error: e?.message || "Request failed." }
  }
}

export type ParamSchemaItem = { key: string; label: string; unit?: string }
export type StepDef = { name: string; description: string }

export type CreateBrewMethodInput = {
  slug: string
  name: string
  method_label?: string | null
  summary?: string | null
  image_url?: string | null
  param_schema?: ParamSchemaItem[] | null
  steps?: StepDef[] | null
}

export async function createBrewMethod(input: CreateBrewMethodInput) {
  const res = await authedFetch<{ brew_method: { id: string } }>(
    "/admin/brew-methods",
    { method: "POST", body: JSON.stringify(input) }
  )
  if (res.ok) {
    revalidatePath("/brews")
    revalidatePath("/inventory")
  }
  return res
}

export async function updateBrewMethod(
  id: string,
  input: Partial<CreateBrewMethodInput>
) {
  const res = await authedFetch(`/admin/brew-methods/${id}`, {
    method: "POST",
    body: JSON.stringify(input),
  })
  if (res.ok) {
    revalidatePath("/brews")
    revalidatePath("/inventory")
  }
  return res
}

export async function deleteBrewMethod(id: string) {
  const res = await authedFetch(`/admin/brew-methods/${id}`, {
    method: "DELETE",
  })
  if (res.ok) {
    revalidatePath("/brews")
    revalidatePath("/inventory")
  }
  return res
}

export type CreateBrewRecipeInput = {
  product_id: string
  brew_method_id: string
  title?: string | null
  summary?: string | null
  params?: Record<string, unknown> | null
  steps?: StepDef[] | null
}

export async function createBrewRecipe(input: CreateBrewRecipeInput) {
  const res = await authedFetch("/admin/brew-recipes", {
    method: "POST",
    body: JSON.stringify(input),
  })
  if (res.ok) revalidatePath("/inventory")
  return res
}

export async function updateBrewRecipe(
  id: string,
  input: Partial<Omit<CreateBrewRecipeInput, "product_id" | "brew_method_id">>
) {
  const res = await authedFetch(`/admin/brew-recipes/${id}`, {
    method: "POST",
    body: JSON.stringify(input),
  })
  if (res.ok) revalidatePath("/inventory")
  return res
}

export async function deleteBrewRecipe(id: string) {
  const res = await authedFetch(`/admin/brew-recipes/${id}`, {
    method: "DELETE",
  })
  if (res.ok) revalidatePath("/inventory")
  return res
}
