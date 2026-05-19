import { useState } from 'react';
import { Button, Card, Form, Input, message, Modal, Tabs, Typography } from 'antd';
import { LockOutlined, LoginOutlined, UserAddOutlined, UserOutlined } from '@ant-design/icons';
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

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const account = await localFileStorage.validateLogin(values.username, values.password);
      if (!account) {
        message.error('用户名或密码错误');
        return;
      }
      message.success('登录成功');
      onLogin(account);
      loginForm.resetFields();
    } catch (error: any) {
      message.error(error?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: {
    username: string;
    password: string;
    confirmPassword: string;
  }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await localFileStorage.registerAccount(values.username, values.password);
      message.success('注册成功，请登录');
      registerForm.resetFields();
      setActiveTab('login');
    } catch (error: any) {
      message.error(error?.message || '注册失败');
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
      destroyOnClose
    >
      <Card style={{ border: 'none', boxShadow: 'none' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ marginBottom: 6 }}>
            云桥
          </Title>
          <Text type="secondary">请登录或注册账户</Text>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
          <Tabs.TabPane
            tab={
              <span>
                <LoginOutlined /> 登录
              </span>
            }
            key="login"
          >
            <Form form={loginForm} layout="vertical" onFinish={handleLogin}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                登录
              </Button>
            </Form>
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <span>
                <UserAddOutlined /> 注册
              </span>
            }
            key="register"
          >
            <Form form={registerForm} layout="vertical" onFinish={handleRegister}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少 3 位' },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少 6 位' },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="确认密码"
                rules={[{ required: true, message: '请再次输入密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                注册
              </Button>
            </Form>
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </Modal>
  );
}

export default LoginModal;
