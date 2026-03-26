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

export function BottomNavBar({
  activeKey = 'home',
  onTabChange,
  items,
  visible = true,
}: BottomNavBarProps) {
  const [currentKey, setCurrentKey] = useState(activeKey);
  const { isMobile } = useResponsive();

  const defaultItems: NavItem[] = [
    { key: 'home', label: '首页', icon: <HomeOutlined /> },
    { key: 'tasks', label: '任务', icon: <CloudSyncOutlined /> },
    { key: 'config', label: '配置', icon: <SettingOutlined /> },
    { key: 'profile', label: '我的', icon: <UserOutlined /> },
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
          height: calc(64px + env(safe-area-inset-bottom, 0));
          background: linear-gradient(180deg, rgba(251, 253, 255, 0.97) 0%, rgba(241, 246, 250, 0.96) 100%);
          border-top: 1px solid #d0dae2;
          box-shadow: 0 -8px 24px rgba(90, 110, 126, 0.14);
          display: flex;
          align-items: flex-start;
          justify-content: space-around;
          z-index: 999;
          padding-top: 8px;
          padding-bottom: env(safe-area-inset-bottom, 0);
          backdrop-filter: blur(8px);
          border-top-left-radius: 18px;
          border-top-right-radius: 18px;
          overflow: hidden;
        }

        .bottom-nav-bar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 16px;
          right: 16px;
          height: 1px;
          background: linear-gradient(90deg, rgba(121, 141, 157, 0) 0%, rgba(121, 141, 157, 0.58) 50%, rgba(121, 141, 157, 0) 100%);
        }

        .bottom-nav-item {
          position: relative;
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
          color: #5d7182;
          transition: all 0.18s ease;
          border-radius: 12px;
        }

        .bottom-nav-item:hover {
          color: #405b70;
        }

        .bottom-nav-item.active {
          color: #2d4a5f;
          transform: translateY(-2px);
        }

        .bottom-nav-item.active .bottom-nav-item-icon {
          background: rgba(113, 142, 163, 0.2);
          border-color: rgba(106, 130, 147, 0.48);
          box-shadow: 0 4px 12px rgba(90, 113, 130, 0.2);
        }

        .bottom-nav-item-icon {
          font-size: 20px;
          margin-bottom: 2px;
          width: 30px;
          height: 30px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          background: rgba(231, 239, 244, 0.84);
          transition: all 0.2s ease;
        }

        .bottom-nav-item-text {
          font-size: 12px;
          text-align: center;
          color: inherit;
          font-weight: 700;
          letter-spacing: 0.1px;
        }
      `}</style>
    </nav>
  );
}

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
            <span className="back-icon">←</span>
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
          background: rgba(250, 253, 255, 0.93);
          border-bottom: 1px solid #d9e3eb;
          z-index: 999;
          padding: 12px 16px;
          padding-top: max(12px, env(safe-area-inset-top, 0));
          backdrop-filter: blur(8px);
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
          background: #eef4f8;
          border: 1px solid #d1dde7;
          cursor: pointer;
          border-radius: 12px;
          transition: background 0.15s ease;
        }

        .back-icon {
          font-size: 21px;
          line-height: 1;
          color: #446075;
        }

        .top-nav-title {
          flex: 1;
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #30495c;
          text-align: center;
          letter-spacing: 0.3px;
        }

        .top-nav-right {
          width: 40px;
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </header>
  );
}

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
          background: #476278;
          border-radius: 2px;
          transition: all 0.3s ease;
          transform-origin: center;
        }

        .hamburger-line.open {
          background: #64839a;
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
      `}</style>
    </button>
  );
}

