export function normalizeUrl(url: string | null | undefined): string {
  if (!url) return ''
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

// AI-discovered domains are often hallucinated. Build a Google search URL
// from the event/org context so the link always lands somewhere real.
export function searchUrl(...parts: (string | null | undefined)[]): string {
  const q = parts.filter(Boolean).join(' ').trim()
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`
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
