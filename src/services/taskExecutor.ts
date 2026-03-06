import FeishuService from './feishuService';
import KingdeeService from './kingdeeService';
import type { TaskConfig, TaskInstance, TaskLog, WebAPILog } from '../types';
import { TaskStatus } from '../types';
import { useAccountStore } from '../stores/accountStore';

// 任务执行器类
export class TaskExecutor {
  private task: TaskConfig;
  private instance: TaskInstance;
  private feishuService: FeishuService;
  private kingdeeService: KingdeeService;
  private isRunning: boolean = false;
  private abortController: AbortController | null = null;

  constructor(task: TaskConfig, instance: TaskInstance) {
    this.task = task;
    this.instance = instance;
    this.feishuService = new FeishuService(task.feishuConfig);
    this.kingdeeService = new KingdeeService(task.kingdeeConfig);
  }

  // 添加日志
  private async addLog(level: 'info' | 'warn' | 'error', message: string) {
    const log: Omit<TaskLog, 'id' | 'taskId'> = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    await useAccountStore.getState().addTaskLog(this.instance.id, log as TaskLog);
  }

  // 添加 WebAPI 日志
  private async addWebApiLog(log: WebAPILog) {
    await useAccountStore.getState().addWebApiLog(this.instance.id, log);
  }

  // 更新进度 - 只更新内存，不保存到服务器
  private async updateProgress(progress: number, successCount: number, errorCount: number) {
    const store = useAccountStore.getState();
    const updatedInstances = store.taskInstances.map((i) =>
      i.id === this.instance.id
        ? { ...i, progress, successCount, errorCount }
        : i
    );
    useAccountStore.setState({ taskInstances: updatedInstances });
  }

  // 更新状态 - 只更新内存，不保存到服务器
  private async updateStatus(status: TaskStatus) {
    const store = useAccountStore.getState();
    const updatedInstances = store.taskInstances.map((i) =>
      i.id === this.instance.id
        ? {
            ...i,
            status,
            endTime: status === TaskStatus.SUCCESS || status === TaskStatus.ERROR ? new Date().toISOString() : undefined,
          }
        : i
    );
    useAccountStore.setState({ taskInstances: updatedInstances });
  }

  // 执行同步任务
  async execute(): Promise<void> {
    if (this.isRunning) {
      throw new Error('任务正在执行中');
    }

    this.isRunning = true;
    this.abortController = new AbortController();

    try {
      await this.updateStatus(TaskStatus.RUNNING);
      await this.addLog('info', '开始执行任务：' + this.task.name);

      // 步骤 1: 从飞书获取数据
      await this.addLog('info', '步骤 1: 从飞书表格查询数据...');
      const feishuData = await this.fetchFeishuData();

      if (feishuData.length === 0) {
        await this.addLog('warn', '飞书表格中没有符合条件的记录');
        await this.updateStatus(TaskStatus.SUCCESS);
        return;
      }

      await this.addLog('info', '从飞书获取到 ' + feishuData.length + ' 条记录');

      // 步骤 2: 导入数据到金蝶
      await this.addLog('info', '步骤 2: 导入数据到金蝶系统...');
      const { successCount, errorCount } = await this.importToKingdee(feishuData);

      // 步骤 3: 更新任务实例状态
      if (errorCount === 0) {
        await this.updateStatus(TaskStatus.SUCCESS);
        await this.addLog('info', '任务执行完成：成功 ' + successCount + ' 条');
      } else if (successCount === 0) {
        await this.updateStatus(TaskStatus.ERROR);
        await this.addLog('error', '任务执行失败：失败 ' + errorCount + ' 条');
      } else {
        await this.updateStatus(TaskStatus.WARNING);
        await this.addLog('warn', '任务执行完成：成功 ' + successCount + ' 条，失败 ' + errorCount + ' 条');
      }

    } catch (err: any) {
      await this.addLog('error', '任务执行异常：' + err.message);
      await this.updateStatus(TaskStatus.ERROR);
      throw err;
    } finally {
      this.isRunning = false;
      this.abortController = null;
      await this.saveInstanceData();
    }
  }

  // 统一保存任务实例数据
  private async saveInstanceData(): Promise<void> {
    try {
      const { useAccountStore } = await import('../stores/accountStore');
      const store = useAccountStore.getState();
      await store.saveToServer();
      console.log('任务实例数据已保存到服务器');
    } catch (error) {
      console.error('保存任务实例数据失败:', error);
    }
  }

  // 从飞书获取数据
  private async fetchFeishuData(): Promise<any[]> {
    try {
      const { tableId, viewId, filterConditions } = this.task.feishuConfig;
      if (!tableId) {
        throw new Error('飞书表格 ID 未配置');
      }
      const response = await this.feishuService.getTableData(tableId, viewId, filterConditions, undefined);
      if (response.code !== 0) {
        throw new Error(response.msg || '获取飞书数据失败');
      }
      return response.data?.items || [];
    } catch (err: any) {
      await this.addLog('error', '获取飞书数据失败：' + err.message);
      throw err;
    }
  }

  // 递归替换对象中的所有占位符
  private replacePlaceholders(obj: any, replacement: Record<string, any>): any {
    if (typeof obj === 'string') {
      // 替换字符串中的 {{variableName}} 占位符
      let result = obj;
      for (const [key, value] of Object.entries(replacement)) {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        result = result.replace(placeholder, String(value ?? ''));
      }
      return result;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.replacePlaceholders(item, replacement));
    }
    if (obj !== null && typeof obj === 'object') {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replacePlaceholders(value, replacement);
      }
      return result;
    }
    return obj;
  }

  // 导入数据到金蝶 - 优化：并发执行，提高速度
  private async importToKingdee(feishuItems: any[]): Promise<{ successCount: number; errorCount: number }> {
    let successCount = 0;
    let errorCount = 0;
    const total = feishuItems.length;
    const { formId, dataTemplate } = this.task.kingdeeConfig;

    if (!formId) {
      throw new Error('金蝶表单 ID 未配置');
    }

    const CONCURRENCY_LIMIT = 3;
    const queue = [...feishuItems];
    const executing: Promise<void>[] = [];

    let parsedTemplate: Record<string, any> | null = null;
    if (dataTemplate) {
      try {
        parsedTemplate = JSON.parse(dataTemplate);
      } catch {
        await this.addLog('warn', '数据模板解析失败，将使用原始数据');
      }
    }

    const processItem = async (item: any, index: number): Promise<void> => {
      const recordId = item.record_id;
      const fields = item.fields || {};
      let finalData: Record<string, any> = {};

      try {
        const formattedData = this.formatDataForKingdee(fields);
        finalData = formattedData;
        if (parsedTemplate) {
          // 先替换模板中的占位符，再合并格式化数据
          const templateWithValues = this.replacePlaceholders(parsedTemplate, formattedData);
          finalData = { ...templateWithValues, ...formattedData };
        }

        const result = await this.kingdeeService.saveData(formId, finalData);

        const webApiLog: Omit<WebAPILog, 'id'> = {
          recordId: recordId || ('record_' + index),
          timestamp: new Date().toISOString(),
          success: true,
          feishuData: fields,
          requestData: finalData,
          responseData: result,
        };

        successCount++;
        await this.handleWriteBack(recordId, 'success', '同步成功');
        await this.addWebApiLog(webApiLog as WebAPILog);

      } catch (err: any) {
        errorCount++;
        await this.handleWriteBack(recordId, 'error', err.message);

        const webApiLog: Omit<WebAPILog, 'id'> = {
          recordId: recordId || ('record_' + index),
          timestamp: new Date().toISOString(),
          success: false,
          errorMessage: err.message,
          feishuData: fields,
          requestData: finalData || {},
          responseData: err.responseData || {},
          writeBackData: {} as Record<string, any>,
          writeBackSuccess: false,
          writeBackError: undefined,
        };
        await this.addWebApiLog(webApiLog as WebAPILog);
        await this.addLog('error', '记录 ' + recordId + ' 导入失败：' + err.message);
      }

      const processedCount = successCount + errorCount;
      const progress = Math.round((processedCount / total) * 100);
      await this.updateProgress(progress, successCount, errorCount);
    };

    while (queue.length > 0 || executing.length > 0) {
      if (this.abortController?.signal.aborted) {
        await this.addLog('warn', '任务已被取消');
        break;
      }

      while (executing.length < CONCURRENCY_LIMIT && queue.length > 0) {
        const item = queue.shift()!;
        const index = feishuItems.length - queue.length;
        const promise = processItem(item, index).then(() => {
          executing.splice(executing.indexOf(promise), 1);
        });
        executing.push(promise);
      }

      if (executing.length > 0) {
        await Promise.race(executing);
      }
    }

    if (executing.length > 0) {
      await Promise.all(executing);
    }

    return { successCount, errorCount };
  }

  // 处理回写逻辑
  private async handleWriteBack(
    recordId: string | undefined,
    source: 'success' | 'error',
    message: string
  ): Promise<void> {
    const { tableId, writeBackFields = [] } = this.task.feishuConfig;
    if (!tableId || !recordId || writeBackFields.length === 0) {
      return;
    }

    const writeBackData: Record<string, any> = {};
    writeBackFields.forEach(field => {
      if (field.source === 'success') {
        writeBackData[field.fieldName] = source === 'success' ? '同步成功' : '同步失败';
      } else if (field.source === 'error') {
        writeBackData[field.fieldName] = source === 'success' ? '同步成功' : (message || '同步失败');
      }
    });

    if (Object.keys(writeBackData).length > 0) {
      try {
        await this.feishuService.writeBackData(tableId, recordId, writeBackData);
        await this.addLog('info', '记录 ' + recordId + ' 状态已回写到飞书');
      } catch (writeError: any) {
        await this.addLog('warn', '回写状态到飞书失败：' + writeError.message);
      }
    }
  }

  // 提取飞书字段的实际值（处理多行文本等复杂类型）
  private extractFeishuFieldValue(fieldValue: any): any {
    if (fieldValue === null || fieldValue === undefined) {
      return '';
    }

    // 如果是简单类型（数字、字符串、布尔值），直接返回
    if (typeof fieldValue === 'number' || typeof fieldValue === 'string' || typeof fieldValue === 'boolean') {
      return fieldValue;
    }

    // 如果是数组（如公司主体 [{text: '...', type: 'text'}]）
    if (Array.isArray(fieldValue)) {
      // 提取所有 text 值并拼接
      const texts = fieldValue.map(item => {
        if (typeof item === 'object' && item.text) {
          return item.text;
        }
        return String(item);
      }).join('');
      return texts;
    }

    // 如果是对象（大多数飞书字段格式）
    if (typeof fieldValue === 'object') {
      // 尝试提取 value 字段（可能是数组）
      if (fieldValue.value && Array.isArray(fieldValue.value)) {
        // 返回数组的第一个值
        return fieldValue.value[0];
      }
      // 尝试提取 text 字段
      if (fieldValue.text) {
        return fieldValue.text;
      }
      // 尝试提取 value 字段（单个值）
      if (fieldValue.value !== undefined) {
        return fieldValue.value;
      }
      // 返回 JSON 字符串
      return JSON.stringify(fieldValue);
    }

    return fieldValue;
  }

  // 格式化数据为金蝶格式
  private formatDataForKingdee(fields: Record<string, any>): Record<string, any> {
    const { fieldParams } = this.task.feishuConfig;
    const result: Record<string, any> = {};

    fieldParams.forEach(param => {
      const rawFieldValue = fields[param.fieldName];
      const fieldValue = this.extractFeishuFieldValue(rawFieldValue);
      if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
        if (param.decimalPlaces !== undefined && typeof fieldValue === 'number') {
          result[param.variableName] = Number(fieldValue.toFixed(param.decimalPlaces));
        } else {
          result[param.variableName] = fieldValue;
        }
      }
    });

    return result;
  }

  // 停止任务
  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.isRunning = false;
    }
  }

  // 检查是否正在运行
  isExecuting(): boolean {
    return this.isRunning;
  }
}

// 全局任务执行器管理
const runningExecutors: Map<string, TaskExecutor> = new Map();

// 执行任务
export async function executeTask(task: TaskConfig, instance: TaskInstance): Promise<void> {
  const executor = new TaskExecutor(task, instance);
  runningExecutors.set(instance.id, executor);

  try {
    await executor.execute();
  } finally {
    runningExecutors.delete(instance.id);
  }
}

// 停止任务
export function stopTaskExecution(instanceId: string): boolean {
  const executor = runningExecutors.get(instanceId);
  if (executor) {
    executor.stop();
    return true;
  }
  return false;
}

// 检查任务是否正在执行
export function isTaskExecuting(instanceId: string): boolean {
  const executor = runningExecutors.get(instanceId);
  return executor ? executor.isExecuting() : false;
}
