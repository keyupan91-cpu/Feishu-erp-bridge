/**
 * 移动端布局组件
 *
 * 功能：
 * 1. 底部 TabBar 导航
 * 2. 响应式内容区域
 * 3. 移动端专用交互优化
 */

import { useState } from 'react';
import { Button, Badge } from 'antd';
import {
  HomeOutlined,
  SettingOutlined,
  UserOutlined,
  ApiOutlined,
  CloudSyncOutlined,
} from '@ant-design/icons';

interface MobileLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (key: string) => void;
  showApiDebugger?: boolean;
}

// 导航项配置
interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export default function MobileLayout({
  children,
  activeTab = 'home',
  onTabChange,
  showApiDebugger = false,
}: MobileLayoutProps) {
  const [currentTab, setCurrentTab] = useState(activeTab);

  // 导航配置
  const navItems: NavItem[] = [
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

  // 如果显示 API 调试器，添加对应导航项
  if (showApiDebugger) {
    navItems.splice(2, 0, {
      key: 'api',
      label: 'API',
      icon: <ApiOutlined />,
    });
  }

  // 处理 Tab 切换
  const handleTabChange = (key: string) => {
    setCurrentTab(key);
    onTabChange?.(key);
  };

  return (
    <div className="mobile-layout">
      {/* 内容区域 */}
      <div className="mobile-content">
        {children}
      </div>

      {/* 底部 TabBar */}
      <nav className="mobile-tabbar no-select">
        {navItems.map((item) => (
          <a
            key={item.key}
            href={`#${item.key}`}
            className={`mobile-tabbar-item ${currentTab === item.key ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleTabChange(item.key);
            }}
          >
            <div className="mobile-tabbar-item-icon">
              {item.badge ? (
                <Badge count={item.badge} offset={[-5, 5]}>
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </div>
            <span className="mobile-tabbar-item-text">{item.label}</span>
          </a>
        ))}
      </nav>

      <style>{`
        .mobile-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          padding-bottom: 56px;
        }

        .mobile-content {
          flex: 1;
          overflow-y: auto;
        }

        .mobile-tabbar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 56px;
          background: #ffffff;
          border-top: 1px solid #e8edf2;
          display: flex;
          align-items: center;
          justify-content: space-around;
          z-index: 1000;
          padding-bottom: env(safe-area-inset-bottom, 0);
        }

        .mobile-tabbar-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4px 12px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color var(--transition-fast);
          flex: 1;
        }

        .mobile-tabbar-item.active {
          color: var(--primary-color);
        }

        .mobile-tabbar-item-icon {
          font-size: 20px;
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-tabbar-item-text {
          font-size: 11px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

// 移动端任务卡片组件
interface MobileTaskCardProps {
  task: any;
  onEdit?: () => void;
  onToggle?: () => void;
  onExecute?: () => void;
}

export function MobileTaskCard({
  task,
  onEdit,
  onToggle,
  onExecute,
}: MobileTaskCardProps) {
  return (
    <div className="task-card-mobile ant-card">
      <div className="task-card-mobile-header">
        <h3 className="task-card-mobile-title">{task.name}</h3>
        <div className="task-card-mobile-status">
          <Badge
            status={task.enabled ? 'success' : 'default'}
            text={task.enabled ? '已启用' : '已禁用'}
          />
        </div>
      </div>

      <div className="task-card-mobile-body">
        <div>
          <strong>源：</strong> 飞书 · {task.sourceTable || '-'}
        </div>
        <div>
          <strong>目标：</strong> 金蝶 · {task.targetFormId || '-'}
        </div>
        {task.schedule && (
          <div>
            <strong>调度：</strong> {task.schedule}
          </div>
        )}
      </div>

      <div className="task-card-mobile-footer">
        <Button
          size="small"
          icon={<CloudSyncOutlined />}
          onClick={onExecute}
          disabled={!task.enabled}
        >
          执行
        </Button>
        <Button
          size="small"
          icon={<SettingOutlined />}
          onClick={onEdit}
        >
          编辑
        </Button>
        <Button
          size="small"
          danger
          icon={<CloudSyncOutlined />}
          onClick={onToggle}
        >
          {task.enabled ? '禁用' : '启用'}
        </Button>
      </div>

      <style>{`
        .task-card-mobile {
          padding: 12px;
          margin-bottom: 8px;
          border-radius: 12px;
        }

        .task-card-mobile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .task-card-mobile-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 200px;
        }

        .task-card-mobile-status {
          flex-shrink: 0;
        }

        .task-card-mobile-body {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .task-card-mobile-body strong {
          color: var(--text-primary);
        }

        .task-card-mobile-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border-color);
        }

        .task-card-mobile-footer .ant-btn {
          min-height: 32px;
        }
      `}</style>
    </div>
  );
}

// 移动端页面标题组件
interface MobilePageHeaderProps {
  title: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}

export function MobilePageHeader({
  title,
  onBack,
  rightContent,
}: MobilePageHeaderProps) {
  return (
    <div className="mobile-page-header">
      <div className="mobile-page-header-content">
        {onBack && (
          <Button
            type="text"
            icon={<span style={{ fontSize: 18 }}>‹</span>}
            onClick={onBack}
            className="mobile-back-btn"
          />
        )}
        <h1 className="mobile-page-title">{title}</h1>
        {rightContent && (
          <div className="mobile-page-header-right">
            {rightContent}
          </div>
        )}
      </div>

      <style>{`
        .mobile-page-header {
          position: sticky;
          top: 0;
          background: var(--bg-primary);
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color);
          z-index: 100;
        }

        .mobile-page-header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mobile-back-btn {
          font-size: 20px;
          padding: 4px 8px;
        }

        .mobile-page-title {
          flex: 1;
          margin: 0;
          font-size: 17px;
          font-weight: 600;
          color: var(--text-primary);
          text-align: center;
        }

        .mobile-page-header-right {
          width: 40px;
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}
