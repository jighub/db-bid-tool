export function normalizeUrl(url: string | null | undefined): string {
  if (!url) return ''
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

// AI-generated paths are frequently hallucinated. Reduce a discovered URL
// to its origin so we link to a page that actually exists.
export function rootDomain(url: string | null | undefined): string {
  if (!url) return ''
  try {
    const u = new URL(normalizeUrl(url))
    return `${u.protocol}//${u.host}`
  } catch {
    return ''
  }
}
