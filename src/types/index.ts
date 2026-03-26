// 任务状态
export const TaskStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning'
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

// 任务验证状态
export interface TaskVerificationStatus {
  feishuLoginTest: boolean;      // 飞书登录测试
  feishuFieldTest: boolean;      // 飞书字段查询/筛选/回传测试
  kingdeeLoginTest: boolean;     // 金蝶登录测试
  fullFlowTest: boolean;         // 第一条记录完整流程测试
  lastVerifiedAt?: string;       // 最后验证时间
}

// 字段处理类型
export type FieldProcessType = 'auto' | 'text' | 'number' | 'date' | 'datetime' | 'timestamp' | 'select' | 'multiselect' | 'checkbox' | 'person' | 'phone';

export interface FeishuFieldMeta {
  fieldId: string;
  fieldName: string;
  fieldType: number;
  uiType?: string;
  isPrimary?: boolean;
  property?: any;
}

// 飞书字段参数
export interface FeishuFieldParam {
  id: string;
  variableName: string;
  fieldName: string;
  processType?: FieldProcessType; // 处理类型（默认 auto 自动检测）
  decimalPlaces?: number; // 小数位数（数字类型，默认 2）
  dateFormat?: 'YYYY-MM-DD' | 'YYYY/MM/DD' | 'YYYYMMDD' | 'timestamp'; // 日期格式（日期类型）
  sourceFieldType?: number; // 飞书字段类型编码（自动填充，如 1=文本，2=数字，5=日期）
  sourceUiType?: string; // 飞书字段 ui_type
  sourceFieldId?: string; // 飞书字段 id
}

// 筛选条件
export interface FilterCondition {
  id: string;
  fieldName: string;
  operator: 'eq' | 'ne' | 'contains' | 'notContains' | 'isEmpty' | 'isNotEmpty';
  value?: string;
}

// 回写字段配置
export interface WriteBackField {
  id: string;
  fieldName: string; // 飞书字段名
  source: 'success' | 'error' | 'response' | 'status'; // 数据来源：成功消息/错误消息/完整响应/响应状态
  jsonPath?: string; // JSON路径，用于从响应中提取特定字段
}

// 飞书参数配置
export interface FeishuConfig {
  appId: string;
  appSecret: string;
  appToken: string;
  tableId: string;
  viewId?: string;
  fieldParams: FeishuFieldParam[];
  filterConditions?: FilterCondition[];
  writeBackFields?: WriteBackField[]; // 回写字段配置
}

// 金蝶登录参数
export interface KingdeeLoginParams {
  appId: string;
  appSecret: string;
  username: string;
  password: string;
  baseUrl: string;
  acctId?: string;
  dbId?: string;
}

// 金蝶参数配置
export interface KingdeeConfig {
  loginParams: KingdeeLoginParams;
  formId: string;
  dataTemplate: string; // JSON模板
}

// 任务配置
export interface TaskConfig {
  id: string;
  name: string;
  description: string;
  feishuConfig: FeishuConfig;
  kingdeeConfig: KingdeeConfig;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  verificationStatus?: TaskVerificationStatus;  // 验证状态
}

// 任务执行记录
export interface TaskLog {
  id: string;
  instanceId: string; // 任务实例 ID
  taskId: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

// WebAPI 调用日志
export interface WebAPILog {
  id: string;
  instanceId: string; // 任务实例 ID
  timestamp: string;
  recordId: string; // 飞书记录ID
  feishuData?: any; // 飞书原始数据
  requestData?: any; // 发送到金蝶的数据
  responseData?: any; // 金蝶返回的数据
  success: boolean;
  errorMessage?: string;
  writeBackData?: any; // 回写到飞书的数据
  writeBackSuccess?: boolean;
  writeBackError?: string;
}

// 任务实例
export interface TaskInstance {
  id: string;
  taskId: string;
  status: TaskStatus;
  startTime?: string;
  endTime?: string;
  logs: any[];
  webApiLogs: any[]; // 日志已移除，存储在 IndexedDB 中 // WebAPI调用日志
  progress: number;
  totalCount?: number;
  successCount?: number;
  errorCount?: number;
  isStopping?: boolean;
  stopRequestedAt?: string | null;
}
