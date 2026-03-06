import { useState, useEffect } from 'react';

export interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallMobile: boolean;
}

const BREAKPOINTS = {
  SMALL_MOBILE: 375,
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1200,
};

/**
 * 响应式 Hook - 检测屏幕尺寸并返回相应状态
 *
 * 使用示例:
 * ```tsx
 * const { isMobile, isTablet, isDesktop } = useResponsive();
 *
 * return (
 *   <div>
 *     {isMobile && <MobileLayout />}
 *     {isDesktop && <DesktopLayout />}
 *   </div>
 * );
 * ```
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const height = typeof window !== 'undefined' ? window.innerHeight : 800;
    return getResponsiveState(width, height);
  });

  useEffect(() => {
    let ticking = false;

    const handleResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const width = window.innerWidth;
          const height = window.innerHeight;
          setState(getResponsiveState(width, height));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
}

function getResponsiveState(width: number, height: number): ResponsiveState {
  return {
    width,
    height,
    isSmallMobile: width <= BREAKPOINTS.SMALL_MOBILE,
    isMobile: width <= BREAKPOINTS.MOBILE,
    isTablet: width > BREAKPOINTS.MOBILE && width <= BREAKPOINTS.TABLET,
    isDesktop: width > BREAKPOINTS.TABLET,
  };
}

/**
 * 获取当前断点级别
 */
export function useBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
  const { width } = useResponsive();

  if (width <= BREAKPOINTS.SMALL_MOBILE) return 'xs';
  if (width <= BREAKPOINTS.MOBILE) return 'sm';
  if (width <= BREAKPOINTS.TABLET) return 'md';
  if (width <= BREAKPOINTS.DESKTOP) return 'lg';
  return 'xl';
}

/**
 * 媒体查询 Hook - 监听特定断点
 *
 * 使用示例:
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);

    // 如果支持 addEventListener 则使用新 API
    if (media.addEventListener) {
      const handleChange = (e: MediaQueryListEvent) => setMatches(e.matches);
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    } else {
      // 兼容旧 API
      const handleChange = () => setMatches(media.matches);
      media.addListener(handleChange);
      return () => media.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}
