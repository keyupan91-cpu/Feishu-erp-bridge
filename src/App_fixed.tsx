import { useState } from 'react';
import {
  Tabs,
  Button,
  Modal,
  Input,
  message,
  Table,
  Popconfirm,
  Switch,
  Progress,
  Tag,
  List,
  Typography,
  Badge,
  Tooltip,
  Space,
  Card,
  Row,
  Col,
  Empty,
  Steps,
  Select,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  CopyOutlined,
  DeleteOutlined,
  SettingOutlined,
  StopOutlined,
  UnorderedListOutlined,
  HistoryOutlined,
  ClearOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ApiOutlined,
  CloudSyncOutlined,
  LoginOutlined,
  FileSyncOutlined,
  ThunderboltOutlined,
  ArrowLeftOutlined,
  ExportOutlined,
  ImportOutlined,
  LogoutOutlined,
  UserOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { TaskStatus } from './types';
import type { TaskConfig, TaskInstance } from './types';
import TaskConfigComponent from './components/TaskConfig';
import WebAPIDebugger from './components/WebAPIDebugger';
import AuthPage from './components/AuthPage';
// MobileLayout 组件已导入，用于移动端适配
import { useAccountStore } from './stores/accountStore';
import FeishuService from './services/feishuService';
import KingdeeService from './services/kingdeeService';
import { executeTask, stopTaskExecution } from './services/taskExecutor';
import './theme.css';

const { Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

function App() {

  // 登录状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 从 store 获取状态和操作
  const {
    currentAccount,
    tasks,
    taskInstances,
    logout,
    exportToFile,
    importFromFile,
    addTask,
    updateTask,
    deleteTask,
    copyTask,
    toggleTask,
    deleteTaskInstance,
    startTask,
    stopTask,
  } = useAccountStore();

  // 本地状态
  const [activeTab, setActiveTab] = useState('tasks');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskConfig | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskConfig | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<TaskInstance | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [testTaskId, setTestTaskId] = useState<string>('');
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testModalType, setTestModalType] = useState<'feishu' | 'kingdee' | 'sync'>('feishu');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [showWebApiLogs, setShowWebApiLogs] = useState(false);
  const [selectedWebApiLog, setSelectedWebApiLog] = useState<any>(null);
  const [testSectionCollapsed, setTestSectionCollapsed] = useState(true); // 连接测试区域折叠状态

  // 处理登录成功
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    const account = useAccountStore.getState().currentAccount;
    message.success(`欢迎回来，${account?.username}`);
    console.log('登录成功，当前账户:', account);
  };

  // 处理登出
  const handleLogout = () => {
    Modal.confirm({
      title: '确认登出',
      content: '登出后将无法查看当前账户的数据，是否继续？',
      onOk: () => {
        logout();
        setIsAuthenticated(false);
        message.info('已登出');
      },
    });
  };

  // 处理导出
  const handleExport = async () => {
    try {
      await exportToFile();
      message.success('数据导出成功');
    } catch (error: any) {
      message.error(`导出失败: ${error.message}`);
    }
  };

  // 处理导入
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          await importFromFile(file);
          message.success('数据导入成功');
        } catch (error: any) {
          message.error(`导入失败: ${error.message}`);
        }
      }
    };
    input.click();
  };

  // 处理保存任务
  const handleSaveTask = async () => {
    if (!formData.name.trim()) {
      message.error('请输入任务名称');
      return;
    }

    if (editingTask) {
      await updateTask(editingTask.id, {
        name: formData.name,
        description: formData.description,
      });
      message.success('任务更新成功');
    } else {
      await addTask({
        name: formData.name,
        description: formData.description,
        enabled: false,
        feishuConfig: {
          appToken: '',
          tableId: '',
          viewId: '',
          fieldParams: [],
          filterConditions: [],
          writeBackFields: [],
          appId: '',
          appSecret: '',
        },
        kingdeeConfig: {
          loginParams: {
            baseUrl: '',
            username: '',
            password: '',
            appId: '',
            appSecret: '',
            dbId: '',
          },
          formId: '',
          dataTemplate: '',
        },
      });
      message.success('任务创建成功');
    }

    setIsModalOpen(false);
    setFormData({ name: '', description: '' });
    setEditingTask(null);
  };

  // 处理编辑任务
  const handleEditTask = (task: TaskConfig) => {
    setEditingTask(task);
    setFormData({ name: task.name, description: task.description });
    setIsModalOpen(true);
  };

  // 处理配置任务
  const handleConfigTask = (task: TaskConfig) => {
    setSelectedTask(task);
    setIsConfigModalOpen(true);
  };

  // 处理保存配置
  const handleSaveConfig = async (config: Partial<TaskConfig>) => {
    if (selectedTask) {
      await updateTask(selectedTask.id, config);
      message.success('配置保存成功');
    }
  };

  // 处理开始任务
  const handleStartTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (!task.feishuConfig.tableId) {
      message.error('请先配置飞书表格ID');
      return;
    }

    if (!task.kingdeeConfig.formId) {
      message.error('请先配置金蝶表单ID');
      return;
    }

    try {
      // 创建任务实例
      const instance = await startTask(taskId);
      message.success('任务已开始执行');

      // 异步执行任务
      executeTask(task, instance).catch((error) => {
        console.error('任务执行失败:', error);
        message.error(`任务执行失败: ${error.message}`);
      });
    } catch (error: any) {
      message.error(`启动任务失败: ${error.message}`);
    }
  };

  // 处理停止任务
  const handleStopTask = async (instanceId: string) => {
    const stopped = stopTaskExecution(instanceId);
    if (stopped) {
      await stopTask(instanceId);
      message.success('任务已停止');
    } else {
      message.warning('任务未在运行或已停止');
    }
  };

  // 处理查看实例详情
  const handleViewInstance = (instance: TaskInstance) => {
    setSelectedInstance(instance);
  };

  // 处理清空执行记录
  const handleClearInstances = () => {
    Modal.confirm({
      title: '清空执行记录',
      content: '确定要清空所有执行记录吗？',
      onOk: async () => {
        for (const instance of taskInstances) {
          await deleteTaskInstance(instance.id);
        }
        message.success('执行记录已清空');
      },
    });
  };

  // 打开测试弹窗
  const openTestModal = (type: 'feishu' | 'kingdee' | 'sync') => {
    if (tasks.length === 0) {
      message.warning('请先创建任务');
      return;
    }
    setTestModalType(type);
    setTestTaskId(tasks[0]?.id || '');
    setTestResult(null);
    setTestModalOpen(true);
  };

  // 执行测试
  const executeTest = async () => {
    const task = tasks.find((t) => t.id === testTaskId);
    if (!task) {
      message.error('请选择一个任务');
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      if (testModalType === 'feishu') {
        if (!task.feishuConfig.appId || !task.feishuConfig.appSecret) {
          throw new Error('请先在任务配置中填写飞书AppID和AppSecret');
        }
        const feishuService = new FeishuService(task.feishuConfig);
        const token = await feishuService.getToken();
        setTestResult({
          success: true,
          type: 'feishu',
          title: '飞书登录测试成功',
          details: {
            '应用ID': task.feishuConfig.appId,
            '应用Token': task.feishuConfig.appToken,
            '访问令牌': token.slice(0, 20) + '...',
          },
        });
      } else if (testModalType === 'kingdee') {
        if (!task.kingdeeConfig.loginParams.username || !task.kingdeeConfig.loginParams.password) {
          throw new Error('请先在任务配置中填写金蝶用户名和密码');
        }
        const kingdeeService = new KingdeeService(task.kingdeeConfig);
        const result = await kingdeeService.testConnection();
        setTestResult({
          success: result.success,
          type: 'kingdee',
          title: result.success ? '金蝶登录测试成功' : '金蝶登录测试失败',
          message: result.message,
          details: {
            '服务器地址': task.kingdeeConfig.loginParams.baseUrl,
            '用户名': task.kingdeeConfig.loginParams.username,
            '账套ID': task.kingdeeConfig.loginParams.dbId || '-',
          },
        });
      } else if (testModalType === 'sync') {
        // 完整同步测试 - 只测试第一条记录
        if (!task.feishuConfig.tableId) {
          throw new Error('请先在任务配置中填写飞书表格ID');
        }
        if (!task.kingdeeConfig.formId) {
          throw new Error('请先在任务配置中填写金蝶表单ID');
        }

        const feishuService = new FeishuService(task.feishuConfig);
        await feishuService.getToken();

        // 获取第一条记录 - 不指定 field_names，让飞书返回所有字段用于筛选
        const tableData = await feishuService.getTableData(
          task.feishuConfig.tableId,
          task.feishuConfig.viewId,
          task.feishuConfig.filterConditions,
          []  // 不指定字段名，获取所有字段
        );

        if (!tableData.data?.items || tableData.data.items.length === 0) {
          throw new Error('飞书表格中没有符合条件的记录');
        }

        const firstRecord = tableData.data.items[0];
        const recordId = firstRecord.record_id;
        const fields = firstRecord.fields || {};

        // 提取飞书字段的实际值（处理复杂类型）
        const extractFeishuFieldValue = (fieldValue: any): any => {
          if (fieldValue === null || fieldValue === undefined) return '';
          if (typeof fieldValue === 'number' || typeof fieldValue === 'string' || typeof fieldValue === 'boolean') return fieldValue;
          if (Array.isArray(fieldValue)) {
            return fieldValue.map(item => {
              if (typeof item === 'object' && item.text) return item.text;
              return String(item);
            }).join('');
          }
          if (typeof fieldValue === 'object') {
            if (fieldValue.value && Array.isArray(fieldValue.value)) return fieldValue.value[0];
            if (fieldValue.text) return fieldValue.text;
            if (fieldValue.value !== undefined) return fieldValue.value;
            return JSON.stringify(fieldValue);
          }
          return fieldValue;
        };

        // 格式化数据
        const formattedData: Record<string, any> = {};
        task.feishuConfig.fieldParams.forEach(param => {
          const rawFieldValue = fields[param.fieldName];
          const fieldValue = extractFeishuFieldValue(rawFieldValue);
          if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
            if (param.decimalPlaces !== undefined && typeof fieldValue === 'number') {
              formattedData[param.variableName] = Number(fieldValue.toFixed(param.decimalPlaces));
            } else {
              formattedData[param.variableName] = fieldValue;
            }
          }
        });

        // 合并数据模板
        let finalData = formattedData;
        if (task.kingdeeConfig.dataTemplate) {
          try {
            const template = JSON.parse(task.kingdeeConfig.dataTemplate);
            finalData = { ...template, ...formattedData };
          } catch (e) {
            console.warn('数据模板解析失败');
          }
        }

        // 保存到金蝶
        const kingdeeService = new KingdeeService(task.kingdeeConfig);
        const saveResult = await kingdeeService.saveData(task.kingdeeConfig.formId, finalData);

        // 回写飞书状态（如果配置了回写字段）
        let writeBackResult = null;
        const writeBackFields = task.feishuConfig.writeBackFields || [];
        if (writeBackFields.length > 0) {
          const writeData: Record<string, any> = {};
          writeBackFields.forEach(field => {
            if (field.source === 'success') {
              writeData[field.fieldName] = '同步成功';
            } else if (field.source === 'error') {
              writeData[field.fieldName] = '';
            }
          });

          if (Object.keys(writeData).length > 0) {
            writeBackResult = await feishuService.writeBackData(
              task.feishuConfig.tableId,
              recordId,
              writeData
            );
          }
        }

        setTestResult({
          success: true,
          type: 'sync',
          title: '完整同步测试成功',
          message: '第一条记录已成功同步到金蝶并回写状态到飞书',
          details: {
            '飞书记录ID': recordId,
            '金蝶返回': JSON.stringify(saveResult).slice(0, 100) + '...',
            '回写结果': writeBackResult ? '成功' : '未配置回写字段',
            '同步数据': JSON.stringify(finalData).slice(0, 200) + '...',
          },
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        type: testModalType,
        title: '测试失败',
        message: error.message,
      });
    } finally {
      setTestLoading(false);
    }
  };

  // 任务管理表格列
  const taskColumns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: TaskConfig) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            background: record.enabled ? '#52C41A' : '#999',
            flexShrink: 0
          }} />
          <Text strong style={{ fontSize: 14 }}>{text}</Text>
        </div>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      render: (text: string) => (
        <Text type="secondary" style={{ fontSize: 13 }} ellipsis={{ tooltip: text }}>
          {text || '-'}
        </Text>
      ),
    },
    {
      title: '飞书配置',
      key: 'feishu',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: TaskConfig) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            background: record.feishuConfig.tableId ? '#1890ff' : '#d9d9d9',
            flexShrink: 0
          }} />
          <Text style={{ fontSize: 13, color: record.feishuConfig.tableId ? '#1890ff' : '#999' }}>
            {record.feishuConfig.tableId ? '已配置' : '未配置'}
          </Text>
        </div>
      ),
    },
    {
      title: '金蝶配置',
      key: 'kingdee',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: TaskConfig) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            background: record.kingdeeConfig.formId ? '#fa8c16' : '#d9d9d9',
            flexShrink: 0
          }} />
          <Text style={{ fontSize: 13, color: record.kingdeeConfig.formId ? '#fa8c16' : '#999' }}>
            {record.kingdeeConfig.formId ? '已配置' : '未配置'}
          </Text>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      align: 'center' as const,
      render: (enabled: boolean, record: TaskConfig) => (
        <Switch
          checked={enabled}
          onChange={() => toggleTask(record.id)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          size="small"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      align: 'center' as const,
      render: (_: any, record: TaskConfig) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button icon={<EditOutlined />} size="small" type="primary" ghost onClick={() => handleEditTask(record)} />
          </Tooltip>
          <Tooltip title="复制">
            <Button icon={<CopyOutlined />} size="small" onClick={() => copyTask(record.id, `${record.name} (副本)`)} />
          </Tooltip>
          <Tooltip title="配置">
            <Button icon={<SettingOutlined />} size="small" style={{ color: '#fa8c16', borderColor: '#fa8c16' }} ghost onClick={() => handleConfigTask(record)} />
          </Tooltip>
          <Popconfirm title="确定删除?" onConfirm={() => deleteTask(record.id)}>
            <Tooltip title="删除">
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Tooltip>
          </Popconfirm>
          {record.enabled && (
            <Tooltip title="执行">
              <Button icon={<ThunderboltOutlined />} size="small" type="primary" onClick={() => handleStartTask(record.id)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // 执行监控表格列
  const monitoringColumns = [
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 180,
      render: (text: string) => <Text strong style={{ fontSize: 14 }}>{text}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: TaskStatus) => {
        const statusConfig: Record<TaskStatus, { color: string; bg: string; text: string; icon: React.ReactNode }> = {
          [TaskStatus.IDLE]: { color: '#999', bg: '#f5f5f5', text: '空闲', icon: <Badge status="default" /> },
          [TaskStatus.RUNNING]: { color: '#1890ff', bg: '#E6F7FF', text: '运行中', icon: <Badge status="processing" /> },
          [TaskStatus.PAUSED]: { color: '#FAAD14', bg: '#FFF7E6', text: '暂停', icon: <Badge status="warning" /> },
          [TaskStatus.SUCCESS]: { color: '#52C41A', bg: '#F6FFED', text: '成功', icon: <Badge status="success" /> },
          [TaskStatus.ERROR]: { color: '#FF4D4F', bg: '#FFF1F0', text: '失败', icon: <Badge status="error" /> },
          [TaskStatus.WARNING]: { color: '#FAAD14', bg: '#FFF7E6', text: '警告', icon: <Badge status="warning" /> },
        };
        const config = statusConfig[status] || statusConfig[TaskStatus.IDLE];
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {config.icon}
            <span style={{ color: config.color, fontWeight: 500, fontSize: 13 }}>{config.text}</span>
          </div>
        );
      },
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 180,
      render: (progress: number, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress 
            percent={progress} 
            size="small" 
            status={record.instance.status === TaskStatus.ERROR ? 'exception' : 'active'}
            style={{ flex: 1 }}
          />
          <Text type="secondary" style={{ fontSize: 12, minWidth: 35 }}>{progress}%</Text>
        </div>
      ),
    },
    {
      title: '执行时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
      render: (startTime: string) => (
        <Text type="secondary" style={{ fontSize: 13 }}>{startTime ? new Date(startTime).toLocaleString() : '-'}</Text>
      ),
    },
    {
      title: '执行结果',
      key: 'result',
      width: 200,
      render: (_: any, record: any) => {
        const successCount = record.instance.successCount || 0;
        const errorCount = record.instance.errorCount || 0;
        const total = successCount + errorCount;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                background: '#F6FFED', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '2px solid #52C41A'
              }}>
                <CheckCircleOutlined style={{ color: '#52C41A', fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#52C41A' }}>{successCount}</div>
                <div style={{ fontSize: 11, color: '#999' }}>成功</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                background: '#FFF1F0', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '2px solid #FF4D4F'
              }}>
                <CloseCircleOutlined style={{ color: '#FF4D4F', fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#FF4D4F' }}>{errorCount}</div>
                <div style={{ fontSize: 11, color: '#999' }}>失败</div>
              </div>
            </div>
            {total > 0 && (
              <div style={{ marginLeft: 8, paddingLeft: 8, borderLeft: '1px solid #e8e8e8' }}>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: '#666' }}>{total}</div>
                <div style={{ fontSize: 11, color: '#999' }}>总计</div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: any) => {
        const instance = record.instance;
        const isFinished = instance.status === TaskStatus.SUCCESS || instance.status === TaskStatus.ERROR;
        return (
          <Space size="small">
            {instance.status === TaskStatus.RUNNING && (
              <Tooltip title="停止">
                <Button icon={<StopOutlined />} size="small" danger onClick={() => handleStopTask(instance.id)} />
              </Tooltip>
            )}
            <Tooltip title="查看详情">
              <Button icon={<EyeOutlined />} size="small" type="primary" ghost onClick={() => handleViewInstance(instance)} />
            </Tooltip>
            {isFinished && (
              <Popconfirm title="确定删除此执行记录?" onConfirm={() => deleteTaskInstance(instance.id)}>
                <Tooltip title="删除记录">
                  <Button icon={<DeleteOutlined />} size="small" danger />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  // 如果没有登录，显示登录页面
  if (!isAuthenticated) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* 头部 */}
      <div className="app-header">
        {/* 顶部艺术字区域 - 一行布局 */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          padding: '12px 0',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {/* 左侧：中台 + Youth Power */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              fontSize: 28,
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6347 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
              letterSpacing: '4px',
              fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
            }}>
              中台
            </div>
            <div style={{
              width: 1,
              height: 24,
              background: 'rgba(255,255,255,0.3)'
            }} />
            <div style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '3px',
              fontWeight: 400,
              textTransform: 'uppercase',
              fontFamily: '"Arial", sans-serif'
            }}>
              Youth Power
            </div>
          </div>
          
          {/* 中间：金蝶数据传输平台 */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 className="app-title" style={{ margin: 0, fontSize: 24 }}>金蝶数据传输平台</h1>
          </div>
          
          {/* 右侧：用户信息 */}
          <div style={{ minWidth: 120, textAlign: 'right' }}>
            <p className="app-subtitle" style={{ margin: 0 }}>
              <UserOutlined style={{ marginRight: 4 }} />
              {currentAccount ? `${currentAccount.username}` : '未登录'}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <Space wrap size="middle">
            <Button
              icon={<ExportOutlined />}
              onClick={handleExport}
              size="middle"
              style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
            >
              导出数据
            </Button>
            <Button
              icon={<ImportOutlined />}
              onClick={handleImport}
              size="middle"
              style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
            >
              导入数据
            </Button>
            <Button
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              type="primary"
              danger
              size="middle"
            >
              退出登录
            </Button>
          </Space>
        </div>
      </div>

      {/* 主内容区域 */}
      <div style={{ flex: 1, padding: '24px 40px', overflow: 'auto' }}>
      {/* 操作指引 */}
      {showGuide && currentAccount && (
        <Card className="guide-card animate-fade-in-up" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text strong style={{ fontSize: 16, color: '#F5A623' }}>
              <CloudSyncOutlined style={{ marginRight: 8 }} />
              操作指引
            </Text>
            <Button type="text" size="small" onClick={() => setShowGuide(false)}>
              隐藏
            </Button>
          </div>
          <Steps
            direction="horizontal"
            size="small"
            current={-1}
            items={[
              { title: '创建任务', description: '点击新建任务，输入任务名称', icon: <PlusOutlined /> },
              { title: '配置连接', description: '配置飞书和金蝶的连接信息', icon: <SettingOutlined /> },
              { title: '测试连接', description: '使用下方按钮测试连接', icon: <CloudSyncOutlined /> },
              { title: '启用执行', description: '启用任务并点击执行按钮', icon: <ThunderboltOutlined /> },
            ]}
          />
        </Card>
      )}

      {/* 概览看板 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card className="stat-card" bodyStyle={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 14 }}>总任务数</Text>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff', marginTop: 8 }}>{tasks.length}</div>
              </div>
              <div style={{ width: 48, height: 48, background: '#E6F7FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UnorderedListOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="stat-card" bodyStyle={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 14 }}>今日执行</Text>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#52c41a', marginTop: 8 }}>
                  {taskInstances.filter(i => i.startTime && new Date(i.startTime).toDateString() === new Date().toDateString()).length}
                </div>
              </div>
              <div style={{ width: 48, height: 48, background: '#F6FFED', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="stat-card" bodyStyle={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 14 }}>今日失败</Text>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#ff4d4f', marginTop: 8 }}>
                  {taskInstances.filter(i => 
                    i.startTime && 
                    new Date(i.startTime).toDateString() === new Date().toDateString() &&
                    i.status === TaskStatus.ERROR
                  ).length}
                </div>
              </div>
              <div style={{ width: 48, height: 48, background: '#FFF1F0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CloseCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 测试连接区域 - 可折叠 */}
      <Card 
        style={{ marginBottom: 24, borderRadius: 12 }}
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CloudSyncOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            <span style={{ fontWeight: 600 }}>连接测试</span>
            <Text type="secondary" style={{ marginLeft: 12, fontSize: 13 }}>
              配置完成后可在此测试连接
            </Text>
          </div>
        }
        extra={
          <Button 
            type="link" 
            onClick={() => setTestSectionCollapsed(!testSectionCollapsed)}
            icon={testSectionCollapsed ? <DownOutlined /> : <UpOutlined />}
          >
            {testSectionCollapsed ? '展开' : '收起'}
          </Button>
        }
      >
        {!testSectionCollapsed && (
        <div className="test-grid">
          <Card className="test-card" hoverable>
            <div className="test-card-title">
              <LoginOutlined style={{ color: '#4A90E2', marginRight: 8 }} />
              飞书登录测试
            </div>
            <div className="test-card-desc">测试飞书应用的登录授权是否成功，验证AppID和AppSecret</div>
            <Button type="primary" className="btn-primary" onClick={() => openTestModal('feishu')} block>
              开始测试
            </Button>
          </Card>

          <Card className="test-card" hoverable>
            <div className="test-card-title">
              <LoginOutlined style={{ color: '#F5A623', marginRight: 8 }} />
              金蝶登录测试
            </div>
            <div className="test-card-desc">测试金蝶系统的登录连接是否正常，验证用户名密码</div>
            <Button className="btn-accent" onClick={() => openTestModal('kingdee')} block>
              开始测试
            </Button>
          </Card>

          <Card className="test-card" hoverable>
            <div className="test-card-title">
              <FileSyncOutlined style={{ color: '#52C41A', marginRight: 8 }} />
              完整同步测试
            </div>
            <div className="test-card-desc">完整流程测试：查询飞书→导入金蝶→写回飞书（仅测试第一条记录）</div>
            <Button className="btn-secondary" onClick={() => openTestModal('sync')} block>
              开始测试
            </Button>
          </Card>
        </div>
        )}
      </Card>

      {/* 标签页 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="custom-tabs">
        <TabPane
          tab={<span><UnorderedListOutlined />任务管理</span>}
          key="tasks"
        >
          <Card className="custom-card">
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong style={{ fontSize: 16 }}>任务列表</Text>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingTask(null);
                  setFormData({ name: '', description: '' });
                  setIsModalOpen(true);
                }}
              >
                新建任务
              </Button>
            </div>
            <Table
              columns={taskColumns}
              dataSource={tasks.map((task) => ({ ...task, key: task.id }))}
              pagination={{ pageSize: 10 }}
              className="custom-table"
              scroll={{ x: 800 }}
              locale={{ emptyText: <Empty description="暂无任务，点击上方按钮创建新任务" /> }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={<span><HistoryOutlined />执行监控</span>}
          key="monitoring"
        >
          <Card className="custom-card">
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong style={{ fontSize: 16 }}>执行记录</Text>
              <Button icon={<ClearOutlined />} onClick={handleClearInstances} disabled={taskInstances.length === 0}>
                清空记录
              </Button>
            </div>
            <Table
              columns={monitoringColumns}
              dataSource={taskInstances.map((instance) => ({
                key: instance.id,
                taskName: tasks.find((t) => t.id === instance.taskId)?.name || 'Unknown',
                status: instance.status,
                progress: instance.progress,
                startTime: instance.startTime,
                instance,
              }))}
              pagination={{ pageSize: 10 }}
              className="custom-table"
              scroll={{ x: 900 }}
              locale={{ emptyText: <Empty description="暂无执行记录" /> }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={<span><ApiOutlined />WebAPI调试</span>}
          key="debugger"
        >
          <WebAPIDebugger />
        </TabPane>
      </Tabs>

      {/* 新建/编辑任务弹窗 */}
      <Modal
        title={editingTask ? '编辑任务' : '新建任务'}
        open={isModalOpen}
        onOk={handleSaveTask}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingTask(null);
          setFormData({ name: '', description: '' });
        }}
        okText="保存"
        cancelText="取消"
        className="custom-modal"
      >
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              任务名称 <span style={{ color: '#FF4D4F' }}>*</span>
            </label>
            <Input
              placeholder="请输入任务名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>任务描述</label>
            <TextArea
              placeholder="请输入任务描述（可选）"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      </Modal>

      {/* 任务配置弹窗 */}
      <Modal
        title="任务配置"
        open={isConfigModalOpen}
        onCancel={() => {
          setIsConfigModalOpen(false);
          setSelectedTask(null);
        }}
        footer={null}
        width={900}
        className="custom-modal"
      >
        {selectedTask && (
          <TaskConfigComponent
            task={selectedTask}
            onSave={handleSaveConfig}
            onTest={() => {}}
          />
        )}
      </Modal>

      {/* 任务执行详情弹窗 */}
      <Modal
        title="任务执行详情"
        open={!!selectedInstance}
        onCancel={() => setSelectedInstance(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedInstance(null)}>
            关闭
          </Button>,
        ]}
        width={800}
        className="custom-modal"
      >
        {selectedInstance && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#4A90E2' }}>
                      {selectedInstance.progress}%
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>执行进度</div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52C41A' }}>
                      {selectedInstance.successCount || 0}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>成功数</div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#FF4D4F' }}>
                      {selectedInstance.errorCount || 0}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>失败数</div>
                  </div>
                </Card>
              </Col>
            </Row>

            {selectedInstance.webApiLogs && selectedInstance.webApiLogs.length > 0 && (
              <Card size="small" style={{ marginBottom: 16, background: '#FFF8E7', border: '1px solid #FFD88A' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <ApiOutlined style={{ color: '#F5A623' }} />
                    <Text strong>WebAPI 调用日志</Text>
                    <Tag color="warning">{selectedInstance.webApiLogs.length} 条记录</Tag>
                  </Space>
                  <Button type="primary" size="small" style={{ background: '#F5A623', borderColor: '#F5A623' }} onClick={() => setShowWebApiLogs(true)}>
                    查看日志
                  </Button>
                </div>
              </Card>
            )}

            <Card size="small" title={`执行日志（共 ${selectedInstance.logs?.length || 0} 条）`} style={{ background: '#FAFAFA' }}>
              <List
                size="small"
                dataSource={selectedInstance.logs || []}
                renderItem={(log: any) => (
                  <List.Item style={{ background: '#FFFFFF', marginBottom: 8, borderRadius: 6, padding: 12 }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>{new Date(log.timestamp).toLocaleString()}</Text>
                        <Tag color={log.level === 'error' ? 'error' : log.level === 'warning' ? 'warning' : 'blue'} style={{ fontSize: 11 }}>
                          {log.level}
                        </Tag>
                      </div>
                      <Text>{log.message}</Text>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}
      </Modal>

      {/* WebAPI 日志查看弹窗 */}
      <Modal
        title="WebAPI 调用日志"
        open={showWebApiLogs && !!selectedInstance}
        onCancel={() => {
          setShowWebApiLogs(false);
          setSelectedWebApiLog(null);
        }}
        footer={[
          <Button key="close" onClick={() => { setShowWebApiLogs(false); setSelectedWebApiLog(null); }}>
            关闭
          </Button>,
        ]}
        width={1000}
        className="custom-modal"
      >
        {selectedInstance && (
          <div>
            {selectedWebApiLog ? (
              <div>
                <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => setSelectedWebApiLog(null)} style={{ marginBottom: 16, padding: 0 }}>
                  返回日志列表
                </Button>
                <Card size="small" title={<Space><Text strong>Record ID: {selectedWebApiLog.recordId}</Text>{selectedWebApiLog.success ? <Tag color="success">成功</Tag> : <Tag color="error">失败</Tag>}</Space>} style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">调用时间:</Text>
                    <Text style={{ marginLeft: 8 }}>{new Date(selectedWebApiLog.timestamp).toLocaleString()}</Text>
                  </div>
                  {selectedWebApiLog.errorMessage && (
                    <div style={{ marginBottom: 16 }}>
                      <Text type="danger">错误信息: {selectedWebApiLog.errorMessage}</Text>
                    </div>
                  )}
                </Card>
                <Row gutter={16}>
                  <Col span={12}>
                    <Card size="small" title="飞书原始数据" style={{ marginBottom: 16 }}>
                      <pre style={{ margin: 0, fontSize: 11, maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(selectedWebApiLog.feishuData, null, 2)}</pre>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" title="发送到金蝶的数据" style={{ marginBottom: 16 }}>
                      <pre style={{ margin: 0, fontSize: 11, maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(selectedWebApiLog.requestData, null, 2)}</pre>
                    </Card>
                  </Col>
                </Row>
                <Card size="small" title="金蝶返回数据" style={{ marginBottom: 16 }}>
                  <pre style={{ margin: 0, fontSize: 11, maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(selectedWebApiLog.responseData, null, 2)}</pre>
                </Card>
                {selectedWebApiLog.writeBackData && (
                  <Card size="small" title={<Space><span>回写飞书数据</span>{selectedWebApiLog.writeBackSuccess ? <Tag color="success">回写成功</Tag> : <Tag color="error">回写失败</Tag>}</Space>}>
                    <pre style={{ margin: 0, fontSize: 11 }}>{JSON.stringify(selectedWebApiLog.writeBackData, null, 2)}</pre>
                    {selectedWebApiLog.writeBackError && (
                      <div style={{ marginTop: 8 }}>
                        <Text type="danger">回写错误: {selectedWebApiLog.writeBackError}</Text>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            ) : (
              <>
              <div style={{ marginBottom: 12, padding: '8px 12px', background: '#FFF8E7', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  共 {selectedInstance.webApiLogs.length} 条记录，显示前 10 条
                </Text>
                {selectedInstance.webApiLogs.length > 10 && (
                  <Text type="warning" style={{ fontSize: 12 }}>
                    更多记录请在服务器文件夹查看
                  </Text>
                )}
              </div>
              <List
                size="small"
                dataSource={(selectedInstance.webApiLogs || []).slice(0, 10)}
                renderItem={(log: any, index: number) => (
                  <List.Item
                    style={{ background: log.success ? '#F6FFED' : '#FFF1F0', marginBottom: 8, borderRadius: 6, padding: 12, cursor: 'pointer', border: `1px solid ${log.success ? '#B7EB8F' : '#FFA39E'}` }}
                    onClick={() => setSelectedWebApiLog(log)}
                  >
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Space>
                          <Text strong>#{index + 1}</Text>
                          <Tag color={log.success ? 'success' : 'error'}>{log.success ? '成功' : '失败'}</Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>Record: {log.recordId.slice(0, 20)}...</Text>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>{new Date(log.timestamp).toLocaleString()}</Text>
                      </div>
                      {log.errorMessage && (
                        <div>
                          <Text type="danger" style={{ fontSize: 12 }}>错误: {log.errorMessage}</Text>
                        </div>
                      )}
                    </div>
                  </List.Item>
                )}
              />
              </>
            )}
          </div>
        )}
      </Modal>

      {/* 测试连接弹窗 */}
      <Modal
        title={testModalType === 'feishu' ? '飞书登录测试' : testModalType === 'kingdee' ? '金蝶登录测试' : '完整同步测试'}
        open={testModalOpen}
        onCancel={() => setTestModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setTestModalOpen(false)}>关闭</Button>,
          <Button key="test" type="primary" loading={testLoading} onClick={executeTest} disabled={!testTaskId}>开始测试</Button>,
        ]}
        width={700}
        className="custom-modal"
      >
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>选择测试任务</Text>
          <Select
            style={{ width: '100%' }}
            placeholder="请选择要测试的任务"
            value={testTaskId || undefined}
            onChange={setTestTaskId}
            options={tasks.map((task) => ({
              value: task.id,
              label: (
                <Space>
                  <span>{task.name}</span>
                  {task.enabled && <Tag color="success">已启用</Tag>}
                  {!task.feishuConfig.appId && <Tag color="error">飞书未配置</Tag>}
                  {!task.kingdeeConfig.loginParams.username && <Tag color="error">金蝶未配置</Tag>}
                </Space>
              ),
            }))}
          />
        </div>

        {testModalType === 'sync' && (
          <Alert
            message="完整同步测试说明"
            description={<ul style={{ margin: 0, paddingLeft: 16 }}><li>Step 1: 从飞书表格查询第一条记录</li><li>Step 2: 将数据导入到金蝶系统</li><li>Step 3: 将同步状态写回飞书表格（仅在配置了回写字段时执行）</li><li style={{ color: '#FF4D4F' }}>注意：此测试会实际修改金蝶和飞书的数据，请谨慎使用！</li></ul>}
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {testResult && (
          <Card
            title={<Space>{testResult.success ? <CheckCircleOutlined style={{ color: '#52C41A' }} /> : <CloseCircleOutlined style={{ color: '#FF4D4F' }} />} <span>{testResult.title}</span></Space>}
            style={{ background: testResult.success ? '#F6FFED' : '#FFF1F0', border: `1px solid ${testResult.success ? '#B7EB8F' : '#FFA39E'}` }}
          >
            {testResult.message && (
              <div style={{ marginBottom: 16 }}>
                <Text type={testResult.success ? 'success' : 'danger'}>{testResult.message}</Text>
              </div>
            )}

            {(testResult.type === 'feishu' || testResult.type === 'kingdee') && testResult.details && (
              <div>
                {Object.entries(testResult.details).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: 8 }}>
                    <Text type="secondary">{key}:</Text>
                    <Text style={{ marginLeft: 8 }}>{String(value)}</Text>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </Modal>
      </div>
    </div>
  );
}

export default App;
