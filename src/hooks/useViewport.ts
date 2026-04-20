import { useState, useEffect, useRef } from 'react';

/**
 * Viewport state interface
 */
export interface ViewportState {
  width: number;
  height: number;
  isMobile: boolean;    // < 768px
  isTablet: boolean;    // 768px - 1024px
  isDesktop: boolean;   // >= 1024px
  orientation: 'portrait' | 'landscape';
}

/**
 * Custom hook to track viewport dimensions and breakpoints
 * Uses throttled resize event listener (150ms delay) for performance
 * 
 * @returns ViewportState object with current viewport information
 * 
 * Validates Requirements: 8.1, 8.2, 8.3, 8.4
 */
export function useViewport(): ViewportState {
  // SSR safety: return default desktop values during server-side rendering
  const [viewport, setViewport] = useState<ViewportState>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        orientation: 'landscape',
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      width,
      height,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      orientation: width > height ? 'landscape' : 'portrait',
    };
  });

  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // SSR safety check
    if (typeof window === 'undefined') {
      return;
    }

    // Throttled resize handler with 150ms delay
    const handleResize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        setViewport({
          width,
          height,
          isMobile: width < 768,
          isTablet: width >= 768 && width < 1024,
          isDesktop: width >= 1024,
          orientation: width > height ? 'landscape' : 'portrait',
        });
      }, 150);
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup: remove event listener and clear timeout
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return viewport;
}
