/**
 * Two-Domain Architecture Configuration (SellMyGhar.in + BuyMyGhar.in)
 *
 * Architecture:
 * - SellMyGhar.in: Seller-focused platform (Post property, valuation, title diligence)
 * - BuyMyGhar.in: Buyer-focused discovery platform (Explore listings, locality filters, gated communities)
 * - Both domains share the same unified backend database and canonical property IDs.
 */

export function isBuyMyGharDomain(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('buymyghar.in');
}

export function getBuyMyGharExploreUrl(locality?: string, bhk?: string, explicitHost?: string): string {
  const host = explicitHost || (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

  const params = new URLSearchParams();
  if (locality && locality !== 'ALL') params.set('locality', locality);
  if (bhk) params.set('bhk', bhk);
  const queryStr = params.toString() ? `?${params.toString()}` : '';

  if (isLocal) {
    return `#listings${queryStr}`;
  }

  if (host.includes('buymyghar.in')) {
    return `/explore${queryStr}`;
  }

  // Cross-domain link from SellMyGhar to BuyMyGhar
  return `https://buymyghar.in/explore${queryStr}`;
}

export function redirectToBuyMyGhar(locality?: string, bhk?: string): void {
  const params = new URLSearchParams();
  if (locality && locality !== 'ALL') params.set('locality', locality);
  if (bhk) params.set('bhk', bhk);
  const queryStr = params.toString() ? `?${params.toString()}` : '';

  if (typeof window !== 'undefined') {
    window.location.href = `https://buymyghar.in/explore${queryStr}`;
  }
}
