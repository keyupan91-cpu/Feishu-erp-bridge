import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Space, Tag, Typography } from 'antd';
import { ApiOutlined, CloudSyncOutlined, HomeOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface MobileLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (key: string) => void;
  showApiDebugger?: boolean;
}

export default function MobileLayout({
  children,
  activeTab = 'home',
  onTabChange,
  showApiDebugger = false,
}: MobileLayoutProps) {
  const [currentTab, setCurrentTab] = useState(activeTab);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      { key: 'home', label: '首页', icon: <HomeOutlined /> },
      { key: 'tasks', label: '任务', icon: <CloudSyncOutlined /> },
      { key: 'config', label: '配置', icon: <SettingOutlined /> },
      { key: 'profile', label: '我的', icon: <UserOutlined /> },
    ];
    if (showApiDebugger) {
      items.splice(2, 0, { key: 'api', label: 'API', icon: <ApiOutlined /> });
    }
    return items;
  }, [showApiDebugger]);

  const handleChange = (key: string) => {
    setCurrentTab(key);
    onTabChange?.(key);
  };

  return (
    <div className="mobile-layout">
      <div className="mobile-layout-content">{children}</div>

      <nav className="mobile-layout-tabbar">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`mobile-layout-tab ${currentTab === item.key ? 'active' : ''}`}
            onClick={() => handleChange(item.key)}
          >
            <span className="tab-icon">
              {item.badge ? (
                <Badge count={item.badge} size="small">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </span>
            <span className="tab-text">{item.label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        .mobile-layout {
          min-height: 100%;
          display: flex;
          flex-direction: column;
        }
        .mobile-layout-content {
          flex: 1;
          padding-bottom: 72px;
        }
        .mobile-layout-tabbar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: calc(58px + env(safe-area-inset-bottom, 0));
          border-top: 1px solid #d7e4d1;
          background: rgba(252, 255, 249, 0.95);
          backdrop-filter: blur(8px);
          display: flex;
          padding-bottom: env(safe-area-inset-bottom, 0);
          z-index: 999;
        }
        .mobile-layout-tab {
          flex: 1;
          border: 0;
          background: transparent;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          color: #6a8160;
          font-size: 11px;
        }
        .mobile-layout-tab.active {
          color: #345a3b;
          font-weight: 600;
        }
        .tab-icon {
          font-size: 18px;
          line-height: 1;
        }
      `}</style>
    </div>
  );
}

interface MobilePageHeaderProps {
  title: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}

export function MobilePageHeader({ title, onBack, rightContent }: MobilePageHeaderProps) {
  return (
    <div className="mobile-page-header">
      <div className="header-left">
        {onBack ? (
          <Button type="text" onClick={onBack} style={{ padding: 0, width: 32 }}>
            ←
          </Button>
        ) : (
          <span style={{ width: 32 }} />
        )}
      </div>
      <div className="header-title">{title}</div>
      <div className="header-right">{rightContent || <span style={{ width: 32 }} />}</div>

      <style>{`
        .mobile-page-header {
          position: sticky;
          top: 0;
          z-index: 999;
          height: 52px;
          display: grid;
          grid-template-columns: 40px 1fr 40px;
          align-items: center;
          padding: 0 12px;
          background: rgba(250, 255, 247, 0.92);
          border-bottom: 1px solid #d8e4d1;
          backdrop-filter: blur(8px);
        }
        .header-title {
          text-align: center;
          font-size: 16px;
          font-weight: 700;
          color: #2f4534;
        }
        .header-left,
        .header-right {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}

interface MobileTaskCardProps {
  title: string;
  description?: string;
  enabled?: boolean;
  extra?: React.ReactNode;
  onExecute?: () => void;
  onConfig?: () => void;
}

export function MobileTaskCard({
  title,
  description,
  enabled = true,
  extra,
  onExecute,
  onConfig,
}: MobileTaskCardProps) {
  return (
    <Card
      size="small"
      title={
        <Space>
          <Text strong>{title}</Text>
          <Tag color={enabled ? 'green' : 'default'}>{enabled ? '已启用' : '已禁用'}</Tag>
        </Space>
      }
      extra={extra}
      style={{ marginBottom: 12 }}
    >
      {description ? <Text type="secondary">{description}</Text> : null}
      <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button onClick={onConfig}>配置</Button>
        <Button type="primary" disabled={!enabled} onClick={onExecute}>
          执行
        </Button>
      </div>
    </Card>
  );
}
