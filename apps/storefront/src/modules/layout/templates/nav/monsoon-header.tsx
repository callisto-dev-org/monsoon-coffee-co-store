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

  // On the home page the header floats transparently over the hero video; every
  // other route keeps the solid surface bar with dark ink text.
  const onHome = pathname === prefix || pathname === `${prefix}/`

  // Tone tokens flip to light over the dark hero, dark on solid pages.
  const textTone = onHome ? "text-surface" : "text-ink"
  const barTone = onHome ? "bg-surface" : "bg-ink"
  const dividerTone = onHome ? "text-surface/40" : "text-ink/30"

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
    <header
      className={`px-6 py-2 ${
        onHome
          ? "absolute inset-x-0 top-0 z-50 bg-transparent " + textTone
          : "relative border-b border-ink/80 bg-surface text-ink"
      }`}
    >
      <div className="mx-auto flex h-fit w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-3">
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
              className={`h-16 w-auto sm:h-20 ${
                onHome ? "brightness-0 invert" : ""
              }`}
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

        <div className="flex h-full flex-1 items-center justify-end gap-5">
          <Link
            href={`${prefix}/cart`}
            className={`relative hidden ${textTone} transition-colors hover:text-accent h-full w-fit sm:inline-flex cursor-pointer`}
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
              className={`hidden font-family-heading text-sm font-semibold uppercase tracking-[0.16em] ${textTone} transition-colors hover:text-accent sm:inline-flex`}
            >
              Account
            </Link>
          ) : (
            <div className="hidden items-center gap-3 font-family-heading text-sm font-semibold uppercase tracking-[0.16em] sm:flex">
              <Link
                href={`${prefix}/auth/login`}
                className={`${textTone} transition-colors hover:text-accent`}
              >
                Login
              </Link>
              <span className={dividerTone}>/</span>
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
            className={`inline-flex flex-col items-center justify-center gap-1.5 p-2 ${textTone} md:hidden`}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-site-menu"
          >
            <span
              className={`h-0.5 w-6 ${barTone} transition-transform duration-200 ${
                isMenuOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`h-0.5 w-6 ${barTone} transition-opacity duration-200 ${
                isMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`h-0.5 w-6 ${barTone} transition-transform duration-200 ${
                isMenuOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      <div
        id="mobile-site-menu"
        className={`overflow-hidden border-ink/20 transition-all duration-300 md:hidden ${
          onHome ? "bg-ink text-surface" : ""
        } ${isMenuOpen ? "max-h-[28rem]" : "max-h-0"}`}
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
              className={`relative inline-flex cursor-pointer items-center gap-2 ${textTone} transition-colors hover:text-accent`}
              aria-label="Cart"
            >
              <CartIcon className="h-6 w-fit" />
              <span>Cart</span>
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
              className={`${textTone} transition-colors hover:text-accent`}
            >
              Account
            </Link>
          ) : (
            <div className={`flex items-center gap-3 ${textTone}`}>
              <Link
                href={`${prefix}/auth/login`}
                className="transition-colors hover:text-accent"
              >
                Login
              </Link>
              <span className={dividerTone}>/</span>
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
