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
]

export function getPlanLogo(name: string, imageUrl?: string | null): string | null {
  const lower = name.toLowerCase()
  for (const [key, logo] of PLATFORM_LOGOS) {
    if (lower.includes(key)) return logo
  }
  if (imageUrl) return imageUrl
  return null
}

// Brand-tinted dark gradients — makes each platform logo pop on its own color
const PLATFORM_CARD_BG: Record<string, string> = {
  netflix:    'linear-gradient(135deg, #2a0000 0%, #1a0000 100%)',
  amazon:     'linear-gradient(135deg, #00152b 0%, #000d1c 100%)',
  prime:      'linear-gradient(135deg, #00152b 0%, #000d1c 100%)',
  hotstar:    'linear-gradient(135deg, #000028 0%, #00001a 100%)',
  disney:     'linear-gradient(135deg, #000028 0%, #00001a 100%)',
  youtube:    'linear-gradient(135deg, #1f0000 0%, #110000 100%)',
  zee5:       'linear-gradient(135deg, #1a003a 0%, #0d001f 100%)',
  sony:       'linear-gradient(135deg, #00103a 0%, #00081f 100%)',
  spotify:    'linear-gradient(135deg, #001a08 0%, #000d04 100%)',
  jiocinema:  'linear-gradient(135deg, #1a003a 0%, #0d001f 100%)',
  jio:        'linear-gradient(135deg, #1a003a 0%, #0d001f 100%)',
  'mx player':'linear-gradient(135deg, #1a1000 0%, #0d0800 100%)',
}

// Default dark gradient for unknown platforms / letter placeholders
const DEFAULT_CARD_BG = 'linear-gradient(135deg, #1c1c22 0%, #111113 100%)'

export function getPlanCardBg(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, bg] of Object.entries(PLATFORM_CARD_BG)) {
    if (lower.includes(key)) return bg
  }
  return DEFAULT_CARD_BG
}
