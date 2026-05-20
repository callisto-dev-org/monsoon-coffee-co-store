export default function Footer() {
  return (
    <footer className="w-full flex flex-col gap-6 bg-ink py-8 px-12 font-family-heading text-surface">
      <div className="w-full flex items-center justify-center">
        <span className="uppercase">Monsoon Coffee Co.</span>
        <span className="opacity-80 ml-auto text-sm">
          © {new Date().getFullYear()} MONSOON COFFEE CO. ALL RIGHTS RESERVED.
        </span>
      </div>
    </footer>
  )
}
