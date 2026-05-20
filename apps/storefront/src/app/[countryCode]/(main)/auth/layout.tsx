export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="w-full px-6 py-16 sm:py-24 lg:py-32 bg-surface min-h-[70vh]">
      {children}
    </main>
  )
}
