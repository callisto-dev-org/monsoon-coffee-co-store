"use client"

import { useEffect, useState } from "react"
import { usePathname, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { CartIcon } from "@modules/common/icons/monsoon/cart"

type MonsoonHeaderProps = {
  cartItemCount: number
  isAuthenticated: boolean
}

export default function MonsoonHeader({
  cartItemCount,
  isAuthenticated,
}: MonsoonHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { countryCode } = useParams() as { countryCode?: string }
  const prefix = countryCode ? `/${countryCode}` : ""

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const linkClass = (href: string) => {
    const isActive = pathname === href || pathname?.startsWith(href + "/")
    return `pb-1 before:absolute before:transition-all relative before:bottom-0 before:w-full before:border-b-0 before:border-mc-primary before:origin-center ${
      isActive ? "before:scale-100" : "before:scale-0 hover:before:scale-100"
    }`
  }

  return (
    <header className="border-b border-ink/80 bg-surface px-6 py-2 text-ink">
      <div className="mx-auto flex h-fit w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            href={`${prefix}/`}
            className="flex items-center"
            aria-label="Monsoon Coffee Co. — home"
          >
            <Image
              src="/monsoon/images/logo.png"
              alt="Monsoon Coffee Co."
              width={112}
              height={112}
              priority
              className="h-16 w-auto sm:h-20"
            />
          </Link>
        </div>

        <nav className="hidden items-center gap-8 font-family-heading text-sm font-semibold uppercase tracking-[0.16em] md:flex">
          <Link className={linkClass(`${prefix}/`)} href={`${prefix}/`}>
            Home
          </Link>
          <Link className={linkClass(`${prefix}/store`)} href={`${prefix}/store`}>
            Shop
          </Link>
          <Link className={linkClass(`${prefix}/about`)} href={`${prefix}/about`}>
            About
          </Link>
          <Link
            className={linkClass(`${prefix}/contact`)}
            href={`${prefix}/contact`}
          >
            Contact
          </Link>
        </nav>

        <div className="flex h-full w-fit items-center gap-5">
          <Link
            href={`${prefix}/cart`}
            className="relative hidden text-ink transition-colors hover:text-accent h-full w-fit sm:inline-flex cursor-pointer"
            aria-label="Cart"
          >
            <CartIcon className="h-6 w-fit" />
            {cartItemCount > 0 && (
              <span className="absolute -right-3 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-surface">
                {cartItemCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <Link
              href={`${prefix}/account`}
              className="hidden font-family-heading text-sm font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:text-accent sm:inline-flex"
            >
              Account
            </Link>
          ) : (
            <div className="hidden items-center gap-3 font-family-heading text-sm font-semibold uppercase tracking-[0.16em] sm:flex">
              <Link
                href={`${prefix}/auth/login`}
                className="text-ink transition-colors hover:text-accent"
              >
                Login
              </Link>
              <span className="text-ink/30">/</span>
              <Link
                href={`${prefix}/auth/register`}
                className="text-accent transition-colors hover:text-ink"
              >
                Register
              </Link>
            </div>
          )}

          <button
            type="button"
            className="inline-flex flex-col items-center justify-center gap-1.5 p-2 text-ink md:hidden"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-site-menu"
          >
            <span
              className={`h-0.5 w-6 bg-ink transition-transform duration-200 ${
                isMenuOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`h-0.5 w-6 bg-ink transition-opacity duration-200 ${
                isMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`h-0.5 w-6 bg-ink transition-transform duration-200 ${
                isMenuOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      <div
        id="mobile-site-menu"
        className={`overflow-hidden border-ink/20 transition-all duration-300 md:hidden ${
          isMenuOpen ? "max-h-[28rem]" : "max-h-0"
        }`}
      >
        <nav className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 py-6 font-family-heading text-sm font-semibold uppercase tracking-[0.14em]">
          <Link className={linkClass(`${prefix}/store`)} href={`${prefix}/store`}>
            Shop
          </Link>
          <Link className={linkClass(`${prefix}/`)} href={`${prefix}/`}>
            Story
          </Link>
          <Link className={linkClass(`${prefix}/about`)} href={`${prefix}/about`}>
            About
          </Link>
          <Link
            className={linkClass(`${prefix}/contact`)}
            href={`${prefix}/contact`}
          >
            Contact
          </Link>

          <div className="mt-2 flex items-center gap-5 border-t border-ink/20 pt-4">
            <Link
              href={`${prefix}/cart`}
              className="relative inline-flex cursor-pointer items-center gap-2 text-ink transition-colors hover:text-accent"
              aria-label="Cart"
            >
              <CartIcon className="h-6 w-fit" />
              <span>Bag</span>
              {cartItemCount > 0 && (
                <span className="absolute -right-3 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-surface">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>

          {isAuthenticated ? (
            <Link
              href={`${prefix}/account`}
              className="text-ink transition-colors hover:text-accent"
            >
              Account
            </Link>
          ) : (
            <div className="flex items-center gap-3 text-ink">
              <Link
                href={`${prefix}/auth/login`}
                className="transition-colors hover:text-accent"
              >
                Login
              </Link>
              <span className="text-ink/30">/</span>
              <Link
                href={`${prefix}/auth/register`}
                className="text-accent transition-colors hover:text-ink"
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
