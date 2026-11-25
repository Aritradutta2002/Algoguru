import { useState, useEffect, useRef } from "react";

/**
 * Viewport state interface
 */
export interface ViewportState {
  width: number;
  height: number;
  isMobile: boolean; // < 768px
  isTablet: boolean; // 768px - 1024px
  isDesktop: boolean; // >= 1024px
  orientation: "portrait" | "landscape";
}

const DEFAULT_VIEWPORT: ViewportState = {
  width: 1024,
  height: 768,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  orientation: "landscape",
};

function readViewport(): ViewportState {
  if (typeof window === "undefined") {
    return DEFAULT_VIEWPORT;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  return {
    width,
    height,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    orientation: width > height ? "landscape" : "portrait",
  };
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
  // Deterministic initial state for SSR; real viewport dimensions hydrate on mount.
  const [viewport, setViewport] = useState<ViewportState>(DEFAULT_VIEWPORT);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setViewport(readViewport());

    const handleResize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setViewport(readViewport());
      }, 150);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return viewport;
}
