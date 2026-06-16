/**
 * Renders a JSON-LD structured-data block. Pass a plain object built by the
 * helpers in `@lib/util/seo`. Safe to render in server components.
 */
const JsonLd = ({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export default JsonLd
