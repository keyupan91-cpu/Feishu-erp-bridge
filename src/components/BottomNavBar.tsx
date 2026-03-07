import { useState, useEffect } from 'react';
import { Badge } from 'antd';
import {
  HomeOutlined,
  SettingOutlined,
  UserOutlined,
  CloudSyncOutlined,
} from '@ant-design/icons';
import { useResponsive } from '../hooks/useResponsive';

export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export interface BottomNavBarProps {
  activeKey?: string;
  onTabChange?: (key: string) => void;
  items?: NavItem[];
  visible?: boolean;
}

/**
 * 移动端底部导航栏
 * - 触摸友好的大点击区域
 * - 支持 Badge 徽标
 * - 自动适配安全区域
 */
export function BottomNavBar({
  activeKey = 'home',
  onTabChange,
  items,
  visible = true,
}: BottomNavBarProps) {
  const [currentKey, setCurrentKey] = useState(activeKey);
  const { isMobile } = useResponsive();

  // 默认导航项
  const defaultItems: NavItem[] = [
    {
      key: 'home',
      label: '首页',
      icon: <HomeOutlined />,
    },
    {
      key: 'tasks',
      label: '任务',
      icon: <CloudSyncOutlined />,
    },
    {
      key: 'config',
      label: '配置',
      icon: <SettingOutlined />,
    },
    {
      key: 'profile',
      label: '我的',
      icon: <UserOutlined />,
    },
  ];

  const navItems = items || defaultItems;

  useEffect(() => {
    setCurrentKey(activeKey);
  }, [activeKey]);

  const handleTabChange = (key: string) => {
    setCurrentKey(key);
    onTabChange?.(key);
  };

  if (!visible || !isMobile) {
    return null;
  }

  return (
    <nav className="bottom-nav-bar" aria-label="底部导航">
      {navItems.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`bottom-nav-item ${currentKey === item.key ? 'active' : ''}`}
          onClick={() => handleTabChange(item.key)}
          aria-label={item.label}
          aria-pressed={currentKey === item.key}
        >
          <div className="bottom-nav-item-icon">
            {item.badge ? (
              <Badge count={item.badge} offset={[-3, 3]}>
                {item.icon}
              </Badge>
            ) : (
              item.icon
            )}
          </div>
          <span className="bottom-nav-item-text">{item.label}</span>
        </button>
      ))}

      <style>{`
        .bottom-nav-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: calc(56px + env(safe-area-inset-bottom, 0));
          background: #ffffff;
          border-top: 1px solid #e8edf2;
          box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: flex-start;
          justify-content: space-around;
          z-index: 999;
          padding-top: 8px;
          padding-bottom: env(safe-area-inset-bottom, 0);
        }

        .bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4px 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          flex: 1;
          min-height: 48px;
          transition: all 0.15s ease;
        }

        .bottom-nav-item.active {
          color: #4A90E2;
        }

        .bottom-nav-item-icon {
          font-size: 20px;
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bottom-nav-item-text {
          font-size: 11px;
          text-align: center;
          color: inherit;
        }

        /* 暗黑模式适配 */
        @media (prefers-color-scheme: dark) {
          .bottom-nav-bar {
            background: #1a1a2e;
            border-top-color: #2a2a4e;
          }
        }
      `}</style>
    </nav>
  );
}

/**
 * 移动端顶部导航栏
 */
export interface TopNavBarProps {
  title?: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  visible?: boolean;
}

export function TopNavBar({
  title,
  onBack,
  rightContent,
  visible = true,
}: TopNavBarProps) {
  const { isMobile } = useResponsive();

  if (!visible || !isMobile) {
    return null;
  }

  return (
    <header className="top-nav-bar">
      <div className="top-nav-content">
        {onBack && (
          <button
            type="button"
            className="top-nav-back"
            onClick={onBack}
            aria-label="返回"
          >
            <span className="back-icon">‹</span>
          </button>
        )}
        <h1 className="top-nav-title">{title}</h1>
        {rightContent && (
          <div className="top-nav-right">{rightContent}</div>
        )}
      </div>

      <style>{`
        .top-nav-bar {
          position: sticky;
          top: 0;
          background: #ffffff;
          border-bottom: 1px solid #e8edf2;
          z-index: 999;
          padding: 12px 16px;
          padding-top: max(12px, env(safe-area-inset-top, 0));
        }

        .top-nav-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .top-nav-back {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: 50%;
          transition: background 0.15s ease;
        }

        .top-nav-back:hover {
          background: #f5f5f5;
        }

        .back-icon {
          font-size: 24px;
          line-height: 1;
          color: #333;
        }

        .top-nav-title {
          flex: 1;
          margin: 0;
          font-size: 17px;
          font-weight: 600;
          color: #1a1a2e;
          text-align: center;
        }

        .top-nav-right {
          width: 40px;
          display: flex;
          justify-content: flex-end;
        }

        /* 暗黑模式适配 */
        @media (prefers-color-scheme: dark) {
          .top-nav-bar {
            background: #1a1a2e;
            border-bottom-color: #2a2a4e;
          }

          .top-nav-title {
            color: #eaeaea;
          }

          .back-icon {
            color: #eaeaea;
          }
        }
      `}</style>
    </header>
  );
}

/**
 * 移动端汉堡菜单按钮
 */
export interface HamburgerMenuProps {
  isOpen?: boolean;
  onClick?: () => void;
  size?: number;
}

export function HamburgerMenu({
  isOpen = false,
  onClick,
  size = 24,
}: HamburgerMenuProps) {
  return (
    <button
      type="button"
      className="hamburger-menu"
      onClick={onClick}
      aria-label={isOpen ? '关闭菜单' : '打开菜单'}
      aria-expanded={isOpen}
    >
      <span className={`hamburger-line line-1 ${isOpen ? 'open' : ''}`} />
      <span className={`hamburger-line line-2 ${isOpen ? 'open' : ''}`} />
      <span className={`hamburger-line line-3 ${isOpen ? 'open' : ''}`} />

      <style>{`
        .hamburger-menu {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: ${size}px;
          height: ${size}px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          z-index: 1001;
        }

        .hamburger-line {
          width: 100%;
          height: 2px;
          background: #333;
          border-radius: 2px;
          transition: all 0.3s ease;
          transform-origin: center;
        }

        .hamburger-line.open {
          background: #4A90E2;
        }

        .line-1.open {
          transform: translateY(${size / 2 - 1}px) rotate(45deg);
        }

        .line-2.open {
          opacity: 0;
        }

        .line-3.open {
          transform: translateY(-${size / 2 - 1}px) rotate(-45deg);
        }

        /* 暗黑模式适配 */
        @media (prefers-color-scheme: dark) {
          .hamburger-line:not(.open) {
            background: #eaeaea;
          }
        }
      `}</style>
    </button>
  );
}
