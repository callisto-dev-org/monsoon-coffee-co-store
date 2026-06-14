import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-surface relative min-h-screen text-ink">
      <header className="border-b-2 border-ink bg-surface">
        <nav className="mx-auto flex h-16 items-center justify-between px-6 sm:px-10 lg:px-12 max-w-7xl">
          <LocalizedClientLink
            href="/cart"
            className="font-family-heading text-xs font-bold uppercase tracking-[0.18em] underline underline-offset-4 hover:text-accent"
            data-testid="back-to-cart-link"
          >
            ← Back to Cart
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="font-family-heading text-base font-bold uppercase tracking-[0.06em]"
            data-testid="store-link"
          >
            Monsoon Coffee Co.
          </LocalizedClientLink>
          <span className="hidden sm:block font-family-heading text-xs font-bold uppercase tracking-[0.18em] text-ink/50">
            Secure Checkout
          </span>
        </nav>
      </header>
      <div data-testid="checkout-container">{children}</div>
      <footer className="border-t border-ink/15 py-6 text-center font-family-heading text-xs uppercase tracking-[0.16em] text-ink/55">
        © {new Date().getFullYear()} Monsoon Coffee Co.
      </footer>
    </div>
  )
}
