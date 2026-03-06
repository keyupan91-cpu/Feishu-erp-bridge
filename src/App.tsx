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
  Collapse,
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
import type { TaskConfig, TaskInstance, WebAPILog } from './types';
import TaskConfigComponent from './components/TaskConfig';
import WebAPIDebugger from './components/WebAPIDebugger';
import AuthPage from './components/AuthPage';
// MobileLayout 组件已导入，用于移动端适配
import { useAccountStore } from './stores/accountStore';
import FeishuService from './services/feishuService';
import KingdeeService from './services/kingdeeService';
import { executeTask, stopTaskExecution } from './services/taskExecutor';
// 移动端优化导入
import { useResponsive } from './hooks/useResponsive';
import { BottomNavBar, TopNavBar, MobileTaskCard, MobileTaskInstanceCard } from './components';
import './theme.css';

const { Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

function App() {
  // 响应式检测
  const { isMobile } = useResponsive();

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

  // 处理删除单个执行记录
  const handleDeleteInstance = (instanceId: string) => {
    Modal.confirm({
      title: '删除执行记录',
      content: '确定要删除这条执行记录吗？',
      onOk: async () => {
        await deleteTaskInstance(instanceId);
        message.success('执行记录已删除');
      },
    });
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

  // 移动端视图
  if (isMobile) {
    return (
      <>
        <div className="app-container mobile-view">
        <TopNavBar
          title="金蝶数据传输"
          rightContent={<Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} size="small" />}
        />
        <div className="mobile-content-wrapper">
          {activeTab === 'tasks' && (
            <>
              <div className="mobile-stat-cards">
                <Card className="stat-card" size="small">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>总任务数</Text>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{tasks.length}</div>
                    </div>
                    <div style={{ width: 40, height: 40, background: '#E6F7FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UnorderedListOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                    </div>
                  </div>
                </Card>
                <Card className="stat-card" size="small">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>今日执行</Text>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                        {taskInstances.filter(i => i.startTime && new Date(i.startTime).toDateString() === new Date().toDateString()).length}
                      </div>
                    </div>
                    <div style={{ width: 40, height: 40, background: '#F6FFED', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                    </div>
                  </div>
                </Card>
                <Card className="stat-card" size="small">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>今日失败</Text>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                        {taskInstances.filter(i => i.startTime && new Date(i.startTime).toDateString() === new Date().toDateString() && i.status === TaskStatus.ERROR).length}
                      </div>
                    </div>
                    <div style={{ width: 40, height: 40, background: '#FFF1F0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CloseCircleOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />
                    </div>
                  </div>
                </Card>
              </div>
              <div className="mobile-task-list">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 16 }}>任务列表</Text>
                  <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => { setEditingTask(null); setFormData({ name: '', description: '' }); setIsModalOpen(true); }}>新建</Button>
                </div>
                {tasks.length === 0 ? (<Empty description="暂无任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />) : (
                  tasks.map(task => (
                    <MobileTaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => { setEditingTask(task); setFormData({ name: task.name, description: task.description || '' }); setIsModalOpen(true); }}
                      onConfig={() => { setSelectedTask(task); setIsConfigModalOpen(true); }}
                      onTest={() => { setSelectedTask(task); setTestTaskId(task.id); setTestModalType('sync'); setTestResult(null); setTestModalOpen(true); }}
                      onExecute={() => handleStartTask(task.id)}
                      onToggle={() => toggleTask(task.id)}
                    />
                  ))
                )}
              </div>
              <div className="mobile-actions">
                <Button block icon={<ExportOutlined />} onClick={handleExport} size="large">导出数据</Button>
                <Button block icon={<ImportOutlined />} onClick={handleImport} size="large" style={{ marginTop: 8 }}>导入数据</Button>
              </div>
            </>
          )}
          {activeTab === 'monitoring' && (
            <div className="mobile-monitoring">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text strong style={{ fontSize: 16 }}>执行记录</Text>
                <Button icon={<ClearOutlined />} onClick={handleClearInstances} disabled={taskInstances.length === 0} size="small">清空</Button>
              </div>
              {taskInstances.length === 0 ? (<Empty description="暂无执行记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />) : (
                taskInstances.map(instance => {
                  const task = tasks.find(t => t.id === instance.taskId);
                  return (
                    <MobileTaskInstanceCard
                      key={instance.id}
                      instance={instance}
                      taskName={task?.name}
                      onStop={() => handleStopTask(instance.id)}
                      onDelete={() => handleDeleteInstance(instance.id)}
                      onViewLogs={() => { setSelectedInstance(instance); setShowWebApiLogs(true); }}
                    />
                  );
                })
              )}
            </div>
          )}
          {activeTab === 'debugger' && (
            <div className="mobile-debugger">
              <WebAPIDebugger />
            </div>
          )}
          {activeTab === 'profile' && (
            <div className="mobile-profile">
              <Card className="stat-card" size="small" style={{ marginBottom: 12 }}>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: 60, height: 60, background: '#E6F7FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <UserOutlined style={{ fontSize: 30, color: '#1890ff' }} />
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 18 }}>{currentAccount?.username}</h3>
                  <Text type="secondary" style={{ fontSize: 13 }}>注册时间：{new Date(currentAccount?.createdAt || Date.now()).toLocaleDateString('zh-CN')}</Text>
                </div>
              </Card>
              <div className="mobile-actions">
                <Button block icon={<ExportOutlined />} onClick={handleExport} size="large">导出数据</Button>
                <Button block icon={<ImportOutlined />} onClick={handleImport} size="large" style={{ marginTop: 8 }}>导入数据</Button>
                <Button block danger icon={<LogoutOutlined />} onClick={handleLogout} size="large" style={{ marginTop: 8 }}>退出登录</Button>
              </div>
            </div>
          )}
        </div>
        <BottomNavBar
          activeKey={activeTab}
          onTabChange={setActiveTab}
          items={[
            { key: 'tasks', label: '任务', icon: <UnorderedListOutlined /> },
            { key: 'monitoring', label: '监控', icon: <HistoryOutlined /> },
            { key: 'debugger', label: 'API', icon: <ApiOutlined /> },
            { key: 'profile', label: '我的', icon: <UserOutlined /> },
          ]}
        />
      </div>

      {/* 通用 Modal 组件 - 在移动端和桌面端都渲染 */}
      {/* 新建/编辑任务弹窗 */}
      <Modal
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
        title={editingTask ? '编辑任务' : '新建任务'}
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
            onTest={(type) => {
              setTestModalType(type === 'kingdee-validate' ? 'kingdee' : type);
              setTestTaskId(selectedTask.id);
              setTestResult(null);
              setTestModalOpen(true);
            }}
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
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>任务名称</div>
                  <div style={{ fontWeight: 600 }}>{tasks.find(t => t.id === selectedInstance.taskId)?.name || '-'}</div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>开始时间</div>
                  <div>{selectedInstance.startTime ? new Date(selectedInstance.startTime).toLocaleString('zh-CN') : '-'}</div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>结束时间</div>
                  <div>{selectedInstance.endTime ? new Date(selectedInstance.endTime).toLocaleString('zh-CN') : '执行中...'}</div>
                </Card>
              </Col>
            </Row>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>执行进度</div>
              <Progress
                percent={selectedInstance.progress}
                status={
                  selectedInstance.status === TaskStatus.ERROR ? 'exception' :
                  selectedInstance.status === TaskStatus.SUCCESS ? 'success' :
                  'active'
                }
              />
            </div>

            {selectedInstance.webApiLogs && selectedInstance.webApiLogs.length > 0 && (
              <Card size="small" style={{ marginBottom: 16, background: '#FFF8E7', border: '1px solid #FFD88A' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <ApiOutlined style={{ color: '#F5A623' }} />
                    <Text strong>WebAPI 调用日志</Text>
                    <Tag color="warning">{selectedInstance.webApiLogs.length} 条记录</Tag>
                  </Space>
                  <Button type="primary" size="small" style={{ background: '#F5A623', borderColor: '#F5A623' }} onClick={() => setShowWebApiLogs(true)}>
                    查看详情
                  </Button>
                </div>
              </Card>
            )}

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>执行日志</div>
              <div style={{
                background: '#fafafa',
                border: '1px solid #e8e8e8',
                borderRadius: 4,
                padding: 12,
                maxHeight: 300,
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: 12,
              }}>
                {selectedInstance.logs.length === 0 ? (
                  <Empty description="暂无日志" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  selectedInstance.logs.map((log, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '4px 0',
                        borderBottom: index < selectedInstance.logs.length - 1 ? '1px solid #eee' : 'none',
                        color: log.level === 'error' ? '#ff4d4f' :
                               log.level === 'warn' ? '#faad14' :
                               '#666',
                      }}
                    >
                      <span style={{ color: '#999' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      {' '}{log.message}
                    </div>
                  ))
                )}
              </div>
            </div>
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
        width={900}
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
                      <Text type="danger">错误信息：{selectedWebApiLog.errorMessage}</Text>
                    </div>
                  )}
                </Card>
                <Collapse defaultActiveKey={['feishu']} items={[
                  {
                    key: 'feishu',
                    label: '📄 飞书原始数据',
                    children: <pre style={{ margin: 0, fontSize: 11, maxHeight: 300, overflow: 'auto', background: '#f5f5f5', padding: 12, borderRadius: 4 }}>{JSON.stringify(selectedWebApiLog.feishuData, null, 2)}</pre>
                  },
                  {
                    key: 'request',
                    label: '📤 发送到金蝶的数据',
                    children: <pre style={{ margin: 0, fontSize: 11, maxHeight: 300, overflow: 'auto', background: '#f5f5f5', padding: 12, borderRadius: 4 }}>{JSON.stringify(selectedWebApiLog.requestData, null, 2)}</pre>
                  },
                  {
                    key: 'response',
                    label: '📥 金蝶响应数据',
                    children: <pre style={{ margin: 0, fontSize: 11, maxHeight: 300, overflow: 'auto', background: '#f5f5f5', padding: 12, borderRadius: 4 }}>{JSON.stringify(selectedWebApiLog.responseData, null, 2)}</pre>
                  },
                  {
                    key: 'writeback',
                    label: '↩️ 回写到飞书的数据',
                    children: selectedWebApiLog.writeBackData ? (
                      <div>
                        <pre style={{ margin: 0, fontSize: 11, maxHeight: 300, overflow: 'auto', background: '#f5f5f5', padding: 12, borderRadius: 4 }}>{JSON.stringify(selectedWebApiLog.writeBackData, null, 2)}</pre>
                        {selectedWebApiLog.writeBackError && (
                          <Alert type="error" message={selectedWebApiLog.writeBackError} style={{ marginTop: 8 }} />
                        )}
                      </div>
                    ) : <Empty description="无回写数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  }
                ]} />
              </div>
            ) : (
              <List
                size="small"
                dataSource={selectedInstance.webApiLogs || []}
                renderItem={(log: WebAPILog) => (
                  <List.Item
                    style={{
                      marginBottom: 8,
                      borderRadius: 6,
                      padding: 12,
                      background: log.success ? '#F6FFED' : '#FFF1F0',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedWebApiLog(log)}
                  >
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Space>
                          <Text strong>Record ID: {log.recordId}</Text>
                          <Tag color={log.success ? 'success' : 'error'}>{log.success ? '成功' : '失败'}</Tag>
                        </Space>
                        <Text type="secondary">{new Date(log.timestamp).toLocaleString()}</Text>
                      </div>
                      {log.errorMessage && <div><Text type="danger">错误：{log.errorMessage}</Text></div>}
                    </div>
                  </List.Item>
                )}
              />
            )}
          </div>
        )}
      </Modal>

      {/* 测试连接弹窗 */}
      <Modal
        title={
          <Space>
            {testModalType === 'feishu' && <LoginOutlined style={{ color: '#4A90E2' }} />}
            {testModalType === 'kingdee' && <LoginOutlined style={{ color: '#F5A623' }} />}
            {testModalType === 'sync' && <CloudSyncOutlined style={{ color: '#52C41A' }} />}
            <span>
              {testModalType === 'feishu' ? '飞书登录测试' :
               testModalType === 'kingdee' ? '金蝶登录测试' :
               '完整同步测试'}
            </span>
          </Space>
        }
        open={testModalOpen}
        onCancel={() => setTestModalOpen(false)}
        footer={null}
        width="90%"
        className="custom-modal"
      >
        {selectedTask && (
          <div style={{ marginBottom: 16, padding: '8px 12px', background: '#F5F5F5', borderRadius: 6 }}>
            <Text type="secondary">当前测试任务：</Text>
            <Text strong>{selectedTask.name}</Text>
          </div>
        )}

        {/* 任务选择器 - 当有多个任务时显示 */}
        {tasks.length > 1 && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ marginRight: 8 }}>选择任务：</Text>
            <Select
              value={testTaskId}
              onChange={(value) => {
                setTestTaskId(value);
                const task = tasks.find(t => t.id === value);
                if (task) setSelectedTask(task);
              }}
              options={tasks.map(t => ({ label: t.name, value: t.id }))}
              style={{ width: '100%' }}
            />
          </div>
        )}

        <Alert
          message={
            testModalType === 'feishu' ? '飞书登录测试' :
            testModalType === 'kingdee' ? '金蝶登录测试' :
            '完整同步测试说明'
          }
          description={
            testModalType === 'feishu' ? <ul style={{ margin: 0, paddingLeft: 16 }}><li>Step 1: 使用配置的 AppID 和 AppSecret 请求飞书开放平台</li><li>Step 2: 获取 tenant_access_token (应用访问令牌)</li><li>Step 3: 验证是否能够访问飞书表格 API</li></ul> :
            testModalType === 'kingdee' ? <ul style={{ margin: 0, paddingLeft: 16 }}><li>Step 1: 使用配置的服务器地址和金蝶用户名密码</li><li>Step 2: 调用金蝶 WebAPI 的 /Login 接口</li><li>Step 3: 验证是否返回有效的 accountId</li></ul> :
            <ul style={{ margin: 0, paddingLeft: 16 }}><li>Step 1: 从飞书表格查询第一条记录</li><li>Step 2: 将数据导入到金蝶系统</li><li>Step 3: 将同步状态写回飞书表格（仅在配置了回写字段时执行）</li><li style={{ color: '#FF4D4F' }}>注意：此测试会实际修改金蝶和飞书的数据，请谨慎使用！</li></ul>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

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

        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          <Button type="primary" onClick={executeTest} block>
            开始测试
          </Button>
          <Button onClick={() => setTestModalOpen(false)}>
            取消
          </Button>
        </div>
      </Modal>
    </>
  );
  }

// 桌面端视图
return (
  <>
  <div className="app-container">
    {/* 桌面端视图 - 头部 */}
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
      </div>
    </div>

    {/* 通用 Modal 组件 - 桌面端也需渲染 */}
    {/* 新建/编辑任务弹窗 */}
    <Modal
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
      title={editingTask ? '编辑任务' : '新建任务'}
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
          onTest={(type) => {
            setTestModalType(type === 'kingdee-validate' ? 'kingdee' : type);
            setTestTaskId(selectedTask.id);
            setTestResult(null);
            setTestModalOpen(true);
          }}
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
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>任务名称</div>
                <div style={{ fontWeight: 600 }}>{tasks.find(t => t.id === selectedInstance.taskId)?.name || '-'}</div>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>状态</div>
                <div>
                  <Tag color={selectedInstance.status === TaskStatus.RUNNING ? 'blue' : selectedInstance.status === TaskStatus.SUCCESS ? 'green' : 'default'}>
                    {selectedInstance.status}
                  </Tag>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>进度</div>
                <div>{selectedInstance.progress}%</div>
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
                  查看详情
                </Button>
              </div>
            </Card>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>执行日志</div>
            <div style={{
              background: '#fafafa',
              border: '1px solid #e8e8e8',
              borderRadius: 4,
              padding: 12,
              maxHeight: 300,
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: 12,
            }}>
              {selectedInstance.logs.length === 0 ? (
                <Empty description="暂无日志" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                selectedInstance.logs.map((log, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '4px 0',
                      borderBottom: index < selectedInstance.logs.length - 1 ? '1px solid #eee' : 'none',
                      color: log.level === 'error' ? '#ff4d4f' :
                             log.level === 'warn' ? '#faad14' :
                             '#666',
                    }}
                  >
                    <span style={{ color: '#999' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    {' '}{log.message}
                  </div>
                ))
              )}
            </div>
          </div>
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
      width={900}
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
                    <Text type="danger">错误信息：{selectedWebApiLog.errorMessage}</Text>
                  </div>
                )}
              </Card>
              <Collapse defaultActiveKey={['feishu']} items={[
                {
                  key: 'feishu',
                  label: '📄 飞书原始数据',
                  children: <pre style={{ margin: 0, fontSize: 11, maxHeight: 300, overflow: 'auto', background: '#f5f5f5', padding: 12, borderRadius: 4 }}>{JSON.stringify(selectedWebApiLog.feishuData, null, 2)}</pre>
                },
                {
                  key: 'request',
                  label: '📤 发送到金蝶的数据',
                  children: <pre style={{ margin: 0, fontSize: 11, maxHeight: 300, overflow: 'auto', background: '#f5f5f5', padding: 12, borderRadius: 4 }}>{JSON.stringify(selectedWebApiLog.requestData, null, 2)}</pre>
                },
                {
                  key: 'response',
                  label: '📥 金蝶响应数据',
                  children: <pre style={{ margin: 0, fontSize: 11, maxHeight: 300, overflow: 'auto', background: '#f5f5f5', padding: 12, borderRadius: 4 }}>{JSON.stringify(selectedWebApiLog.responseData, null, 2)}</pre>
                },
                {
                  key: 'writeback',
                  label: '↩️ 回写到飞书的数据',
                  children: selectedWebApiLog.writeBackData ? (
                    <div>
                      <pre style={{ margin: 0, fontSize: 11, maxHeight: 300, overflow: 'auto', background: '#f5f5f5', padding: 12, borderRadius: 4 }}>{JSON.stringify(selectedWebApiLog.writeBackData, null, 2)}</pre>
                      {selectedWebApiLog.writeBackError && (
                        <Alert type="error" message={selectedWebApiLog.writeBackError} style={{ marginTop: 8 }} />
                      )}
                    </div>
                  ) : <Empty description="无回写数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                }
              ]} />
            </div>
          ) : (
            <List
              size="small"
              dataSource={selectedInstance.webApiLogs || []}
              renderItem={(log: WebAPILog) => (
                <List.Item
                  style={{
                    marginBottom: 8,
                    borderRadius: 6,
                    padding: 12,
                    background: log.success ? '#F6FFED' : '#FFF1F0',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedWebApiLog(log)}
                >
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text strong>{log.recordId}</Text>
                      <Tag color={log.success ? 'success' : 'error'}>{log.success ? '成功' : '失败'}</Tag>
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </div>
      )}
    </Modal>

    {/* 测试连接弹窗 */}
    <Modal
      title={
        <Space>
          {testModalType === 'feishu' && <LoginOutlined style={{ color: '#4A90E2' }} />}
          {testModalType === 'kingdee' && <LoginOutlined style={{ color: '#F5A623' }} />}
          {testModalType === 'sync' && <CloudSyncOutlined style={{ color: '#52C41A' }} />}
          <span>
            {testModalType === 'feishu' ? '飞书登录测试' :
             testModalType === 'kingdee' ? '金蝶登录测试' :
             '完整同步测试'}
          </span>
        </Space>
      }
      open={testModalOpen}
      onCancel={() => setTestModalOpen(false)}
      footer={null}
      width="90%"
      className="custom-modal"
    >
      {selectedTask && (
        <div style={{ marginBottom: 16, padding: '8px 12px', background: '#F5F5F5', borderRadius: 6 }}>
          <Text type="secondary">当前测试任务：</Text>
          <Text strong>{selectedTask.name}</Text>
        </div>
      )}

      {/* 任务选择器 - 当有多个任务时显示 */}
      {tasks.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ marginRight: 8 }}>选择任务：</Text>
          <Select
            value={testTaskId}
            onChange={(value) => {
              setTestTaskId(value);
              const task = tasks.find(t => t.id === value);
              if (task) setSelectedTask(task);
            }}
            options={tasks.map(t => ({ label: t.name, value: t.id }))}
            style={{ width: '100%' }}
          />
        </div>
      )}

      <Alert
        message={
          testModalType === 'feishu' ? '飞书登录测试' :
          testModalType === 'kingdee' ? '金蝶登录测试' :
          '完整同步测试说明'
        }
        description={
          testModalType === 'feishu' ? <ul style={{ margin: 0, paddingLeft: 16 }}><li>Step 1: 使用配置的 AppID 和 AppSecret 请求飞书开放平台</li><li>Step 2: 获取 tenant_access_token (应用访问令牌)</li><li>Step 3: 验证是否能够访问飞书表格 API</li></ul> :
          testModalType === 'kingdee' ? <ul style={{ margin: 0, paddingLeft: 16 }}><li>Step 1: 使用配置的服务器地址和金蝶用户名密码</li><li>Step 2: 调用金蝶 WebAPI 的 /Login 接口</li><li>Step 3: 验证是否返回有效的 accountId</li></ul> :
          <ul style={{ margin: 0, paddingLeft: 16 }}><li>Step 1: 从飞书表格查询第一条记录</li><li>Step 2: 将数据导入到金蝶系统</li><li>Step 3: 将同步状态写回飞书表格（仅在配置了回写字段时执行）</li><li style={{ color: '#FF4D4F' }}>注意：此测试会实际修改金蝶和飞书的数据，请谨慎使用！</li></ul>
        }
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

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

      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        <Button type="primary" onClick={executeTest} block>
          开始测试
        </Button>
        <Button onClick={() => setTestModalOpen(false)}>
          取消
        </Button>
      </div>
    </Modal>
  </>
  );
}

export default App;
