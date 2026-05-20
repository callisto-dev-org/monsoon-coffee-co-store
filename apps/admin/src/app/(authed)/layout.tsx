import { redirect } from "next/navigation"
import Link from "next/link"
import { hasSession } from "@/lib/session"
import { logoutAction } from "../login/actions"

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasSession())) redirect("/login")

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-mc-ink bg-mc-surface">
        <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-5">
          <Link href="/inventory" className="font-display text-lg font-black uppercase tracking-wide">
            Monsoon <span className="text-mc-primary">·</span> Admin
          </Link>
          <nav className="flex items-center gap-1 ml-2">
            <NavLink href="/inventory">Inventory</NavLink>
            <NavLink href="/sales">Sales</NavLink>
            <NavLink href="/brews">Brews</NavLink>
            <NavLink href="/reviews">Reviews</NavLink>
          </nav>
          <form action={logoutAction} className="ml-auto">
            <button
              type="submit"
              className="border border-mc-ink/30 px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-mc-secondary hover:border-mc-ink hover:text-mc-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 font-display text-xs font-bold uppercase tracking-[0.18em] text-mc-secondary hover:text-mc-ink"
    >
      {children}
    </Link>
  )
}
