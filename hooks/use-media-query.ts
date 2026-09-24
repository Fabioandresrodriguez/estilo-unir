import { useState, useEffect } from 'react';

/**
 * Custom React hook to evaluate a CSS media query and update state reactively.
 * Used for responsive design checks on client-side components.
 * 
 * @param query The media query to test, e.g. '(min-width: 768px)'
 * @returns boolean indicating whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [value, setValue] = useState(false);

  useEffect(() => {
    // Avoid running on server side
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);
    
    // Set initial value
    setValue(mediaQueryList.matches);

    // Define listener
    const onChange = (event: MediaQueryListEvent) => {
      setValue(event.matches);
    };

    // Listen for changes
    mediaQueryList.addEventListener('change', onChange);

    return () => {
      mediaQueryList.removeEventListener('change', onChange);
    };
  }, [query]);

  return value;
}
