import { useEffect, useState } from 'react';

let isLoading = false;
let isLoaded = false;
const loadPromise: Promise<void> | null = null;
const callbacks: (() => void)[] = [];

export function useGoogleMaps() {
  const [loaded, setLoaded] = useState(isLoaded);

  useEffect(() => {
    if (isLoaded) {
      setLoaded(true);
      return;
    }

    if (isLoading) {
      // Already loading, wait for it
      callbacks.push(() => setLoaded(true));
      return;
    }

    // Start loading
    isLoading = true;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      setLoaded(true);

      // Notify all waiting callbacks
      callbacks.forEach((cb) => cb());
      callbacks.length = 0;
    };

    script.onerror = () => {
      isLoading = false;
      console.error('Failed to load Google Maps');
      callbacks.length = 0;
    };

    document.head.appendChild(script);
  }, []);

  return loaded;
}
