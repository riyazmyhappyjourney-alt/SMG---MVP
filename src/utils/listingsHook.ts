import { useState, useEffect } from 'react';
import { PropertyCardData } from '../components/common/PropertyCard';

let cachedListings: PropertyCardData[] | null = null;
let fetchPromise: Promise<PropertyCardData[]> | null = null;
const listeners = new Set<(listings: PropertyCardData[]) => void>();

async function fetchFromApi(): Promise<PropertyCardData[]> {
  try {
    const res = await fetch('/api/listings');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list: PropertyCardData[] = Array.isArray(data.listings) ? data.listings : [];
    cachedListings = list;
    listeners.forEach((fn) => fn(list));
    return list;
  } catch (err) {
    console.error('Failed to fetch listings:', err);
    return cachedListings || [];
  } finally {
    fetchPromise = null;
  }
}

export function useListings() {
  const [properties, setProperties] = useState<PropertyCardData[]>(cachedListings || []);
  const [loading, setLoading] = useState<boolean>(!cachedListings);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleUpdate = (newListings: PropertyCardData[]) => {
      if (isMounted) {
        setProperties(newListings);
        setLoading(false);
      }
    };

    listeners.add(handleUpdate);

    if (cachedListings) {
      setProperties(cachedListings);
      setLoading(false);
    } else {
      if (!fetchPromise) {
        fetchPromise = fetchFromApi();
      }
      fetchPromise
        .then((data) => {
          if (isMounted) {
            setProperties(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(err.message);
            setLoading(false);
          }
        });
    }

    return () => {
      isMounted = false;
      listeners.delete(handleUpdate);
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    const data = await fetchFromApi();
    setProperties(data);
    setLoading(false);
  };

  return { properties, loading, error, refresh };
}
