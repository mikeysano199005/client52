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
  // Note: 'apple' removed — Apple TV+ plans should have image_url set by admin
  // or they'll fall back to the letter placeholder (better than wrong logo)
]

export function getPlanLogo(name: string, imageUrl?: string | null): string | null {
  const lower = name.toLowerCase()
  for (const [key, logo] of PLATFORM_LOGOS) {
    if (lower.includes(key)) return logo
  }
  if (imageUrl) return imageUrl
  return null
}
