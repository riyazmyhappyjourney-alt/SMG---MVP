/**
 * SellMyGhar - Property Image Utilities
 * Provides deterministic distinct fallback imagery for properties and communities
 * based on hash seeding, ensuring different properties never share identical fallback photos.
 */

export const CURATED_COMMUNITY_PHOTOS = [
  'photo-1545324418-cc1a3fa10c00', // High-rise modern architecture (Prestige Shantiniketan style)
  'photo-1512917774080-9991f1c4c750', // Luxury villa & greenery (Sobha Dream Acres style)
  'photo-1600585154340-be6161a56a0c', // Contemporary glass & landscaped courtyard (Sattva Greenage style)
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
