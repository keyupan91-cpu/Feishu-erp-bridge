import React, { useState, useEffect } from 'react';
import { useAccountStore } from '../stores/accountStore';
import { Form, Input, Button, Tabs, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, UserAddOutlined, CloudSyncOutlined, DatabaseOutlined, SafetyOutlined, ThunderboltOutlined } from '@ant-design/icons';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const { login, register, isInitialized } = useAccountStore();

  // 初始化检查 - 只在组件挂载时执行一次
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('开始初始化...');
        await useAccountStore.getState().initialize();
        console.log('初始化完成');
        const { currentAccount } = useAccountStore.getState();
        if (currentAccount) {
          onLoginSuccess();
        }
      } catch (error) {
        console.error('初始化失败:', error);
        // 初始化失败也显示登录界面
      }
    };
    checkAuth();

    // 3秒超时保护，确保即使初始化卡住也能显示界面
    const timeout = setTimeout(() => {
      const { isInitialized } = useAccountStore.getState();
      if (!isInitialized) {
        console.log('初始化超时，强制显示登录界面');
        useAccountStore.setState({ isInitialized: true });
      }
    }, 3000);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依赖数组，只在挂载时执行

  // 登录
  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      onLoginSuccess();
    } catch (error: any) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  // 注册
  const handleRegister = async (values: { username: string; password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await register(values.username, values.password);
      message.success('注册成功');
      onLoginSuccess();
    } catch (error: any) {
      message.error(error.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      }}>
        <Spin size="large" tip="初始化中..." />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* 左侧 - 绚丽背景 */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>
              <CloudSyncOutlined />
            </div>
            <h1 style={styles.logoTitle}>金蝶数据传输平台</h1>
            <p style={styles.logoSubtitle}>Feishu-Kingdee Data Bridge</p>
          </div>

          <div style={styles.featureList}>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}><DatabaseOutlined /></div>
              <div>
                <div style={styles.featureTitle}>数据同步</div>
                <div style={styles.featureDesc}>飞书多维表格与金蝶ERP无缝对接</div>
              </div>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}><ThunderboltOutlined /></div>
              <div>
                <div style={styles.featureTitle}>实时传输</div>
                <div style={styles.featureDesc}>高效稳定的数据传输引擎</div>
              </div>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}><SafetyOutlined /></div>
              <div>
                <div style={styles.featureTitle}>安全可靠</div>
                <div style={styles.featureDesc}>本地部署，数据安全有保障</div>
              </div>
            </div>
          </div>

          <div style={styles.decorations}>
            <div style={styles.circle1}></div>
            <div style={styles.circle2}></div>
            <div style={styles.circle3}></div>
            <div style={styles.floatingCard1}></div>
            <div style={styles.floatingCard2}></div>
          </div>
        </div>
      </div>

      {/* 右侧 - 登录表单 */}
      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>{activeTab === 'login' ? '欢迎回来' : '创建账户'}</h2>
            <p style={styles.formSubtitle}>
              {activeTab === 'login' ? '请登录您的账户以继续' : '注册新账户开始使用'}
            </p>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered
            style={styles.tabs}
          >
            <Tabs.TabPane tab="登录" key="login">
              <Form onFinish={handleLogin} autoComplete="off" layout="vertical">
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: '请输入用户名' }]}
                  label="用户名"
                >
                  <Input
                    prefix={<UserOutlined style={styles.inputIcon} />}
                    placeholder="请输入用户名"
                    size="large"
                    style={styles.input}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '请输入密码' }]}
                  label="密码"
                >
                  <Input.Password
                    prefix={<LockOutlined style={styles.inputIcon} />}
                    placeholder="请输入密码"
                    size="large"
                    style={styles.input}
                  />
                </Form.Item>

                <Form.Item style={{ marginTop: 24 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    icon={<LoginOutlined />}
                    loading={loading}
                    style={styles.submitBtn}
                  >
                    登录
                  </Button>
                </Form.Item>
              </Form>
            </Tabs.TabPane>

            <Tabs.TabPane tab="注册" key="register">
              <Form onFinish={handleRegister} autoComplete="off" layout="vertical">
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: '请输入用户名' }]}
                  label="用户名"
                >
                  <Input
                    prefix={<UserOutlined style={styles.inputIcon} />}
                    placeholder="请输入用户名"
                    size="large"
                    style={styles.input}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少6位' },
                  ]}
                  label="密码"
                >
                  <Input.Password
                    prefix={<LockOutlined style={styles.inputIcon} />}
                    placeholder="请输入密码（至少6位）"
                    size="large"
                    style={styles.input}
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  rules={[{ required: true, message: '请确认密码' }]}
                  label="确认密码"
                >
                  <Input.Password
                    prefix={<LockOutlined style={styles.inputIcon} />}
                    placeholder="请再次输入密码"
                    size="large"
                    style={styles.input}
                  />
                </Form.Item>

                <Form.Item style={{ marginTop: 24 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    icon={<UserAddOutlined />}
                    loading={loading}
                    style={styles.submitBtn}
                  >
                    注册
                  </Button>
                </Form.Item>
              </Form>
            </Tabs.TabPane>
          </Tabs>

          <div style={styles.footer}>
            <SafetyOutlined style={{ marginRight: 6 }} />
            数据存储在本地服务器，每个账户数据独立隔离
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100vw',
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  leftPanel: {
    flex: '1 1 55%',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #1a1a2e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  leftContent: {
    padding: '60px',
    maxWidth: '600px',
    zIndex: 2,
    position: 'relative' as const,
  },
  logoSection: {
    marginBottom: '60px',
  },
  logoIcon: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    color: '#fff',
    marginBottom: '24px',
    boxShadow: '0 20px 40px rgba(79, 172, 254, 0.3)',
  },
  logoTitle: {
    color: '#fff',
    fontSize: '42px',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '2px',
  },
  logoSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '16px',
    marginTop: '8px',
    letterSpacing: '1px',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
  },
  featureIcon: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    color: '#4facfe',
  },
  featureTitle: {
    color: '#fff',
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '4px',
  },
  featureDesc: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '14px',
  },
  decorations: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  circle1: {
    position: 'absolute' as const,
    width: '400px',
    height: '400px',
    border: '1px solid rgba(79, 172, 254, 0.1)',
    borderRadius: '50%',
    top: '-100px',
    left: '-100px',
  },
  circle2: {
    position: 'absolute' as const,
    width: '600px',
    height: '600px',
    border: '1px solid rgba(79, 172, 254, 0.08)',
    borderRadius: '50%',
    top: '-200px',
    left: '-200px',
  },
  circle3: {
    position: 'absolute' as const,
    width: '800px',
    height: '800px',
    border: '1px solid rgba(79, 172, 254, 0.05)',
    borderRadius: '50%',
    top: '-300px',
    left: '-300px',
  },
  floatingCard1: {
    position: 'absolute' as const,
    width: '120px',
    height: '80px',
    background: 'rgba(79, 172, 254, 0.1)',
    borderRadius: '12px',
    bottom: '15%',
    right: '10%',
    animation: 'float 6s ease-in-out infinite',
  },
  floatingCard2: {
    position: 'absolute' as const,
    width: '80px',
    height: '60px',
    background: 'rgba(0, 242, 254, 0.1)',
    borderRadius: '10px',
    bottom: '25%',
    right: '25%',
    animation: 'float 4s ease-in-out infinite',
    animationDelay: '1s',
  },
  rightPanel: {
    flex: '1 1 45%',
    background: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  formContainer: {
    width: '100%',
    maxWidth: '420px',
  },
  formHeader: {
    marginBottom: '32px',
    textAlign: 'center' as const,
  },
  formTitle: {
    fontSize: '28px',
    fontWeight: 600,
    color: '#1a1a2e',
    margin: 0,
  },
  formSubtitle: {
    color: '#64748b',
    marginTop: '8px',
    fontSize: '15px',
  },
  tabs: {
    marginBottom: '8px',
  },
  inputIcon: {
    color: '#94a3b8',
  },
  input: {
    borderRadius: '10px',
    height: '48px',
  },
  submitBtn: {
    height: '48px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 500,
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    border: 'none',
    boxShadow: '0 4px 15px rgba(26, 26, 46, 0.3)',
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '32px',
    color: '#94a3b8',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default AuthPage;