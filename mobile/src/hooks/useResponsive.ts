import { useWindowDimensions } from 'react-native';

// ─── Breakpoints ─────────────────────────────────────────────────────────────
export const BREAKPOINTS = {
  tablet: 600,
  desktop: 1024,
} as const;

// ─── Content max-widths per breakpoint ───────────────────────────────────────
export const CONTENT_MAX_WIDTH = {
  mobile: 9999,   // full width
  tablet: 700,
  desktop: 920,
} as const;

// ─── Desktop wrapper max-width ────────────────────────────────────────────────
export const DESKTOP_WRAPPER_MAX_WIDTH = 1100;

/**
 * Central responsive hook.
 *
 * Usage:
 *   const { isMobile, isTablet, isDesktop, rs, contentMaxWidth } = useResponsive();
 *
 * rs(mobile, tablet, desktop) — pick the value for the current breakpoint.
 */
export function useResponsive() {
  const { width } = useWindowDimensions();

  const isMobile = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;

  /** Return different values per breakpoint */
  function rs<T>(mobile: T, tablet: T, desktop: T): T {
    if (isDesktop) return desktop;
    if (isTablet) return tablet;
    return mobile;
  }

  const contentMaxWidth = rs(
    CONTENT_MAX_WIDTH.mobile,
    CONTENT_MAX_WIDTH.tablet,
    CONTENT_MAX_WIDTH.desktop,
  );

  const horizontalPadding = rs(16, 24, 32);

  return {
    width,
    isMobile,
    isTablet,
    isDesktop,
    rs,
    contentMaxWidth,
    horizontalPadding,
  };
}
