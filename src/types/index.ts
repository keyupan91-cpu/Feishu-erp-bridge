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

// 飞书字段参数
export interface FeishuFieldParam {
  id: string;
  variableName: string;
  fieldName: string;
  decimalPlaces?: number; // 小数位数
}

// 筛选条件
export interface FilterCondition {
  fieldName: string;
  operator: 'eq' | 'ne' | 'contains' | 'notContains' | 'isEmpty' | 'isNotEmpty';
  value?: string;
}

// 回写字段配置
export interface WriteBackField {
  id: string;
  fieldName: string; // 飞书字段名
  source: 'success' | 'error' | 'response'; // 数据来源：成功/错误/完整响应
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
}

// 任务执行记录
export interface TaskLog {
  id: string;
  taskId: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

// WebAPI 调用日志
export interface WebAPILog {
  id: string;
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
  logs: TaskLog[];
  webApiLogs: WebAPILog[]; // WebAPI调用日志
  progress: number;
  totalCount?: number;
  successCount?: number;
  errorCount?: number;
}
