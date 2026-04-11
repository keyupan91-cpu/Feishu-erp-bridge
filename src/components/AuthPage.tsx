import React, { useState } from 'react';
import { Form, Input, Button, Tabs, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined,
  UserAddOutlined,
  DatabaseOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useAccountStore } from '../stores/accountStore';
import { useResponsive } from '../hooks/useResponsive';
import BrandLogo from './BrandLogo';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAccountStore();
  const { width, isSmallMobile } = useResponsive();

  const isCompactLayout = width <= 900;
  const isPhone = width <= 480;

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

  return (
    <div style={{ ...styles.container, ...(isCompactLayout ? styles.containerCompact : {}) }}>
      {!isCompactLayout && (
        <div style={styles.leftPanel}>
          <div style={styles.leftContent}>
            <div style={styles.logoSection}>
              <div style={styles.logoIcon}>
                <BrandLogo size={78} />
              </div>
              <h1 style={styles.logoTitle}>云桥</h1>
              <p style={styles.logoSubtitle}>CloudLink</p>
            </div>

            <div style={styles.featureList}>
              <div style={styles.featureItem}>
                <div style={styles.featureIcon}><DatabaseOutlined /></div>
                <div>
                  <div style={styles.featureTitle}>数据同步</div>
                  <div style={styles.featureDesc}>飞书多维表格与金蝶 ERP 平滑对接</div>
                </div>
              </div>
              <div style={styles.featureItem}>
                <div style={styles.featureIcon}><ThunderboltOutlined /></div>
                <div>
                  <div style={styles.featureTitle}>实时传输</div>
                  <div style={styles.featureDesc}>稳定执行，状态反馈清晰可追踪</div>
                </div>
              </div>
              <div style={styles.featureItem}>
                <div style={styles.featureIcon}><SafetyOutlined /></div>
                <div>
                  <div style={styles.featureTitle}>安全可靠</div>
                  <div style={styles.featureDesc}>本地部署，账号与数据独立隔离</div>
                </div>
              </div>
            </div>

            <div style={styles.decorations}>
              <div style={styles.circle1}></div>
              <div style={styles.circle2}></div>
            </div>
          </div>
        </div>
      )}

      <div style={{ ...styles.rightPanel, ...(isCompactLayout ? styles.rightPanelCompact : {}) }}>
        {isCompactLayout && (
          <div style={styles.mobileBrand}>
            <div style={{ ...styles.logoIcon, ...styles.mobileBrandIcon }}>
              <BrandLogo size={44} />
            </div>
            <div>
              <div style={styles.mobileBrandTitle}>云桥</div>
              <div style={styles.mobileBrandSubtitle}>CloudLink</div>
            </div>
          </div>
        )}

        <div
          style={{
            ...styles.formContainer,
            ...(isCompactLayout ? styles.formContainerCompact : {}),
            ...(isSmallMobile ? styles.formContainerSmallMobile : {}),
          }}
        >
          <div style={{ ...styles.formHeader, ...(isCompactLayout ? styles.formHeaderCompact : {}) }}>
            <h2 style={{ ...styles.formTitle, ...(isCompactLayout ? styles.formTitleCompact : {}) }}>
              {activeTab === 'login' ? '欢迎回来' : '创建账号'}
            </h2>
            <p style={{ ...styles.formSubtitle, ...(isCompactLayout ? styles.formSubtitleCompact : {}) }}>
              {activeTab === 'login' ? '请登录您的账户以继续' : '注册新账户开始使用'}
            </p>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered={!isPhone}
            style={{ ...styles.tabs, ...(isCompactLayout ? styles.tabsCompact : {}) }}
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
                    style={{ ...styles.input, ...(isSmallMobile ? styles.inputSmallMobile : {}) }}
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
                    style={{ ...styles.input, ...(isSmallMobile ? styles.inputSmallMobile : {}) }}
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
                    style={{ ...styles.submitBtn, ...(isSmallMobile ? styles.submitBtnSmallMobile : {}) }}
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
                    style={{ ...styles.input, ...(isSmallMobile ? styles.inputSmallMobile : {}) }}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少 6 位' },
                  ]}
                  label="密码"
                >
                  <Input.Password
                    prefix={<LockOutlined style={styles.inputIcon} />}
                    placeholder="请输入密码（至少 6 位）"
                    size="large"
                    style={{ ...styles.input, ...(isSmallMobile ? styles.inputSmallMobile : {}) }}
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
                    style={{ ...styles.input, ...(isSmallMobile ? styles.inputSmallMobile : {}) }}
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
                    style={{ ...styles.submitBtn, ...(isSmallMobile ? styles.submitBtnSmallMobile : {}) }}
                  >
                    注册
                  </Button>
                </Form.Item>
              </Form>
            </Tabs.TabPane>
          </Tabs>

          <div style={{ ...styles.footer, ...(isCompactLayout ? styles.footerCompact : {}) }}>
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
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  containerCompact: {
    position: 'relative',
    width: '100%',
    minHeight: '100vh',
    height: 'auto',
    overflowY: 'auto',
    background: 'linear-gradient(180deg, #f1f7ed 0%, #eaf2e5 100%)',
  },
  leftPanel: {
    flex: '1 1 56%',
    background: 'linear-gradient(145deg, #edf4e7 0%, #e4eddc 50%, #dce7d1 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderRight: '1px solid #d4e1ca',
  },
  leftContent: {
    padding: '56px',
    maxWidth: '620px',
    zIndex: 2,
    position: 'relative',
  },
  logoSection: {
    marginBottom: '56px',
  },
  logoIcon: {
    width: '78px',
    height: '78px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  logoTitle: {
    color: '#2f4633',
    fontSize: '40px',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '1px',
  },
  logoSubtitle: {
    color: '#688160',
    fontSize: '16px',
    margin: '12px 0 0',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '14px',
    background: 'rgba(255, 255, 255, 0.44)',
    border: '1px solid rgba(120, 151, 108, 0.18)',
    backdropFilter: 'blur(3px)',
  },
  featureIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    background: '#edf5e8',
    color: '#53744f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    marginTop: '2px',
  },
  featureTitle: {
    color: '#365136',
    fontWeight: 700,
    marginBottom: '4px',
  },
  featureDesc: {
    color: '#5e745f',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  decorations: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  circle1: {
    position: 'absolute',
    width: '220px',
    height: '220px',
    borderRadius: '50%',
    right: '-80px',
    top: '-70px',
    background: 'radial-gradient(circle, rgba(169, 201, 155, 0.32) 0%, rgba(169, 201, 155, 0) 68%)',
  },
  circle2: {
    position: 'absolute',
    width: '280px',
    height: '280px',
    borderRadius: '50%',
    left: '-120px',
    bottom: '-130px',
    background: 'radial-gradient(circle, rgba(142, 181, 130, 0.24) 0%, rgba(142, 181, 130, 0) 70%)',
  },
  rightPanel: {
    flex: '1 1 44%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #f9fcf7 0%, #f2f8ee 100%)',
    padding: '24px',
  },
  rightPanelCompact: {
    padding: '18px 14px 24px',
    width: '100%',
    maxWidth: '560px',
    margin: '0 auto',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: '12px',
  },
  mobileBrand: {
    width: '100%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    padding: '10px 12px',
    borderRadius: '14px',
    background: 'rgba(255, 255, 255, 0.78)',
    border: '1px solid #dce8d4',
  },
  mobileBrandIcon: {
    width: '48px',
    height: '48px',
    marginBottom: 0,
  },
  mobileBrandTitle: {
    color: '#2f4633',
    fontWeight: 700,
    fontSize: '15px',
  },
  mobileBrandSubtitle: {
    color: '#688160',
    fontSize: '12px',
    marginTop: '2px',
  },
  formContainer: {
    width: '100%',
    maxWidth: '460px',
    background: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #dbe8d4',
    boxShadow: '0 18px 40px rgba(102, 128, 93, 0.16)',
    padding: '28px 24px 20px',
  },
  formContainerCompact: {
    width: '100%',
    maxWidth: '100%',
    borderRadius: '16px',
    padding: '20px 16px 14px',
  },
  formContainerSmallMobile: {
    borderRadius: '14px',
    padding: '16px 14px 12px',
  },
  formHeader: {
    marginBottom: '14px',
  },
  formHeaderCompact: {
    marginBottom: '10px',
  },
  formTitle: {
    margin: 0,
    color: '#2f4633',
    fontSize: '26px',
    fontWeight: 700,
  },
  formTitleCompact: {
    fontSize: '22px',
  },
  formSubtitle: {
    margin: '8px 0 0',
    color: '#6c7f6f',
    fontSize: '14px',
  },
  formSubtitleCompact: {
    marginTop: '6px',
    fontSize: '13px',
  },
  tabs: {
    marginTop: '2px',
  },
  tabsCompact: {
    marginTop: 0,
  },
  inputIcon: {
    color: '#7b9274',
  },
  input: {
    borderRadius: '11px',
  },
  inputSmallMobile: {
    borderRadius: '10px',
  },
  submitBtn: {
    height: '44px',
    borderRadius: '12px',
    fontWeight: 700,
  },
  submitBtnSmallMobile: {
    height: '42px',
    borderRadius: '10px',
  },
  footer: {
    marginTop: '8px',
    paddingTop: '10px',
    borderTop: '1px dashed #dbe7d3',
    color: '#7a8f7b',
    fontSize: '12px',
    textAlign: 'center',
  },
  footerCompact: {
    fontSize: '11px',
  },
};

export default AuthPage;
