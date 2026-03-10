import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography, Badge, Tooltip } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UnorderedListOutlined,
  HistoryOutlined,
  ApiOutlined,
  UserOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useAccountStore } from '../stores/accountStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { currentAccount } = useAccountStore();

  const menuItems = [
    {
      key: 'tasks',
      icon: <UnorderedListOutlined />,
      label: '任务管理',
    },
    {
      key: 'monitoring',
      icon: <HistoryOutlined />,
      label: '执行监控',
    },
    {
      key: 'debugger',
      icon: <ApiOutlined />,
      label: 'API调试',
    },
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      label: '帮助文档',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      onLogout();
    }
  };

  return (
    <Layout style={styles.layout}>
      {/* 侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={styles.sider}
        width={240}
        collapsedWidth={80}
      >
        {/* Logo区域 */}
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <ApiOutlined />
          </div>
          {!collapsed && (
            <div style={styles.logoText}>
              <span style={styles.logoTitle}>金蝶数据传输</span>
              <span style={styles.logoSubtitle}>Data Bridge</span>
            </div>
          )}
        </div>

        {/* 菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[activeTab]}
          items={menuItems}
          onClick={({ key }) => onTabChange(key)}
          style={styles.menu}
        />

        {/* 底部折叠按钮 */}
        <div style={styles.collapseBtn}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={styles.collapseIcon}
          />
        </div>
      </Sider>

      {/* 右侧内容区 */}
      <Layout>
        {/* 顶部导航栏 */}
        <Header style={styles.header}>
          <div style={styles.headerLeft}>
            <Text style={styles.pageTitle}>
              {menuItems.find(item => item.key === activeTab)?.label || '首页'}
            </Text>
          </div>

          <div style={styles.headerRight}>
            {/* 通知 */}
            <Tooltip title="通知">
              <Badge count={0} size="small">
                <Button type="text" icon={<BellOutlined />} style={styles.headerBtn} />
              </Badge>
            </Tooltip>

            {/* 用户信息 */}
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
            >
              <div style={styles.userInfo}>
                <Avatar
                  size="small"
                  style={{ backgroundColor: '#4facfe' }}
                  icon={<UserOutlined />}
                />
                <Text style={styles.userName}>
                  {currentAccount?.username || '用户'}
                </Text>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* 主内容区域 */}
        <Content style={styles.content}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  layout: {
    minHeight: '100vh',
    background: '#f0f2f5',
  },
  sider: {
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
    boxShadow: '2px 0 8px rgba(0, 0, 0, 0.15)',
    position: 'relative',
  },
  logo: {
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    color: '#fff',
    boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)',
  },
  logoText: {
    marginLeft: '12px',
    display: 'flex',
    flexDirection: 'column',
  },
  logoTitle: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '1px',
  },
  logoSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '11px',
    letterSpacing: '0.5px',
  },
  menu: {
    background: 'transparent',
    border: 'none',
    marginTop: '16px',
  },
  collapseBtn: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  collapseIcon: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: '18px',
  },
  header: {
    background: '#fff',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
    height: '64px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1a1a2e',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerBtn: {
    color: '#666',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '4px 12px',
    borderRadius: '20px',
    background: '#f5f5f5',
    transition: 'all 0.3s',
  },
  userName: {
    color: '#333',
    fontSize: '14px',
  },
  content: {
    margin: '24px',
    padding: '24px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    minHeight: 'calc(100vh - 112px)',
    overflow: 'auto',
  },
};

export default MainLayout;