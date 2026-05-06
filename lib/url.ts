export function normalizeUrl(url: string | null | undefined): string {
  if (!url) return ''
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}
