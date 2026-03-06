import { useState } from 'react';
import { Modal, Form, Input, Button, Tabs, message, Card, Space, Typography } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { localFileStorage } from '../services/localFileStorage';
import type { Account } from '../services/localFileStorage';

const { Title, Text } = Typography;

interface LoginModalProps {
  visible: boolean;
  onLogin: (account: Account) => void;
  onCancel: () => void;
}

function LoginModal({ visible, onLogin, onCancel }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  // 处理登录
  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const account = await localFileStorage.validateLogin(values.username, values.password);
      if (account) {
        message.success('登录成功');
        onLogin(account);
        loginForm.resetFields();
      } else {
        message.error('用户名或密码错误');
      }
    } catch (error: any) {
      message.error(`登录失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 处理注册
  const handleRegister = async (values: { username: string; password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await localFileStorage.registerAccount(values.username, values.password);
      message.success('注册成功，请登录');
      setActiveTab('login');
      registerForm.resetFields();
    } catch (error: any) {
      message.error(`注册失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={420}
      closable={false}
      maskClosable={false}
    >
      <Card style={{ border: 'none' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, color: '#4A90E2' }}>
            金蝶数据传输平台
          </Title>
          <Text type="secondary">请登录或注册账户</Text>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
          <Tabs.TabPane
            tab={
              <Space>
                <LoginOutlined />
                登录
              </Space>
            }
            key="login"
          >
            <Form
              form={loginForm}
              onFinish={handleLogin}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="用户名"
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  style={{ background: '#4A90E2' }}
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <Space>
                <UserAddOutlined />
                注册
              </Space>
            }
            key="register"
          >
            <Form
              form={registerForm}
              onFinish={handleRegister}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="用户名"
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                rules={[{ required: true, message: '请确认密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="确认密码"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  style={{ background: '#F5A623' }}
                >
                  注册
                </Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
        </Tabs>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            数据存储在本地浏览器，请定期导出备份
          </Text>
        </div>
      </Card>
    </Modal>
  );
}

export default LoginModal;
