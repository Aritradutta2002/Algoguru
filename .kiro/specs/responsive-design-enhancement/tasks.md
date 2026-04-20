# Implementation Plan: Responsive Design Enhancement

## Overview

This implementation plan converts the responsive design specification into discrete coding tasks. The approach follows a mobile-first strategy, implementing custom hooks first, then adapting each component progressively. Tasks are organized to enable incremental validation with checkpoints at logical breaks.

## Tasks

- [ ] 1. Set up responsive infrastructure and custom hooks
  - [x] 1.1 Create useMediaQuery hook in src/hooks/
    - Implement hook with window.matchMedia API
    - Add event listener for media query changes
    - Handle SSR safety with typeof window check
    - Export from src/hooks/index.ts
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 1.2 Create useViewport hook in src/hooks/
    - Implement viewport state tracking (width, height, isMobile, isTablet, isDesktop, orientation)
    - Add throttled resize event listener (150ms delay)
    - Handle SSR with default desktop values
    - Export from src/hooks/index.ts
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 1.3 Create useResponsivePreferences hook in src/hooks/
    - Implement localStorage wrapper with try-catch error handling
    - Add separate state management for mobile vs desktop sidebar preferences
    - Implement GuruBot panel width persistence (desktop only)
    - Add fallback to in-memory storage if localStorage unavailable
    - Export from src/hooks/index.ts
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [ ]* 1.4 Write unit tests for custom hooks
    - Test useMediaQuery with different media queries
    - Test useViewport resize behavior and breakpoint detection
    - Test useResponsivePreferences localStorage persistence
    - Test error handling for localStorage failures
    - _Requirements: 8.1, 8.2, 8.3, 12.1, 12.2_

- [x] 2. Update index.html with mobile meta tags
  - Add viewport meta tag with width=device-width, initial-scale=1.0
  - Add mobile-web-app-capable and apple-mobile-web-app-capable meta tags
  - Add apple-mobile-web-app-status-bar-style meta tag
  - _Requirements: 9.6, 11.1, 11.2_

- [x] 3. Add global CSS for safe areas and mobile optimizations
  - Add CSS custom properties for safe-area-inset values in App.css
  - Add touch-manipulation utility class
  - Add reduced animation rules for mobile and prefers-reduced-motion
  - Apply safe area padding to header and footer classes
  - _Requirements: 9.6, 9.7, 10.6_

- [ ] 4. Implement HeaderControls responsive adaptations
  - [x] 4.1 Update HeaderControls component with responsive classes
    - Hide zoom percentage text on mobile (< md breakpoint)
    - Hide theme toggle text label on mobile, show on desktop
    - Update search button to icon-only on mobile, full text on desktop
    - Update Guru button to icon-only on mobile, show label on desktop
    - Adjust spacing: gap-1 on mobile, gap-3 on desktop
    - Ensure all buttons meet 44px minimum touch target on mobile
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 9.1, 9.2_

  - [ ]* 4.2 Write unit tests for HeaderControls responsive behavior
    - Test button visibility at different breakpoints
    - Test touch target sizes on mobile
    - Test spacing adjustments
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 9.1_

- [x] 5. Checkpoint - Verify header and hooks work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement AppSidebar mobile overlay behavior
  - [x] 6.1 Update AppSidebar component with responsive behavior
    - Configure Sidebar component with lg:flex class for desktop visibility
    - Implement mobile overlay using Sheet component for < lg breakpoint
    - Add backdrop overlay that closes sidebar on tap (mobile only)
    - Maintain 280px width on all viewports when open
    - Ensure sidebar hidden by default on mobile, visible on desktop
    - Integrate useResponsivePreferences for state persistence
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 12.1_

  - [x] 6.2 Add sidebar trigger button for mobile
    - Create trigger button visible only on mobile (< lg)
    - Position in header or as floating button
    - Ensure 44px minimum touch target
    - Wire to sidebar open/close state
    - _Requirements: 2.1, 2.2, 10.1, 9.1_

  - [ ]* 6.3 Write integration tests for AppSidebar responsive modes
    - Test sidebar visibility on mobile vs desktop
    - Test overlay behavior and backdrop interaction
    - Test state persistence across viewport changes
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 12.1_

- [x] 7. Implement GuruBot mobile full-screen mode
  - [x] 7.1 Update GuruBot component with viewport detection
    - Add useMediaQuery hook to detect mobile (< lg)
    - Implement conditional rendering: full-screen overlay on mobile, split panel on desktop
    - Add fixed inset-0 z-50 classes for mobile full-screen mode
    - Hide main content when GuruBot open on mobile
    - Maintain existing split panel with resize handle on desktop
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.8_

  - [x] 7.2 Optimize GuruBot UI for mobile
    - Make model selector dropdown full-width on mobile
    - Adjust chat history sidebar to full-width overlay on mobile
    - Ensure message input textarea adjusts for virtual keyboard
    - Add appropriate padding-bottom for safe area on mobile
    - Increase touch targets for all interactive elements to 44px minimum
    - _Requirements: 3.5, 3.6, 3.7, 9.1, 9.2_

  - [ ]* 7.3 Write integration tests for GuruBot responsive modes
    - Test full-screen mode on mobile
    - Test split panel mode on desktop
    - Test virtual keyboard handling
    - Test narrow panel behavior (< 300px)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.8_

- [x] 8. Checkpoint - Verify sidebar and GuruBot work on all viewports
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Footer responsive layout
  - [x] 9.1 Update Footer component with responsive grid
    - Change grid to single column on mobile (< md)
    - Implement 2x2 grid on tablet (md to lg)
    - Maintain 4-column layout on desktop (lg+)
    - Adjust gap spacing: gap-8 on mobile, gap-6 on tablet, gap-8 on desktop
    - Ensure all links meet 44px minimum touch target on mobile
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 9.1, 9.4_

  - [x] 9.2 Update Footer bottom bar for mobile
    - Stack copyright and tagline vertically on mobile (flex-col)
    - Display horizontally on tablet and desktop (md:flex-row)
    - Center text on mobile, left/right align on desktop
    - Add gap-4 for spacing
    - _Requirements: 4.6, 4.7_

  - [ ]* 9.3 Write unit tests for Footer responsive layouts
    - Test grid layout at different breakpoints
    - Test bottom bar stacking behavior
    - Test touch target sizes
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 10. Implement SearchModal responsive optimizations
  - [x] 10.1 Update SearchButton component with responsive text
    - Hide "Search AlgoGuru..." text on mobile (< sm)
    - Show truncated text on tablet (sm to md)
    - Show full text and keyboard shortcut on desktop (md+)
    - Ensure button meets 44px minimum touch target on mobile
    - _Requirements: 1.3, 5.1, 5.4, 9.1_

  - [x] 10.2 Update SearchModal component for mobile
    - Adjust modal width: full width with mx-4 margins on mobile, max-w-lg centered on desktop
    - Adjust max-height to 70vh for mobile keyboard accommodation
    - Increase result item spacing on mobile (py-4 vs py-3)
    - Ensure close button meets 44px touch target
    - Simplify footer hints on mobile
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 9.1_

  - [ ]* 10.3 Write integration tests for SearchModal responsive behavior
    - Test modal width and positioning at different breakpoints
    - Test result item spacing and touch targets
    - Test keyboard accommodation on mobile
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 11. Implement UserMenu responsive positioning
  - [x] 11.1 Update UserMenu component for mobile
    - Scale avatar button: w-10 h-10 on mobile, w-8 h-8 on desktop
    - Adjust dropdown width: w-64 on mobile, w-56 on desktop
    - Increase menu item padding on mobile (py-3 vs py-2.5)
    - Increase icon sizes on mobile (16px vs 14px)
    - Configure Radix UI collision detection for mobile viewport
    - Adjust sideOffset to 8px for better mobile positioning
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 9.1, 9.4_

  - [ ]* 11.2 Write unit tests for UserMenu responsive behavior
    - Test avatar scaling at different breakpoints
    - Test dropdown positioning and width
    - Test menu item touch targets
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 12. Implement content area responsive adjustments
  - [x] 12.1 Update main content container with responsive padding
    - Reduce horizontal padding from px-6 to px-4 on mobile
    - Maintain px-6 on desktop
    - Reduce vertical spacing between sections by 25% on mobile
    - Ensure code blocks are horizontally scrollable on mobile
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 12.2 Update typography for mobile readability
    - Adjust heading sizes for mobile (reduce by one step)
    - Ensure body text remains readable without zooming
    - Maintain consistent vertical rhythm across breakpoints
    - _Requirements: 6.2, 6.4_

  - [ ]* 12.3 Write visual regression tests for content area
    - Test content padding at different breakpoints
    - Test typography scaling
    - Test code block scrolling on mobile
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 13. Implement responsive image and media handling
  - [x] 13.1 Update image components with responsive classes
    - Add max-w-full class to all images
    - Ensure AlgoGuru logo scales: min 32px, max 48px on mobile
    - Maintain aspect ratios with aspect-ratio CSS property
    - Add lazy loading for images on mobile (loading="lazy")
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [x] 13.2 Update DiagramRenderer for mobile
    - Adapt diagram dimensions to mobile viewport width
    - Ensure diagrams remain readable on small screens
    - Add horizontal scroll if needed for complex diagrams
    - _Requirements: 11.3, 11.4_

  - [ ]* 13.3 Write tests for responsive image handling
    - Test image scaling at different breakpoints
    - Test aspect ratio preservation
    - Test lazy loading behavior
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 14. Implement mobile navigation enhancements
  - [x] 14.1 Update header with sticky positioning
    - Add sticky top-0 z-40 classes to header
    - Ensure header remains visible during scroll on mobile
    - Apply safe area padding for notched devices
    - _Requirements: 10.2, 10.3_

  - [x] 14.2 Optimize navigation interactions for mobile
    - Ensure topic navigation in sidebar is easily scrollable
    - Add smooth scroll behavior for anchor links
    - Ensure "Back To Top" button accessible on mobile
    - Verify sidebar trigger button is prominently visible
    - _Requirements: 10.1, 10.4, 10.5, 10.7_

  - [ ]* 14.3 Write integration tests for mobile navigation
    - Test sticky header behavior
    - Test smooth scrolling
    - Test sidebar scrolling
    - Test "Back To Top" functionality
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.7_

- [x] 15. Implement touch interaction optimizations
  - [x] 15.1 Audit and fix touch target sizes across all components
    - Verify all buttons meet 44x44px minimum on mobile
    - Add minimum 8px spacing between adjacent interactive elements
    - Increase button padding on mobile where needed
    - Ensure dropdown menu items have 44px minimum height on mobile
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 15.2 Add touch interaction improvements
    - Add touch-manipulation class to all buttons
    - Prevent double-tap zoom on interactive elements
    - Ensure swipe gestures don't conflict with code block scrolling
    - Add visual feedback for touch interactions (active states)
    - _Requirements: 9.5, 9.6, 9.7_

  - [ ]* 15.3 Write touch interaction tests
    - Test touch target sizes across components
    - Test spacing between interactive elements
    - Test touch feedback states
    - Test gesture conflict prevention
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 16. Final checkpoint - Comprehensive responsive testing
  - Test application at all standard viewport widths (375px, 768px, 1024px, 1440px)
  - Verify no horizontal scrolling at any viewport
  - Test all components on real mobile devices
  - Verify state persistence across viewport changes
  - Run accessibility audit at all breakpoints
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical breaks
- Implementation follows mobile-first approach: base styles for mobile, progressive enhancement for larger screens
- All custom hooks should be created before component adaptations to enable reuse
- State persistence should be tested thoroughly to ensure preferences work correctly across viewport changes
- Touch target compliance is critical for mobile usability - verify 44px minimum throughout
- Use Tailwind CSS utilities exclusively; avoid custom CSS except for safe areas and animations
