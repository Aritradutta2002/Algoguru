import { useState, useEffect } from 'react';

/**
 * Custom hook to track media query matches
 * @param query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns boolean indicating if the media query matches
 * 
 * Validates Requirements: 8.1, 8.2, 8.3, 8.4
 */
export function useMediaQuery(query: string): boolean {
  // SSR safety: return false during server-side rendering
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    // SSR safety check
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    
    // Update state with current match status
    setMatches(mediaQueryList.matches);

    // Event listener for media query changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener
    mediaQueryList.addEventListener('change', handleChange);

    // Cleanup: remove event listener
    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}
