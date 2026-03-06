import { useResponsive } from '../hooks/useResponsive';

/**
 * 响应式布局配置
 * - 根据屏幕尺寸自动切换桌面端/移动端布局
 * - 提供统一的 Tab 切换接口
 */

interface LayoutConfig {
  activeTab: string;
  onTabChange: (key: string) => void;
  showBottomNav: boolean;
  showTopNav: boolean;
  isHorizontalTabs: boolean;
}

export type { LayoutConfig };

/**
 * 使用布局 Hook - 根据屏幕尺寸返回不同的布局配置
 */
export function useLayout(activeTab: string, onTabChange: (key: string) => void): LayoutConfig {
  const { isMobile, isTablet } = useResponsive();

  const isHorizontalTabs = !isMobile; // 桌面端使用横向标签页，移动端使用底部导航

  return {
    activeTab,
    onTabChange,
    showBottomNav: isMobile || isTablet,
    showTopNav: isMobile,
    isHorizontalTabs,
  };
}

export { useResponsive } from '../hooks/useResponsive';
