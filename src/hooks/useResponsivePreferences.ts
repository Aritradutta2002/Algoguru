import { useCallback } from 'react';
import { useViewport } from './useViewport';
import { GURU_PANEL_CONSTANTS } from '@/components/GuruBot';

/**
 * Storage keys for responsive preferences
 */
const STORAGE_KEYS = {
  SIDEBAR_MOBILE: 'sidebar-open-mobile',
  SIDEBAR_DESKTOP: 'sidebar-open-desktop',
  GURUBOT_WIDTH: 'guru-split-pct',
} as const;

/**
 * Safe localStorage wrapper with fallback to in-memory storage
 * Handles cases where localStorage is unavailable (private browsing, quota exceeded)
 */
function createSafeStorage() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    
    return {
      getItem: (key: string): string | null => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string): void => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // Silently fail if storage is unavailable
        }
      },
      removeItem: (key: string): void => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Silently fail if storage is unavailable
        }
      },
    };
  } catch {
    // Fallback to in-memory storage
    const storage = new Map<string, string>();
    
    return {
      getItem: (key: string): string | null => storage.get(key) ?? null,
      setItem: (key: string, value: string): void => {
        storage.set(key, value);
      },
      removeItem: (key: string): void => {
        storage.delete(key);
      },
    };
  }
}

// Initialize safe storage
const safeStorage = createSafeStorage();

/**
 * Custom hook for managing responsive preferences with persistence
 * 
 * Features:
 * - Separate sidebar state for mobile and desktop viewports
 * - GuruBot panel width persistence (desktop only)
 * - Safe localStorage with fallback to in-memory storage
 * - Automatic viewport-based preference selection
 * 
 * Validates Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7
 */
export function useResponsivePreferences() {
  const { isMobile, isDesktop } = useViewport();

  /**
   * Get sidebar open state based on current viewport
   * Mobile: defaults to false (closed)
   * Desktop: defaults to true (open)
   */
  const getSidebarState = useCallback((): boolean => {
    if (isMobile) {
      const stored = safeStorage.getItem(STORAGE_KEYS.SIDEBAR_MOBILE);
      return stored === 'true';
    }
    
    const stored = safeStorage.getItem(STORAGE_KEYS.SIDEBAR_DESKTOP);
    // Desktop defaults to open if no preference stored
    return stored !== 'false';
  }, [isMobile]);

  /**
   * Set sidebar open state for current viewport
   * Persists separately for mobile and desktop
   */
  const setSidebarState = useCallback((open: boolean): void => {
    const key = isMobile 
      ? STORAGE_KEYS.SIDEBAR_MOBILE 
      : STORAGE_KEYS.SIDEBAR_DESKTOP;
    
    safeStorage.setItem(key, String(open));
  }, [isMobile]);

  /**
   * Get GuruBot panel width percentage (desktop only)
   * Returns null on mobile (full-screen mode)
   * Defaults to standard 28% if no preference stored
   */
  const getGurubotWidth = useCallback((): number | null => {
    if (!isDesktop) {
      return null; // Mobile uses full-screen overlay
    }

    const stored = safeStorage.getItem(STORAGE_KEYS.GURUBOT_WIDTH);
    if (stored) {
      const parsed = parseFloat(stored);
      // Validate standard range: 18% to 38%
      if (!isNaN(parsed) && parsed >= GURU_PANEL_CONSTANTS.MIN_SIZE && parsed <= GURU_PANEL_CONSTANTS.MAX_SIZE) {
        return parsed;
      }
    }
    
    return GURU_PANEL_CONSTANTS.DEFAULT_SIZE; // Standard default 28%
  }, [isDesktop]);

  /**
   * Set GuruBot panel width percentage (desktop only)
   * Ignored on mobile viewports
   */
  const setGurubotWidth = useCallback((width: number): void => {
    if (!isDesktop) {
      return; // Don't persist width on mobile
    }

    // Clamp width to standard limits (18% to 38%)
    const clampedWidth = Math.max(
      GURU_PANEL_CONSTANTS.MIN_SIZE,
      Math.min(GURU_PANEL_CONSTANTS.MAX_SIZE, width),
    );
    safeStorage.setItem(STORAGE_KEYS.GURUBOT_WIDTH, String(clampedWidth));
  }, [isDesktop]);

  /**
   * Clear all responsive preferences
   * Useful for testing or reset functionality
   */
  const clearPreferences = useCallback((): void => {
    safeStorage.removeItem(STORAGE_KEYS.SIDEBAR_MOBILE);
    safeStorage.removeItem(STORAGE_KEYS.SIDEBAR_DESKTOP);
    safeStorage.removeItem(STORAGE_KEYS.GURUBOT_WIDTH);
  }, []);

  return {
    // Sidebar state management
    sidebarOpen: getSidebarState(),
    setSidebarOpen: setSidebarState,
    
    // GuruBot panel width management (desktop only)
    gurubotWidth: getGurubotWidth(),
    setGurubotWidth: setGurubotWidth,
    
    // Utility
    clearPreferences,
    
    // Viewport info for convenience
    isMobile,
    isDesktop,
  };
}
