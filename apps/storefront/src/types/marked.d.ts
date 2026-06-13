// marked@4 ships types but they don't resolve through its ESM entry in this
// monorepo setup, so we declare the small surface we use.
declare module "marked" {
  export const marked: {
    parse(src: string, options?: { async?: false }): string
  }
}
