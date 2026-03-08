// 日志专用存储服务 - 直接存储到 IndexedDB，不占用浏览器内存
// 用于解决大量日志导致浏览器卡顿的问题

import type { TaskLog, WebAPILog } from '../types';

// 数据库配置
const DB_NAME = 'KingdeeLogDB';
const DB_VERSION = 2; // 增加版本号以触发升级，添加 instanceId 索引
const STORE_TASK_LOGS = 'taskLogs';
const STORE_WEB_API_LOGS = 'webApiLogs';

// 日志索引结构
interface LogIndex {
  instanceId: string;
  timestamp: string;
  id: string;
}

class LogStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  // 初始化数据库（懒加载）
  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 任务日志存储
        if (!db.objectStoreNames.contains(STORE_TASK_LOGS)) {
          const taskLogStore = db.createObjectStore(STORE_TASK_LOGS, { keyPath: 'id' });
          taskLogStore.createIndex('instanceId', 'instanceId', { unique: false });
          taskLogStore.createIndex('instanceId_timestamp', ['instanceId', 'timestamp'], { unique: false });
        }

        // WebAPI 日志存储
        if (!db.objectStoreNames.contains(STORE_WEB_API_LOGS)) {
          const webApiLogStore = db.createObjectStore(STORE_WEB_API_LOGS, { keyPath: 'id' });
          webApiLogStore.createIndex('instanceId', 'instanceId', { unique: false });
          webApiLogStore.createIndex('instanceId_timestamp', ['instanceId', 'timestamp'], { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  // 生成唯一 ID
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 添加任务日志 - 直接写入 IndexedDB，不返回内存
  async addTaskLog(instanceId: string, log: Omit<TaskLog, 'id'>): Promise<void> {
    if (!this.db) await this.init();

    const logWithId: TaskLog & { instanceId: string } = {
      ...log,
      id: this.generateId(),
      instanceId,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_TASK_LOGS], 'readwrite');
      const store = transaction.objectStore(STORE_TASK_LOGS);
      const request = store.add(logWithId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 添加 WebAPI 日志 - 直接写入 IndexedDB，不返回内存
  async addWebApiLog(instanceId: string, log: Omit<WebAPILog, 'id'>): Promise<void> {
    if (!this.db) await this.init();

    const logWithId: WebAPILog & { instanceId: string } = {
      ...log,
      id: this.generateId(),
      instanceId,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_WEB_API_LOGS], 'readwrite');
      const store = transaction.objectStore(STORE_WEB_API_LOGS);
      const request = store.add(logWithId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 获取任务日志（支持分页）
  async getTaskLogs(
    instanceId: string,
    options?: { limit?: number; offset?: number; reverse?: boolean }
  ): Promise<TaskLog[]> {
    if (!this.db) await this.init();

    const { limit = 100, offset = 0, reverse = false } = options || {};

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_TASK_LOGS], 'readonly');
      const store = transaction.objectStore(STORE_TASK_LOGS);
      const index = store.index('instanceId');
      const request = index.getAll(IDBKeyRange.only(instanceId));

      request.onsuccess = () => {
        let logs = request.result || [];
        // 按时间排序
        logs.sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        // 如果需要倒序
        if (reverse) logs.reverse();
        // 分页
        logs = logs.slice(offset, offset + limit);
        resolve(logs);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 获取 WebAPI 日志（支持分页）
  async getWebApiLogs(
    instanceId: string,
    options?: { limit?: number; offset?: number; reverse?: boolean }
  ): Promise<WebAPILog[]> {
    if (!this.db) await this.init();

    const { limit = 100, offset = 0, reverse = false } = options || {};

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_WEB_API_LOGS], 'readonly');
      const store = transaction.objectStore(STORE_WEB_API_LOGS);
      const index = store.index('instanceId');
      const request = index.getAll(IDBKeyRange.only(instanceId));

      request.onsuccess = () => {
        let logs = request.result || [];
        // 按时间排序
        logs.sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        // 如果需要倒序
        if (reverse) logs.reverse();
        // 分页
        logs = logs.slice(offset, offset + limit);
        resolve(logs);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 获取日志总数
  async getLogCount(instanceId: string): Promise<{ taskLogs: number; webApiLogs: number }> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [STORE_TASK_LOGS, STORE_WEB_API_LOGS],
        'readonly'
      );

      const taskLogStore = transaction.objectStore(STORE_TASK_LOGS);
      const taskLogIndex = taskLogStore.index('instanceId');
      const taskLogCountRequest = taskLogIndex.count(IDBKeyRange.only(instanceId));

      const webApiLogStore = transaction.objectStore(STORE_WEB_API_LOGS);
      const webApiLogIndex = webApiLogStore.index('instanceId');
      const webApiLogCountRequest = webApiLogIndex.count(IDBKeyRange.only(instanceId));

      Promise.all([
        new Promise<number>((r) => { taskLogCountRequest.onsuccess = () => r(taskLogCountRequest.result || 0); }),
        new Promise<number>((r) => { webApiLogCountRequest.onsuccess = () => r(webApiLogCountRequest.result || 0); })
      ]).then(([taskCount, webApiCount]) => {
        resolve({ taskLogs: taskCount, webApiLogs: webApiCount });
      }).catch(reject);
    });
  }

  // 删除实例的所有日志
  async deleteInstanceLogs(instanceId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      // 获取所有要删除的日志 ID
      const transaction = this.db!.transaction(
        [STORE_TASK_LOGS, STORE_WEB_API_LOGS],
        'readwrite'
      );

      // 删除任务日志
      const taskLogStore = transaction.objectStore(STORE_TASK_LOGS);
      const taskLogIndex = taskLogStore.index('instanceId');
      const taskLogRequest = taskLogIndex.getAllKeys(IDBKeyRange.only(instanceId));

      taskLogRequest.onsuccess = () => {
        const keys = taskLogRequest.result || [];
        keys.forEach(key => taskLogStore.delete(key));
      };

      // 删除 WebAPI 日志
      const webApiLogStore = transaction.objectStore(STORE_WEB_API_LOGS);
      const webApiLogIndex = webApiLogStore.index('instanceId');
      const webApiLogRequest = webApiLogIndex.getAllKeys(IDBKeyRange.only(instanceId));

      webApiLogRequest.onsuccess = () => {
        const keys = webApiLogRequest.result || [];
        keys.forEach(key => webApiLogStore.delete(key));
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // 清空所有日志
  async clearAllLogs(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [STORE_TASK_LOGS, STORE_WEB_API_LOGS],
        'readwrite'
      );

      const taskLogStore = transaction.objectStore(STORE_TASK_LOGS);
      taskLogStore.clear();

      const webApiLogStore = transaction.objectStore(STORE_WEB_API_LOGS);
      webApiLogStore.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // 批量导入日志（用于数据恢复）
  async importLogs(
    instanceId: string,
    taskLogs: TaskLog[],
    webApiLogs: WebAPILog[]
  ): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [STORE_TASK_LOGS, STORE_WEB_API_LOGS],
        'readwrite'
      );

      const taskLogStore = transaction.objectStore(STORE_TASK_LOGS);
      taskLogs.forEach(log => {
        taskLogStore.put({ ...log, instanceId });
      });

      const webApiLogStore = transaction.objectStore(STORE_WEB_API_LOGS);
      webApiLogs.forEach(log => {
        webApiLogStore.put({ ...log, instanceId });
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // 导出实例的所有日志
  async exportInstanceLogs(instanceId: string): Promise<{ taskLogs: TaskLog[]; webApiLogs: WebAPILog[] }> {
    const [taskLogs, webApiLogs] = await Promise.all([
      this.getTaskLogs(instanceId, { limit: 10000 }),
      this.getWebApiLogs(instanceId, { limit: 10000 })
    ]);
    return { taskLogs, webApiLogs };
  }
}

// 导出单例
export const logStorage = new LogStorage();
