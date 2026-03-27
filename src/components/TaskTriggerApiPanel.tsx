import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { ApiOutlined, CopyOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import type { TaskConfig } from '../types';

const { Text, Paragraph } = Typography;

interface TaskTriggerApiPanelProps {
  tasks: TaskConfig[];
  onGenerate: (taskId: string, regenerate?: boolean) => Promise<void>;
  onToggle: (taskId: string, enabled: boolean) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

function getApiUrl(token: string): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api/public/task-trigger/${token}`;
  }
  return `/api/public/task-trigger/${token}`;
}

export default function TaskTriggerApiPanel({
  tasks,
  onGenerate,
  onToggle,
  onDelete,
}: TaskTriggerApiPanelProps) {
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [previewTask, setPreviewTask] = useState<TaskConfig | null>(null);

  const sortedTasks = useMemo(() => [...tasks], [tasks]);

  const copyText = async (text: string, successMsg: string) => {
    if (!text) {
      message.warning('暂无可复制内容');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      message.success(successMsg);
    } catch {
      message.error('复制失败，请手动复制');
    }
  };

  const runWithTaskLoading = async (taskId: string, action: () => Promise<void>) => {
    setLoadingTaskId(taskId);
    try {
      await action();
    } finally {
      setLoadingTaskId(null);
    }
  };

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (_: string, record: TaskConfig) => (
        <div>
          <Text strong>{record.name}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.enabled ? '任务已启用' : '任务未启用'}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'API 状态',
      key: 'apiStatus',
      width: 130,
      render: (_: unknown, record: TaskConfig) => {
        if (!record.triggerApi?.token) {
          return <Tag>未配置</Tag>;
        }
        return record.triggerApi.enabled ? <Tag color="success">已启用</Tag> : <Tag color="warning">已禁用</Tag>;
      },
    },
    {
      title: '触发地址',
      key: 'apiUrl',
      render: (_: unknown, record: TaskConfig) => {
        if (!record.triggerApi?.token) {
          return <Text type="secondary">尚未生成</Text>;
        }

        const url = getApiUrl(record.triggerApi.token);
        return (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <Paragraph
              copyable={false}
              ellipsis={{ rows: 1, tooltip: url }}
              style={{ marginBottom: 0, fontFamily: 'Consolas, Menlo, monospace', fontSize: 12 }}
            >
              {url}
            </Paragraph>
            <Text type="secondary" style={{ fontSize: 12 }}>
              推荐使用 POST 调用，返回 instanceId
            </Text>
          </Space>
        );
      },
    },
    {
      title: '启用',
      key: 'enabled',
      width: 110,
      align: 'center' as const,
      render: (_: unknown, record: TaskConfig) => (
        <Switch
          checked={!!record.triggerApi?.enabled}
          disabled={!record.triggerApi?.token || loadingTaskId === record.id}
          onChange={(checked) => runWithTaskLoading(record.id, () => onToggle(record.id, checked))}
          checkedChildren="开"
          unCheckedChildren="关"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 360,
      render: (_: unknown, record: TaskConfig) => {
        const hasConfig = !!record.triggerApi?.token;
        const apiUrl = hasConfig ? getApiUrl(record.triggerApi!.token) : '';
        const curlCommand = hasConfig
          ? `curl -X POST "${apiUrl}" -H "Content-Type: application/json" -d "{}"`
          : '';

        return (
          <Space wrap>
            {!hasConfig ? (
              <Button
                type="primary"
                icon={<ApiOutlined />}
                loading={loadingTaskId === record.id}
                onClick={() => runWithTaskLoading(record.id, () => onGenerate(record.id, false))}
              >
                生成 API
              </Button>
            ) : (
              <>
                <Tooltip title="复制触发地址">
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => copyText(apiUrl, '触发地址已复制')}
                  >
                    复制地址
                  </Button>
                </Tooltip>
                <Tooltip title="复制 cURL 示例">
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => copyText(curlCommand, 'cURL 示例已复制')}
                  >
                    复制示例
                  </Button>
                </Tooltip>
                <Button onClick={() => setPreviewTask(record)}>查看</Button>
                <Tooltip title="重新生成 token（旧地址将失效）">
                  <Button
                    icon={<ReloadOutlined />}
                    loading={loadingTaskId === record.id}
                    onClick={() => runWithTaskLoading(record.id, () => onGenerate(record.id, true))}
                  >
                    重新生成
                  </Button>
                </Tooltip>
                <Popconfirm
                  title="删除触发 API"
                  description="删除后该任务的触发地址会立即失效。"
                  onConfirm={() => runWithTaskLoading(record.id, () => onDelete(record.id))}
                  okText="删除"
                  cancelText="取消"
                >
                  <Button danger icon={<DeleteOutlined />} loading={loadingTaskId === record.id}>
                    删除
                  </Button>
                </Popconfirm>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Card className="custom-card">
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 16 }}>
            任务触发 API
          </Text>
          <div>
            <Text type="secondary">
              为任务生成独立 HTTP 地址，外部系统调用后可直接启动任务执行（等价于点击“执行”）。
            </Text>
          </div>
        </div>

        <Alert
          showIcon
          type="info"
          style={{ marginBottom: 16 }}
          message="调用说明"
          description={
            <div>
              <div>1. 任务需处于“启用”状态，且 API 状态为“已启用”。</div>
              <div>2. 支持 GET/POST 调用，推荐使用 POST。</div>
              <div>3. 请妥善保管 URL 中的 token，避免泄露。</div>
            </div>
          }
        />

        {sortedTasks.length === 0 ? (
          <Empty description="暂无任务，先去任务管理创建任务" />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={sortedTasks}
            pagination={{ pageSize: 8 }}
            tableLayout="fixed"
            scroll={{ x: 1250 }}
          />
        )}
      </Card>

      <Modal
        title="触发 API 详情"
        open={!!previewTask}
        onCancel={() => setPreviewTask(null)}
        footer={[
          <Button key="close" onClick={() => setPreviewTask(null)}>
            关闭
          </Button>,
        ]}
        width={840}
      >
        {previewTask?.triggerApi?.token ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Text type="secondary">任务：</Text>
              <Text strong>{previewTask.name}</Text>
            </div>
            <div>
              <Text type="secondary">状态：</Text>
              {previewTask.triggerApi.enabled ? <Tag color="success">已启用</Tag> : <Tag color="warning">已禁用</Tag>}
            </div>
            <div>
              <Text type="secondary">触发地址：</Text>
              <Paragraph style={{ marginTop: 8, marginBottom: 0, fontFamily: 'Consolas, Menlo, monospace' }}>
                {getApiUrl(previewTask.triggerApi.token)}
              </Paragraph>
            </div>
            <div>
              <Text type="secondary">POST 示例：</Text>
              <Paragraph
                style={{ marginTop: 8, marginBottom: 0, fontFamily: 'Consolas, Menlo, monospace' }}
                copyable
              >
                {`curl -X POST "${getApiUrl(previewTask.triggerApi.token)}" -H "Content-Type: application/json" -d "{}"`}
              </Paragraph>
            </div>
            <div>
              <Text type="secondary">GET 示例：</Text>
              <Paragraph
                style={{ marginTop: 8, marginBottom: 0, fontFamily: 'Consolas, Menlo, monospace' }}
                copyable
              >
                {`curl "${getApiUrl(previewTask.triggerApi.token)}"`}
              </Paragraph>
            </div>
          </Space>
        ) : null}
      </Modal>
    </>
  );
}
