# Design Document: Responsive Design Enhancement

## Overview

This design document specifies the technical implementation for making the AlgoGuru application fully responsive across mobile, tablet, and desktop devices. The current application experiences usability issues on mobile devices, particularly with header controls not being visible due to space constraints. This enhancement will implement a comprehensive responsive design strategy using Tailwind CSS utilities and React component adaptations.

### Design Goals

1. **Mobile-First Accessibility**: Ensure all features are accessible and usable on mobile devices (375px+)
2. **Progressive Enhancement**: Add complexity and features as viewport size increases
3. **Touch-Optimized Interactions**: Implement appropriate touch target sizes and spacing
4. **Performance**: Maintain fast rendering and smooth interactions across all devices
5. **Consistency**: Provide a cohesive user experience that adapts intelligently to device capabilities

### Scope

**In Scope:**
- Responsive adaptations for HeaderControls, AppSidebar, GuruBot, Footer, SearchButton, and UserMenu components
- Tailwind CSS breakpoint implementation across all components
- Touch target size optimization for mobile devices
- Responsive state management and persistence
- Mobile-specific UI patterns (overlays, full-screen modals, collapsible sections)

**Out of Scope:**
- New feature development beyond responsive adaptations
- Backend API changes
- Authentication flow modifications
- Content structure changes
- Performance optimizations unrelated to responsive design

## Architecture

### Responsive Design Strategy

We will adopt a **mobile-first approach** where base styles target mobile devices, and responsive utilities progressively enhance the experience for larger screens. This approach aligns with modern web development best practices and ensures optimal performance on mobile devices.

**Rationale for Mobile-First:**
- Simpler base styles reduce CSS complexity
- Progressive enhancement is easier to reason about than progressive degradation
- Mobile constraints force prioritization of essential features
- Better performance on resource-constrained devices

### Breakpoint Strategy

The application will use Tailwind CSS's default breakpoints with specific usage patterns:

```typescript
const BREAKPOINTS = {
  sm: '640px',   // Small mobile adjustments (rarely used)
  md: '768px',   // Primary mobile-to-tablet transition
  lg: '1024px',  // Primary tablet-to-desktop transition
  xl: '1280px',  // Large desktop optimizations
  '2xl': '1536px' // Extra large displays (existing, minimal usage)
};
```

**Breakpoint Usage Guidelines:**
- **Base (< 640px)**: Mobile-optimized styles, icon-only buttons, stacked layouts
- **sm: (640px+)**: Minor mobile enhancements, slightly larger touch targets
- **md: (768px+)**: Tablet layout, show some text labels, 2-column layouts
- **lg: (1024px+)**: Desktop layout, full text labels, multi-column layouts, split panels
- **xl: (1280px+)**: Large desktop optimizations, increased spacing

### Component Adaptation Patterns

Each component will follow one of these responsive patterns:

1. **Visibility Toggle**: Show/hide elements based on viewport (e.g., text labels)
2. **Layout Transformation**: Change from stacked to grid/flex layouts
3. **Overlay vs Inline**: Switch between overlay and inline positioning
4. **Size Scaling**: Adjust dimensions, padding, and spacing
5. **Content Truncation**: Shorten or hide non-essential content

## Components and Interfaces

### 1. HeaderControls Component

**Current State:**
- Fixed layout with zoom controls, theme toggle, search button, and Guru button
- All elements display full text labels and descriptions
- Horizontal layout with consistent spacing

**Responsive Adaptations:**

```typescript
interface HeaderControlsProps {
  // No new props needed - uses existing context
}

// Responsive behavior:
// Mobile (< md): Icon-only buttons, hidden labels, reduced spacing
// Tablet (md - lg): Partial labels, moderate spacing
// Desktop (lg+): Full labels and descriptions
```

**Implementation Details:**


**Zoom Controls:**
- Mobile: Hide percentage text, show only +/- icons
- Desktop: Show percentage text between buttons

**Theme Toggle:**
- Mobile: Icon-only button (sun/moon)
- Desktop: Icon + "Day"/"Night" text label

**Search Button:**
- Mobile: Icon-only, no placeholder text or keyboard shortcut
- Tablet: Icon + truncated placeholder
- Desktop: Full placeholder text + keyboard shortcut display

**Guru Button:**
- Mobile: Icon-only with Sparkles icon
- Desktop: Icon + "Guru" text label

**Spacing:**
- Mobile: `gap-1` (4px) between control groups
- Desktop: `gap-3` (12px) between control groups

**Touch Targets:**
- All buttons: minimum `w-11 h-11` (44px) on mobile
- Maintain visual hierarchy with icon sizing

### 2. AppSidebar Component

**Current State:**
- Fixed sidebar visible on desktop
- Contains logo, navigation, topics, search, and user profile
- Uses shadcn/ui Sidebar component with SidebarProvider

**Responsive Adaptations:**

```typescript
interface AppSidebarProps {
  // Uses SidebarProvider context for open/closed state
}

// Responsive behavior:
// Mobile (< lg): Hidden by default, overlay when opened
// Desktop (lg+): Visible by default, fixed position
```

**Implementation Details:**

**Mobile Overlay Pattern:**
```tsx
// Use shadcn/ui Sidebar's built-in responsive behavior
<Sidebar className="lg:flex" variant="sidebar">
  {/* Sidebar content */}
</Sidebar>

// On mobile, sidebar becomes a Sheet (overlay)
// On desktop, sidebar is inline
```

**Backdrop Overlay:**
- Mobile: Semi-transparent backdrop when sidebar is open
- Clicking backdrop closes sidebar
- Implemented via shadcn/ui Sheet component behavior

**Sidebar Width:**
- Consistent 280px width on all devices when open
- Full-height overlay on mobile
- Fixed position on desktop

**Search Functionality:**
- Maintains full functionality on all viewport sizes
- Search results adapt to available height
- Touch-optimized result items on mobile

### 3. GuruBot Component

**Current State:**
- Opens as a split panel with draggable resize handle
- Displays chat interface with model selector, history, and input
- Supports narrow panel mode (truncates labels when < 30% width)

**Responsive Adaptations:**

```typescript
interface GuruBotProps {
  open: boolean;
  onClose: () => void;
}

// Responsive behavior:
// Mobile (< lg): Full-screen overlay
// Desktop (lg+): Split panel with draggable resize
```

**Implementation Details:**

**Mobile Full-Screen Mode:**
```tsx
// Conditional rendering based on viewport
const isMobile = useMediaQuery('(max-width: 1024px)');

{isMobile ? (
  // Full-screen overlay
  <div className="fixed inset-0 z-50 bg-background">
    <GuruBotContent />
  </div>
) : (
  // Split panel with resize
  <div className="flex-1 min-w-0">
    <GuruBotContent />
  </div>
)}
```

**Model Selector Dropdown:**
- Mobile: Full-width dropdown, larger touch targets
- Desktop: Standard dropdown positioning

**Chat History Sidebar:**
- Mobile: Full-width overlay when opened
- Desktop: Inline sidebar within GuruBot panel

**Message Input:**
- Mobile: Adjust for virtual keyboard, maintain visibility
- Use `viewport-fit=cover` meta tag for safe area insets
- Textarea auto-resize with max-height constraint

**Narrow Panel Behavior:**
- Maintain existing logic for panels < 300px width
- Hide non-essential labels and tags
- Preserve core functionality

### 4. Footer Component

**Current State:**
- Four-column grid layout (Links, Connect, Support, Project)
- Bottom bar with copyright and tagline
- Fixed spacing and typography

**Responsive Adaptations:**

```typescript
interface FooterProps {
  onSupportClick: () => void;
}

// Responsive behavior:
// Mobile (< md): Single column, stacked layout
// Tablet (md - lg): 2x2 grid layout
// Desktop (lg+): Four-column horizontal layout
```

**Implementation Details:**

**Grid Layout:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6 lg:gap-8">
  {/* Footer columns */}
</div>
```

**Touch Targets:**
- All links: minimum `h-11` (44px) on mobile
- Increased padding: `py-2.5` on mobile vs `py-2` on desktop

**Bottom Bar:**
```tsx
<div className="flex flex-col md:flex-row justify-between items-center gap-4">
  <p className="text-xs text-center md:text-left">Copyright...</p>
  <div className="text-xs text-center md:text-right">Tagline...</div>
</div>
```

**Spacing:**
- Mobile: Increased vertical spacing (`gap-8`) between sections
- Desktop: Moderate spacing (`gap-6`)

### 5. SearchButton and Search Modal

**Current State:**
- Button in header opens full-screen search modal
- Modal displays search input, results grouped by type, and footer
- Keyboard navigation support (Ctrl+K, Escape, arrow keys)

**Responsive Adaptations:**

```typescript
interface SearchButtonProps {
  // No props needed
}

// Responsive behavior:
// Mobile (< sm): Icon-only button
// Tablet (sm - md): Icon + truncated placeholder
// Desktop (md+): Full placeholder + keyboard shortcut
```

**Implementation Details:**

**Search Button:**
```tsx
<button className="flex items-center gap-2.5 px-4 py-2 rounded-[20px] w-auto sm:w-64">
  <Search size={14} />
  <span className="hidden sm:inline-block">Search AlgoGuru...</span>
  <kbd className="hidden md:flex">⌘K</kbd>
</button>
```

**Search Modal:**
```tsx
<div className="w-full max-w-lg mx-4 md:mx-auto" style={{ maxHeight: "70vh" }}>
  {/* Modal content */}
</div>
```

**Modal Adaptations:**
- Mobile: Full width with 16px margins, adjusted max-height for keyboard
- Desktop: Fixed max-width (512px), centered

**Result Items:**
- Mobile: Larger touch targets (`py-4`), increased spacing
- Desktop: Compact spacing (`py-3`)

**Footer Navigation Hints:**
- Mobile: Simplified hints, smaller text
- Desktop: Full navigation instructions

### 6. UserMenu Component

**Current State:**
- Dropdown menu triggered by avatar button
- Contains profile links, settings, and sign out
- Fixed positioning via Radix UI DropdownMenu

**Responsive Adaptations:**

```typescript
interface UserMenuProps {
  // No props needed - uses auth context
}

// Responsive behavior:
// Mobile (< md): Adjusted positioning, larger touch targets
// Desktop (md+): Standard dropdown positioning
```

**Implementation Details:**

**Avatar Button:**
```tsx
<button className="w-10 h-10 md:w-8 md:h-8 rounded-xl">
  {/* Avatar or initial */}
</button>
```

**Dropdown Menu:**
```tsx
<DropdownMenuContent 
  align="end" 
  className="w-64 md:w-56"
  sideOffset={8}
>
  {/* Menu items */}
</DropdownMenuContent>
```

**Menu Items:**
- Mobile: `py-3` padding, larger icons (16px)
- Desktop: `py-2.5` padding, standard icons (14px)

**Positioning:**
- Use Radix UI's collision detection to prevent off-screen overflow
- Adjust `sideOffset` and `alignOffset` for mobile viewports

## Data Models

### Responsive State Management

**ViewportState Interface:**
```typescript
interface ViewportState {
  width: number;
  height: number;
  isMobile: boolean;    // < 768px
  isTablet: boolean;    // 768px - 1024px
  isDesktop: boolean;   // >= 1024px
  orientation: 'portrait' | 'landscape';
}
```

**ResponsivePreferences Interface:**
```typescript
interface ResponsivePreferences {
  // Sidebar state per viewport category
  sidebarOpen: {
    mobile: boolean;
    desktop: boolean;
  };
  
  // GuruBot panel width (desktop only)
  gurubotPanelWidth: number; // percentage
  
  // Theme and zoom (shared across viewports)
  theme: 'light' | 'dark';
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
}
```

**LocalStorage Keys:**
```typescript
const STORAGE_KEYS = {
  SIDEBAR_MOBILE: 'sidebar-open-mobile',
  SIDEBAR_DESKTOP: 'sidebar-open-desktop',
  GURUBOT_WIDTH: 'guru-split-pct',
  THEME: 'theme',
  FONT_SIZE: 'fontSize',
} as const;
```

### Custom Hooks

**useMediaQuery Hook:**
```typescript
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [query]);
  
  return matches;
}
```

**useViewport Hook:**
```typescript
function useViewport(): ViewportState {
  const [viewport, setViewport] = useState<ViewportState>({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
  });
  
  useEffect(() => {
    const handleResize = () => {
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
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return viewport;
}
```

**useResponsivePreferences Hook:**
```typescript
function useResponsivePreferences() {
  const { isMobile, isDesktop } = useViewport();
  
  const getSidebarState = () => {
    if (isMobile) {
      return localStorage.getItem(STORAGE_KEYS.SIDEBAR_MOBILE) === 'true';
    }
    return localStorage.getItem(STORAGE_KEYS.SIDEBAR_DESKTOP) !== 'false';
  };
  
  const setSidebarState = (open: boolean) => {
    const key = isMobile ? STORAGE_KEYS.SIDEBAR_MOBILE : STORAGE_KEYS.SIDEBAR_DESKTOP;
    localStorage.setItem(key, String(open));
  };
  
  return {
    sidebarOpen: getSidebarState(),
    setSidebarOpen: setSidebarState,
    // ... other preference methods
  };
}
```

## Error Handling

### Viewport Detection Errors

**Issue**: `window` object not available during SSR or initial render

**Solution**:
```typescript
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
  // ... actual viewport detection
});
```

### LocalStorage Errors

**Issue**: LocalStorage may be unavailable (private browsing, storage quota exceeded)

**Solution**:
```typescript
function safeLocalStorage() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
      removeItem: (key: string) => localStorage.removeItem(key),
    };
  } catch {
    // Fallback to in-memory storage
    const storage = new Map<string, string>();
    return {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    };
  }
}
```

### Resize Event Throttling

**Issue**: Excessive resize events can cause performance issues

**Solution**:
```typescript
function useThrottledResize(callback: () => void, delay: number = 150) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    const handleResize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(callback, delay);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [callback, delay]);
}
```

### Touch Event Conflicts

**Issue**: Touch events may conflict with scroll or swipe gestures

**Solution**:
```typescript
// Prevent double-tap zoom on buttons
<button 
  className="touch-manipulation"
  onTouchStart={(e) => {
    // Prevent default only for buttons, not scrollable areas
    if (e.currentTarget.tagName === 'BUTTON') {
      e.preventDefault();
    }
  }}
>
  {/* Button content */}
</button>

// CSS
.touch-manipulation {
  touch-action: manipulation;
}
```

## Testing Strategy

Since this feature involves UI rendering, layout adaptations, and visual behavior across different viewport sizes, property-based testing is not appropriate. Instead, we will use a combination of manual testing, responsive breakpoint testing, and visual regression testing.

### Manual Testing Approach

**Test Devices and Viewports:**
1. **Mobile Devices:**
   - iPhone SE (375px width) - smallest modern mobile
   - iPhone 12/13/14 (390px width) - common mobile size
   - iPhone 14 Pro Max (430px width) - large mobile
   - Android devices (360px - 412px width range)

2. **Tablet Devices:**
   - iPad Mini (768px width) - tablet breakpoint
   - iPad Air/Pro (820px - 1024px width) - large tablet

3. **Desktop Viewports:**
   - Small desktop (1024px width) - desktop breakpoint
   - Standard desktop (1440px width) - common desktop
   - Large desktop (1920px width) - full HD

**Testing Checklist Per Component:**

**HeaderControls:**
- [ ] Zoom controls display correctly at all breakpoints
- [ ] Theme toggle shows appropriate labels
- [ ] Search button adapts text visibility
- [ ] Guru button shows/hides label appropriately
- [ ] All buttons meet 44px minimum touch target on mobile
- [ ] No horizontal overflow at any viewport width

**AppSidebar:**
- [ ] Sidebar hidden by default on mobile
- [ ] Sidebar trigger button opens overlay on mobile
- [ ] Backdrop closes sidebar when tapped on mobile
- [ ] Sidebar visible by default on desktop
- [ ] Search functionality works on all viewports
- [ ] Topic navigation scrolls smoothly on mobile
- [ ] User profile section displays correctly

**GuruBot:**
- [ ] Opens as full-screen overlay on mobile
- [ ] Opens as split panel on desktop
- [ ] Model selector dropdown accessible on mobile
- [ ] Chat history sidebar works on mobile
- [ ] Message input visible with virtual keyboard
- [ ] Narrow panel mode works correctly
- [ ] Close button accessible on all viewports

**Footer:**
- [ ] Single column layout on mobile
- [ ] 2x2 grid on tablet
- [ ] Four-column layout on desktop
- [ ] All links meet touch target requirements
- [ ] Bottom bar stacks correctly on mobile
- [ ] "Back To Top" button works on all viewports

**SearchModal:**
- [ ] Modal displays at appropriate width on all viewports
- [ ] Search input large enough for mobile typing
- [ ] Results have adequate touch spacing on mobile
- [ ] Close button meets touch target size
- [ ] Modal adjusts for virtual keyboard on mobile
- [ ] Footer hints visible on all viewports

**UserMenu:**
- [ ] Dropdown positions correctly on mobile
- [ ] Menu items meet touch target requirements
- [ ] Avatar scales appropriately
- [ ] Dropdown doesn't overflow screen edges
- [ ] All menu options accessible on mobile

### Responsive Breakpoint Testing

**Automated Breakpoint Tests:**

Use Playwright or Cypress to test responsive behavior at key breakpoints:

```typescript
describe('Responsive Breakpoints', () => {
  const viewports = [
    { name: 'Mobile Small', width: 375, height: 667 },
    { name: 'Mobile Large', width: 430, height: 932 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop Small', width: 1024, height: 768 },
    { name: 'Desktop Large', width: 1440, height: 900 },
  ];
  
  viewports.forEach(({ name, width, height }) => {
    describe(`${name} (${width}x${height})`, () => {
      beforeEach(() => {
        cy.viewport(width, height);
        cy.visit('/');
      });
      
      it('should not have horizontal scroll', () => {
        cy.document().then((doc) => {
          expect(doc.documentElement.scrollWidth).to.equal(width);
        });
      });
      
      it('should display header controls appropriately', () => {
        if (width < 768) {
          // Mobile: icon-only buttons
          cy.get('[data-testid="search-button"]').should('not.contain.text', 'Search AlgoGuru');
          cy.get('[data-testid="guru-button"]').should('not.contain.text', 'Guru');
        } else {
          // Desktop: full labels
          cy.get('[data-testid="search-button"]').should('contain.text', 'Search AlgoGuru');
          cy.get('[data-testid="guru-button"]').should('contain.text', 'Guru');
        }
      });
      
      it('should handle sidebar correctly', () => {
        if (width < 1024) {
          // Mobile: sidebar hidden by default
          cy.get('[data-testid="sidebar"]').should('not.be.visible');
          cy.get('[data-testid="sidebar-trigger"]').click();
          cy.get('[data-testid="sidebar"]').should('be.visible');
        } else {
          // Desktop: sidebar visible by default
          cy.get('[data-testid="sidebar"]').should('be.visible');
        }
      });
      
      // Additional tests for each component...
    });
  });
});
```

### Visual Regression Testing

**Tool**: Percy, Chromatic, or similar visual testing platform

**Approach**:
1. Capture baseline screenshots at each breakpoint
2. Run visual diff tests on every PR
3. Review and approve visual changes

**Test Scenarios**:
```typescript
describe('Visual Regression Tests', () => {
  const breakpoints = [375, 768, 1024, 1440];
  
  breakpoints.forEach((width) => {
    it(`should match baseline at ${width}px`, () => {
      cy.viewport(width, 900);
      cy.visit('/');
      cy.percySnapshot(`Homepage - ${width}px`);
      
      // Test with sidebar open
      if (width < 1024) {
        cy.get('[data-testid="sidebar-trigger"]').click();
        cy.percySnapshot(`Homepage with Sidebar - ${width}px`);
      }
      
      // Test with GuruBot open
      cy.get('[data-testid="guru-button"]').click();
      cy.percySnapshot(`Homepage with GuruBot - ${width}px`);
      
      // Test search modal
      cy.get('[data-testid="search-button"]').click();
      cy.percySnapshot(`Search Modal - ${width}px`);
    });
  });
});
```

### Touch Interaction Testing

**Manual Testing on Real Devices:**
1. Test all interactive elements for touch accuracy
2. Verify 44px minimum touch target compliance
3. Test swipe gestures don't conflict with scrolling
4. Verify virtual keyboard doesn't obscure inputs
5. Test double-tap zoom prevention on buttons

**Automated Touch Target Validation:**
```typescript
describe('Touch Target Compliance', () => {
  it('should have minimum 44px touch targets on mobile', () => {
    cy.viewport(375, 667);
    cy.visit('/');
    
    // Get all interactive elements
    cy.get('button, a, input, [role="button"]').each(($el) => {
      const rect = $el[0].getBoundingClientRect();
      const minSize = 44;
      
      // Allow some tolerance for elements with larger click areas
      expect(rect.width).to.be.at.least(minSize - 4);
      expect(rect.height).to.be.at.least(minSize - 4);
    });
  });
});
```

### Performance Testing

**Metrics to Monitor:**
1. **First Contentful Paint (FCP)**: Should remain < 1.5s on mobile
2. **Largest Contentful Paint (LCP)**: Should remain < 2.5s on mobile
3. **Cumulative Layout Shift (CLS)**: Should remain < 0.1
4. **Time to Interactive (TTI)**: Should remain < 3.5s on mobile

**Testing Approach:**
```typescript
// Use Lighthouse CI in GitHub Actions
describe('Performance Tests', () => {
  it('should meet performance budgets on mobile', () => {
    cy.lighthouse({
      performance: 85,
      accessibility: 95,
      'best-practices': 90,
      seo: 90,
    }, {
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
      },
    });
  });
});
```

### Integration Testing

**Test Scenarios:**
1. **Viewport Resize**: Test that components adapt correctly when viewport changes
2. **State Persistence**: Verify preferences persist across viewport changes
3. **Navigation**: Test routing and navigation work on all viewports
4. **Form Interactions**: Verify forms work with virtual keyboards
5. **Modal Stacking**: Test multiple overlays (sidebar + search, sidebar + GuruBot)

```typescript
describe('Responsive Integration Tests', () => {
  it('should persist sidebar state per viewport category', () => {
    // Desktop: open sidebar
    cy.viewport(1440, 900);
    cy.visit('/');
    cy.get('[data-testid="sidebar"]').should('be.visible');
    
    // Switch to mobile
    cy.viewport(375, 667);
    cy.get('[data-testid="sidebar"]').should('not.be.visible');
    
    // Open sidebar on mobile
    cy.get('[data-testid="sidebar-trigger"]').click();
    cy.get('[data-testid="sidebar"]').should('be.visible');
    
    // Switch back to desktop
    cy.viewport(1440, 900);
    cy.get('[data-testid="sidebar"]').should('be.visible');
    
    // Switch back to mobile
    cy.viewport(375, 667);
    // Should remember mobile state (open)
    cy.get('[data-testid="sidebar"]').should('be.visible');
  });
  
  it('should handle GuruBot mode switching', () => {
    // Desktop: split panel
    cy.viewport(1440, 900);
    cy.visit('/');
    cy.get('[data-testid="guru-button"]').click();
    cy.get('[data-testid="gurubot-panel"]').should('be.visible');
    cy.get('[data-testid="resize-handle"]').should('be.visible');
    
    // Switch to mobile: full-screen overlay
    cy.viewport(375, 667);
    cy.get('[data-testid="gurubot-panel"]').should('have.class', 'fixed');
    cy.get('[data-testid="resize-handle"]').should('not.exist');
    cy.get('[data-testid="main-content"]').should('not.be.visible');
  });
});
```

### Accessibility Testing

**Automated Accessibility Tests:**
```typescript
describe('Responsive Accessibility', () => {
  const viewports = [375, 768, 1024, 1440];
  
  viewports.forEach((width) => {
    it(`should pass accessibility audit at ${width}px`, () => {
      cy.viewport(width, 900);
      cy.visit('/');
      cy.injectAxe();
      cy.checkA11y();
    });
  });
  
  it('should support keyboard navigation on all viewports', () => {
    cy.viewport(375, 667);
    cy.visit('/');
    
    // Tab through interactive elements
    cy.get('body').tab();
    cy.focused().should('have.attr', 'data-testid', 'sidebar-trigger');
    
    cy.focused().tab();
    cy.focused().should('have.attr', 'data-testid', 'search-button');
    
    // Continue tabbing through all interactive elements
    // Verify focus order is logical
  });
});
```

### Test Coverage Goals

**Component Coverage:**
- HeaderControls: 100% of responsive behaviors
- AppSidebar: 100% of mobile/desktop modes
- GuruBot: 100% of overlay/split-panel modes
- Footer: 100% of layout variations
- SearchModal: 100% of responsive adaptations
- UserMenu: 100% of positioning scenarios

**Breakpoint Coverage:**
- Test at minimum 5 viewport widths: 375px, 768px, 1024px, 1440px, 1920px
- Test both portrait and landscape orientations on mobile/tablet

**Interaction Coverage:**
- All touch targets validated for 44px minimum
- All interactive elements tested for touch accuracy
- All modals/overlays tested for proper stacking
- All forms tested with virtual keyboard

### Continuous Testing

**GitHub Actions Workflow:**
```yaml
name: Responsive Design Tests

on: [pull_request]

jobs:
  responsive-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:responsive
      - run: npm run test:visual
      - run: npm run lighthouse:mobile
```

**Pre-commit Hooks:**
- Run responsive unit tests
- Validate Tailwind class usage
- Check for hardcoded pixel values (should use Tailwind utilities)

## Implementation Notes

### Tailwind Configuration

Ensure `tailwind.config.ts` includes all necessary utilities:

```typescript
export default {
  theme: {
    extend: {
      screens: {
        'xs': '475px', // Optional extra-small breakpoint
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
} satisfies Config;
```

### Meta Tags for Mobile

Add to `index.html`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
```

### CSS Custom Properties for Safe Areas

Add to global CSS:

```css
:root {
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-right: env(safe-area-inset-right);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);
  --safe-area-inset-left: env(safe-area-inset-left);
}

/* Apply to fixed/sticky elements */
.header {
  padding-top: max(1rem, var(--safe-area-inset-top));
}

.footer {
  padding-bottom: max(1rem, var(--safe-area-inset-bottom));
}
```

### Performance Optimizations

**Lazy Loading:**
```typescript
// Lazy load GuruBot component
const GuruBot = lazy(() => import('@/components/GuruBot'));

// Use Suspense with fallback
<Suspense fallback={<GuruBotSkeleton />}>
  {guruOpen && <GuruBot open={guruOpen} onClose={() => setGuruOpen(false)} />}
</Suspense>
```

**Image Optimization:**
```tsx
// Use responsive images
<img 
  src="/logo.svg"
  srcSet="/logo-small.svg 375w, /logo-medium.svg 768w, /logo-large.svg 1024w"
  sizes="(max-width: 768px) 32px, (max-width: 1024px) 40px, 48px"
  alt="AlgoGuru Logo"
/>
```

**Reduce Animation on Mobile:**
```css
@media (max-width: 768px) {
  * {
    animation-duration: 0.7 !important;
    transition-duration: 0.2s !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Development Workflow

**Component Development:**
1. Start with mobile styles (base classes)
2. Add tablet adaptations (md: prefix)
3. Add desktop enhancements (lg: prefix)
4. Test at each breakpoint
5. Verify touch targets on mobile
6. Run accessibility audit

**Code Review Checklist:**
- [ ] All responsive breakpoints tested
- [ ] Touch targets meet 44px minimum on mobile
- [ ] No horizontal scrolling at any viewport
- [ ] Text remains readable without zooming
- [ ] Interactive elements have adequate spacing
- [ ] Modals/overlays work correctly on mobile
- [ ] State persistence works across viewport changes
- [ ] Performance metrics within acceptable ranges
- [ ] Accessibility audit passes

## Summary

This design implements a comprehensive responsive strategy for the AlgoGuru application using Tailwind CSS utilities and React component adaptations. The mobile-first approach ensures optimal performance on resource-constrained devices while progressively enhancing the experience for larger screens.

Key implementation points:
- Use Tailwind breakpoints consistently (md: for mobile-to-tablet, lg: for tablet-to-desktop)
- Implement touch-optimized interactions with 44px minimum touch targets
- Adapt component behavior based on viewport (overlays on mobile, inline on desktop)
- Persist responsive preferences separately for mobile and desktop contexts
- Test thoroughly across real devices and viewport sizes
- Monitor performance metrics to ensure fast mobile experience

The testing strategy focuses on manual testing, responsive breakpoint validation, visual regression testing, and touch interaction verification, which are appropriate for UI/layout features where property-based testing would not provide value.
