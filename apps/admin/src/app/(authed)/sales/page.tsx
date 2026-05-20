import { adminSdk } from "@/lib/medusa"
import { SalesView } from "./sales-view"

export const dynamic = "force-dynamic"

type Product = { id: string; title: string; thumbnail?: string | null }

async function fetchProducts(): Promise<Product[]> {
  const sdk = await adminSdk()
  const res = await sdk.admin.product.list({
    limit: 200,
    fields: "id,title,thumbnail",
  })
  return (res.products as unknown as Product[]) || []
}

export default async function SalesPage() {
  const products = await fetchProducts()
  return (
    <div>
      <header className="mb-8">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.24em] text-mc-primary">
          Performance
        </p>
        <h1 className="mt-1 font-display text-3xl font-black uppercase">Sales</h1>
        <p className="mt-2 text-sm text-mc-secondary">
          Pick one or more products and a date range to compare daily sales.
        </p>
      </header>
      <SalesView products={products} />
    </div>
  )
}
