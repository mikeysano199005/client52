const PLATFORM_LOGOS: [string, string][] = [
  ['netflix', '/logos/netflix.svg'],
  ['amazon', '/logos/prime.svg'],
  ['prime', '/logos/prime.svg'],
  ['hotstar', '/logos/hotstar.svg'],
  ['disney', '/logos/hotstar.svg'],
  ['youtube', '/logos/youtube.svg'],
  ['zee5', '/logos/zee5.svg'],
  ['sony', '/logos/sonyliv.svg'],
  ['spotify', '/logos/spotify.svg'],
  ['jiocinema', '/logos/jiocinema.svg'],
  ['mx player', '/logos/mx.svg'],
  ['jio', '/logos/jiocinema.svg'],
  ['apple', '/logos/netflix.svg'],
]

export function getPlanLogo(name: string, imageUrl?: string | null): string | null {
  const lower = name.toLowerCase()
  for (const [key, logo] of PLATFORM_LOGOS) {
    if (lower.includes(key)) return logo
  }
  if (imageUrl) return imageUrl
  return null
}
