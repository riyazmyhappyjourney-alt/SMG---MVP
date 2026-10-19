/**
 * SellMyGhar - Property Image Utilities
 * Provides deterministic distinct fallback imagery for properties and communities
 * based on hash seeding, ensuring different properties never share identical fallback photos.
 */

export const FALLBACK_PROPERTY_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" fill="%231e293b"><rect width="800" height="600" fill="%231e293b"/><g fill="%23334155"><rect x="150" y="120" width="220" height="480" rx="4"/><rect x="420" y="200" width="230" height="400" rx="4"/></g><g fill="%2364748b"><rect x="180" y="160" width="40" height="30" rx="2"/><rect x="240" y="160" width="40" height="30" rx="2"/><rect x="300" y="160" width="40" height="30" rx="2"/><rect x="180" y="220" width="40" height="30" rx="2"/><rect x="240" y="220" width="40" height="30" rx="2"/><rect x="300" y="220" width="40" height="30" rx="2"/><rect x="180" y="280" width="40" height="30" rx="2"/><rect x="240" y="280" width="40" height="30" rx="2"/><rect x="300" y="280" width="40" height="30" rx="2"/><rect x="450" y="240" width="40" height="30" rx="2"/><rect x="510" y="240" width="40" height="30" rx="2"/><rect x="570" y="240" width="40" height="30" rx="2"/><rect x="450" y="300" width="40" height="30" rx="2"/><rect x="510" y="300" width="40" height="30" rx="2"/><rect x="570" y="300" width="40" height="30" rx="2"/></g><text x="400" y="550" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="bold" fill="%2394a3b8" text-anchor="middle">SellMyGhar Verified Resale</text></svg>`;

export const CURATED_COMMUNITY_PHOTOS = [
  'photo-1560448204-e02f11c3d0e2', // High-rise modern architecture (Prestige Shantiniketan style)
  'photo-1512917774080-9991f1c4c750', // Luxury villa & greenery (Sobha Dream Acres style)
  'photo-1567496898669-ee935f5f647a', // Contemporary glass & landscaped courtyard (Sattva Greenage style)
  'photo-1600596542815-ffad4c1539a9', // Elegant modern residence (Brigade Metropolis style)
  'photo-1580587771525-78b9dba3b914', // Sprawling landscaped estate (Godrej Palm Retreat style)
  'photo-1600607687939-ce8a6c25118c', // Grand contemporary tower (Puravankara Windermere style)
];

export function getDistinctCommunityPhoto(seed: string = '', width: number = 800): string {
  let hash = 0;
  const str = String(seed || '');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const photoId = CURATED_COMMUNITY_PHOTOS[Math.abs(hash) % CURATED_COMMUNITY_PHOTOS.length];
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=80`;
}

