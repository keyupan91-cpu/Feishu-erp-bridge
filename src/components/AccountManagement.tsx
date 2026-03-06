import React, { useState, useEffect } from 'react';
import {
  Table, Button, Card, Modal, Form, Input, Select, Tag, Space,
  message, Popconfirm, Tabs, List, Typography, Row, Col, Statistic,
  Badge, Drawer
} from 'antd';
import {
  UserAddOutlined, EditOutlined, DeleteOutlined, LockOutlined,
  UnlockOutlined, UserOutlined, MailOutlined, PhoneOutlined, TeamOutlined,
  SecurityScanOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ClockCircleOutlined, FileTextOutlined, HistoryOutlined
} from '@ant-design/icons';
import { accountManagementApi } from '../services/accountManagementService';
import type { EnterpriseAccount, OperationLog, LoginHistory } from '../services/accountManagementService';

const { Title } = Typography;
const { TabPane } = Tabs;

interface AccountManagementProps {
  visible: boolean;
  onClose: () => void;
}

const AccountManagement: React.FC<AccountManagementProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState('accounts');
  const [accounts, setAccounts] = useState<EnterpriseAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EnterpriseAccount | null>(null);
  const [form] = Form.useForm();
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<EnterpriseAccount | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // 加载账户列表
  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await accountManagementApi.getAccounts();
      setAccounts(data.accounts || []);
    } catch (error: any) {
      message.error(`加载账户列表失败：${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && activeTab === 'accounts') {
      loadAccounts();
    }
  }, [visible, activeTab]);

  // 处理创建/编辑账户
  const handleSave = async (values: any) => {
    try {
      if (editingAccount) {
        await accountManagementApi.updateAccount(editingAccount.id, values);
        message.success('账户更新成功');
      } else {
        await accountManagementApi.createAccount(values);
        message.success('账户创建成功');
      }
      setIsModalOpen(false);
      form.resetFields();
      loadAccounts();
    } catch (error: any) {
      message.error(`保存失败：${error.message}`);
    }
  };

  // 处理删除账户
  const handleDelete = async (accountId: string) => {
    try {
      await accountManagementApi.deleteAccount(accountId);
      message.success('账户删除成功');
      loadAccounts();
    } catch (error: any) {
      message.error(`删除失败：${error.message}`);
    }
  };

  // 处理锁定/解锁账户
  const handleToggleLock = async (accountId: string, lock: boolean) => {
    try {
      await accountManagementApi.toggleAccountLock(accountId, lock);
      message.success(lock ? '账户已锁定' : '账户已解锁');
      loadAccounts();
    } catch (error: any) {
      message.error(`操作失败：${error.message}`);
    }
  };

  // 打开编辑弹窗
  const openEditModal = (account: EnterpriseAccount) => {
    setEditingAccount(account);
    form.setFieldsValue(account);
    setIsModalOpen(true);
  };

  // 打开详情抽屉
  const openDetailDrawer = (account: EnterpriseAccount) => {
    setSelectedAccount(account);
    setDrawerVisible(true);
    loadAccountLogs(account.id);
    loadAccountLoginHistory(account.id);
  };

  // 加载账户操作日志
  const loadAccountLogs = async (accountId: string) => {
    try {
      const data = await accountManagementApi.getOperationLogs(accountId);
      setOperationLogs(data.logs || []);
    } catch (error) {
      // 忽略错误
    }
  };

  // 加载账户登录历史
  const loadAccountLoginHistory = async (accountId: string) => {
    try {
      const data = await accountManagementApi.getLoginHistory(accountId);
      setLoginHistory(data.history || []);
    } catch (error) {
      // 忽略错误
    }
  };

  // 状态标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'locked': return 'error';
      default: return 'default';
    }
  };

  // 角色标签颜色
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red';
      case 'operator': return 'blue';
      case 'viewer': return 'green';
      default: return 'default';
    }
  };

  // 账户表格列
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (text: string) => text || '-',
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      render: (text: string) => text || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>{role === 'admin' ? '管理员' : role === 'operator' ? '操作员' : '查看者'}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={status === 'active' ? <CheckCircleOutlined /> : status === 'locked' ? <CloseCircleOutlined /> : <ClockCircleOutlined />}>
          {status === 'active' ? '正常' : status === 'locked' ? '锁定' : '停用'}
        </Tag>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (text: string) => text ? new Date(text).toLocaleString('zh-CN') : '从未登录',
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: any, record: EnterpriseAccount) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            onClick={() => openDetailDrawer(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={record.status === 'locked' ? <UnlockOutlined /> : <LockOutlined />}
            onClick={() => handleToggleLock(record.id, record.status !== 'locked')}
          >
            {record.status === 'locked' ? '解锁' : '锁定'}
          </Button>
          <Popconfirm
            title="确定要删除此账户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <SecurityScanOutlined />
          <span>企业级账户管理</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      centered
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <Space>
              <UserOutlined />
              账户列表
            </Space>
          }
          key="accounts"
        >
          <Card style={{ marginTop: 16 }} bodyStyle={{ padding: 0 }}>
            <div style={{ padding: 16, background: '#fafafa', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Title level={5} style={{ margin: 0 }}>账户管理</Title>
                <Tag color="blue">共 {accounts.length} 个账户</Tag>
              </Space>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => {
                  setEditingAccount(null);
                  form.resetFields();
                  setIsModalOpen(true);
                }}
              >
                新建账户
              </Button>
            </div>
            <Table
              columns={columns}
              dataSource={accounts}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <FileTextOutlined />
              操作日志
            </Space>
          }
          key="logs"
        >
          <Card style={{ marginTop: 16 }}>
            <List
              itemLayout="horizontal"
              dataSource={operationLogs.slice(0, 20)}
              renderItem={(item: OperationLog) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color="blue">{item.action}</Tag>
                        <span>{item.username}</span>
                        <span style={{ color: '#999' }}>{item.module}</span>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <span>{item.details}</span>
                        <span style={{ color: '#999', fontSize: 12 }}>
                          {new Date(item.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <HistoryOutlined />
              登录历史
            </Space>
          }
          key="history"
        >
          <Card style={{ marginTop: 16 }}>
            <List
              itemLayout="horizontal"
              dataSource={loginHistory.slice(0, 20)}
              renderItem={(item: LoginHistory) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Badge status={item.status === 'success' ? 'success' : 'error'} />
                        <Tag color={item.status === 'success' ? 'green' : 'red'}>
                          {item.status === 'success' ? '登录成功' : '登录失败'}
                        </Tag>
                        <span>{item.username}</span>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <span>登录时间：{new Date(item.loginTime).toLocaleString('zh-CN')}</span>
                          {item.logoutTime && <span> | 登出时间：{new Date(item.logoutTime).toLocaleString('zh-CN')}</span>}
                          {item.ipAddress && <span> | IP: {item.ipAddress}</span>}
                        </Space>
                        {item.failReason && (
                          <span style={{ color: '#ff4d4f', fontSize: 12 }}>失败原因：{item.failReason}</span>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 创建/编辑账户弹窗 */}
      <Modal
        title={editingAccount ? '编辑账户' : '新建账户'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingAccount(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{ role: 'operator', status: 'active' }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少 3 个字符' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>

          {!editingAccount && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少 6 个字符' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
            </Form.Item>
          )}

          <Form.Item name="email" label="邮箱">
            <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item name="phone" label="手机号">
            <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item name="department" label="部门">
            <Input prefix={<TeamOutlined />} placeholder="请输入部门" />
          </Form.Item>

          <Form.Item name="role" label="角色">
            <Select>
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="operator">操作员</Select.Option>
              <Select.Option value="viewer">查看者</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 账户详情抽屉 */}
      <Drawer
        title={
          <Space>
            <UserOutlined />
            {selectedAccount?.username} - 账户详情
          </Space>
        }
        placement="right"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedAccount && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card title="基本信息" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="用户名" value={selectedAccount.username} />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="状态"
                    value={selectedAccount.status === 'active' ? '正常' : selectedAccount.status === 'locked' ? '锁定' : '停用'}
                  />
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Statistic title="角色" value={selectedAccount.role} />
                </Col>
                <Col span={12}>
                  <Statistic title="部门" value={selectedAccount.department || '-'} />
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={24}>
                  <Statistic title="邮箱" value={selectedAccount.email || '-'} />
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={24}>
                  <Statistic title="创建时间" value={new Date(selectedAccount.createdAt).toLocaleString('zh-CN')} />
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={24}>
                  <Statistic title="最后登录" value={selectedAccount.lastLoginAt ? new Date(selectedAccount.lastLoginAt).toLocaleString('zh-CN') : '从未登录'} />
                </Col>
              </Row>
            </Card>

            <Card title="操作日志" size="small" bodyStyle={{ maxHeight: 300, overflow: 'auto' }}>
              <List
                size="small"
                dataSource={operationLogs.slice(0, 10)}
                renderItem={(item: OperationLog) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Space><Tag>{item.action}</Tag><span>{item.details}</span></Space>}
                      description={new Date(item.createdAt).toLocaleString('zh-CN')}
                    />
                  </List.Item>
                )}
              />
            </Card>

            <Card title="登录历史" size="small" bodyStyle={{ maxHeight: 300, overflow: 'auto' }}>
              <List
                size="small"
                dataSource={loginHistory.slice(0, 10)}
                renderItem={(item: LoginHistory) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Badge status={item.status === 'success' ? 'success' : 'error'} />
                          <span>{new Date(item.loginTime).toLocaleString('zh-CN')}</span>
                        </Space>
                      }
                      description={item.ipAddress ? `IP: ${item.ipAddress}` : ''}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Space>
        )}
      </Drawer>
    </Modal>
  );
};

export default AccountManagement;
