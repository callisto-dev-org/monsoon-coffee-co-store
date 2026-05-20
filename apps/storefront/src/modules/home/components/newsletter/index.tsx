export default function Newsletter() {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-6 bg-muted px-6 py-14 font-family-heading sm:px-8 sm:py-16 lg:gap-8">
      <span className="text-center text-3xl font-bold text-surface sm:text-4xl lg:text-5xl">
        JOIN THE ROASTER&apos;S LIST.
      </span>
      <span className="text-center text-base text-surface/80 sm:text-lg">
        Exclusive access to micro-lot drops and seasonal cupping notes.
      </span>
      <form className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:gap-4">
        <input
          type="email"
          placeholder="Your Email Address"
          className="w-full border-2 border-white/80 bg-transparent p-4 uppercase text-white placeholder:text-white/60 sm:w-3/4"
        />
        <button
          type="submit"
          className="w-full bg-accent p-4 px-8 font-semibold uppercase text-surface transition-colors hover:bg-accent/90 sm:w-auto sm:px-12"
        >
          Subscribe
        </button>
      </form>
    </section>
  )
}
