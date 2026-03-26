import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, LockOutlined, PlusOutlined, UnlockOutlined } from '@ant-design/icons';
import { accountManagementApi } from '../services/accountManagementService';
import type { EnterpriseAccount } from '../services/accountManagementService';

interface AccountManagementProps {
  visible: boolean;
  onClose: () => void;
}

type FormValues = {
  username: string;
  password?: string;
  role: EnterpriseAccount['role'];
  email?: string;
  phone?: string;
  department?: string;
};

const roleText: Record<EnterpriseAccount['role'], string> = {
  admin: '管理员',
  operator: '操作员',
  viewer: '查看员',
};

const roleColor: Record<EnterpriseAccount['role'], string> = {
  admin: 'red',
  operator: 'blue',
  viewer: 'default',
};

function AccountManagement({ visible, onClose }: AccountManagementProps) {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<EnterpriseAccount[]>([]);
  const [editingAccount, setEditingAccount] = useState<EnterpriseAccount | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await accountManagementApi.getAccounts();
      setAccounts(Array.isArray(res?.accounts) ? res.accounts : []);
    } catch (error: any) {
      message.error(error?.message || '加载账户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadAccounts();
    }
  }, [visible]);

  const closeModal = () => {
    setModalOpen(false);
    setEditingAccount(null);
    form.resetFields();
  };

  const openCreate = () => {
    setEditingAccount(null);
    form.setFieldsValue({ role: 'operator' });
    setModalOpen(true);
  };

  const openEdit = (record: EnterpriseAccount) => {
    setEditingAccount(record);
    form.setFieldsValue({
      username: record.username,
      role: record.role,
      email: record.email,
      phone: record.phone,
      department: record.department,
    });
    setModalOpen(true);
  };

  const onSave = async (values: FormValues) => {
    try {
      if (editingAccount) {
        const { password: _password, username: _username, ...updatePayload } = values;
        await accountManagementApi.updateAccount(editingAccount.id, updatePayload);
        message.success('账户更新成功');
      } else {
        await accountManagementApi.createAccount({
          username: values.username,
          password: values.password || '',
          role: values.role,
          email: values.email,
          phone: values.phone,
          department: values.department,
        });
        message.success('账户创建成功');
      }
      closeModal();
      loadAccounts();
    } catch (error: any) {
      message.error(error?.message || '保存失败');
    }
  };

  const onDelete = async (id: string) => {
    try {
      await accountManagementApi.deleteAccount(id);
      message.success('账户删除成功');
      loadAccounts();
    } catch (error: any) {
      message.error(error?.message || '删除失败');
    }
  };

  const onToggleLock = async (record: EnterpriseAccount) => {
    try {
      const lock = record.status !== 'locked';
      await accountManagementApi.toggleAccountLock(record.id, lock);
      message.success(lock ? '账户已锁定' : '账户已解锁');
      loadAccounts();
    } catch (error: any) {
      message.error(error?.message || '操作失败');
    }
  };

  const columns: ColumnsType<EnterpriseAccount> = useMemo(
    () => [
      {
        title: '用户名',
        dataIndex: 'username',
        width: 160,
      },
      {
        title: '角色',
        dataIndex: 'role',
        width: 120,
        render: (value: EnterpriseAccount['role']) => <Tag color={roleColor[value]}>{roleText[value]}</Tag>,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 120,
        render: (value: EnterpriseAccount['status']) => {
          if (value === 'locked') return <Tag color="red">锁定</Tag>;
          if (value === 'inactive') return <Tag color="default">停用</Tag>;
          return <Tag color="green">正常</Tag>;
        },
      },
      {
        title: '邮箱',
        dataIndex: 'email',
        ellipsis: true,
      },
      {
        title: '最后登录',
        dataIndex: 'lastLoginAt',
        width: 200,
        render: (value?: string) => (value ? new Date(value).toLocaleString('zh-CN') : '从未登录'),
      },
      {
        title: '操作',
        key: 'actions',
        width: 220,
        render: (_value, record) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
              编辑
            </Button>
            <Button
              size="small"
              icon={record.status === 'locked' ? <UnlockOutlined /> : <LockOutlined />}
              onClick={() => onToggleLock(record)}
            >
              {record.status === 'locked' ? '解锁' : '锁定'}
            </Button>
            <Popconfirm
              title="确定删除该账户吗？"
              okText="删除"
              cancelText="取消"
              onConfirm={() => onDelete(record.id)}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    []
  );

  return (
    <>
      <Modal
        title="企业账户管理"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={1100}
        destroyOnClose
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建账户
          </Button>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={accounts}
          columns={columns}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 980 }}
        />
      </Modal>

      <Modal
        title={editingAccount ? '编辑账户' : '新建账户'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form<FormValues> form={form} layout="vertical" onFinish={onSave}>
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少 3 位' },
            ]}
          >
            <Input disabled={Boolean(editingAccount)} />
          </Form.Item>

          {!editingAccount && (
            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少 6 位' },
              ]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select
              options={[
                { label: '管理员', value: 'admin' },
                { label: '操作员', value: 'operator' },
                { label: '查看员', value: 'viewer' },
              ]}
            />
          </Form.Item>

          <Form.Item label="邮箱" name="email">
            <Input />
          </Form.Item>

          <Form.Item label="手机号" name="phone">
            <Input />
          </Form.Item>

          <Form.Item label="部门" name="department">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default AccountManagement;
