// 本地文件存储服务 - 替代 localStorage
// 使用 IndexedDB 存储数据，支持大容量和结构化存储

import type { TaskConfig, TaskInstance } from '../types';

// 账户信息
export interface Account {
  id: string;
  username: string;
  passwordHash: string; // 简单哈希，实际应用需要更强的加密
  createdAt: string;
  lastLoginAt: string;
}

// 账户数据
export interface AccountData {
  account: Account;
  tasks: TaskConfig[];
  taskInstances: TaskInstance[];
  lastModified: string;
}

// 数据库配置
const DB_NAME = 'KingdeeSyncDB';
const DB_VERSION = 2; // 升级版本号，强制重新创建数据库
const STORE_ACCOUNTS = 'accounts';
const STORE_DATA = 'accountData';

class LocalFileStorage {
  private db: IDBDatabase | null = null;

  // 初始化数据库
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 账户存储
        if (!db.objectStoreNames.contains(STORE_ACCOUNTS)) {
          const accountStore = db.createObjectStore(STORE_ACCOUNTS, { keyPath: 'username' });
          accountStore.createIndex('id', 'id', { unique: true });
        }

        // 数据存储
        if (!db.objectStoreNames.contains(STORE_DATA)) {
          const dataStore = db.createObjectStore(STORE_DATA, { keyPath: 'accountId' });
          dataStore.createIndex('username', 'account.username', { unique: false });
        }
      };
    });
  }

  // 简单的密码哈希（实际应用应该使用更强的算法）
  private hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  // 注册账户
  async registerAccount(username: string, password: string): Promise<Account> {
    if (!this.db) await this.init();

    // 检查用户名是否已存在
    const existingAccount = await this.getAccount(username);
    if (existingAccount) {
      throw new Error('用户名已存在');
    }

    const account: Account = {
      id: Date.now().toString(),
      username,
      passwordHash: this.hashPassword(password),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_ACCOUNTS], 'readwrite');
      const store = transaction.objectStore(STORE_ACCOUNTS);
      const request = store.add(account);

      request.onsuccess = () => resolve(account);
      request.onerror = () => reject(request.error);
    });
  }

  // 获取账户
  async getAccount(username: string): Promise<Account | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_ACCOUNTS], 'readonly');
      const store = transaction.objectStore(STORE_ACCOUNTS);
      const request = store.get(username);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // 验证登录
  async validateLogin(username: string, password: string): Promise<Account | null> {
    const account = await this.getAccount(username);
    if (!account) return null;

    const passwordHash = this.hashPassword(password);
    if (account.passwordHash !== passwordHash) return null;

    // 更新最后登录时间
    account.lastLoginAt = new Date().toISOString();
    await this.updateAccount(account);

    return account;
  }

  // 更新账户
  async updateAccount(account: Account): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_ACCOUNTS], 'readwrite');
      const store = transaction.objectStore(STORE_ACCOUNTS);
      const request = store.put(account);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 保存账户数据
  async saveAccountData(accountId: string, data: Omit<AccountData, 'account'>): Promise<void> {
    if (!this.db) await this.init();

    const account = await this.getAccountById(accountId);
    if (!account) throw new Error('账户不存在');

    const accountData: AccountData = {
      account,
      ...data,
      lastModified: new Date().toISOString(),
    };
    
    // 添加 accountId 字段用于 IndexedDB 主键
    (accountData as any).accountId = accountId;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_DATA], 'readwrite');
      const store = transaction.objectStore(STORE_DATA);
      const request = store.put(accountData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 获取账户数据
  async getAccountData(accountId: string): Promise<AccountData | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_DATA], 'readonly');
      const store = transaction.objectStore(STORE_DATA);
      const request = store.get(accountId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // 通过ID获取账户
  private async getAccountById(accountId: string): Promise<Account | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_ACCOUNTS], 'readonly');
      const store = transaction.objectStore(STORE_ACCOUNTS);
      const index = store.index('id');
      const request = index.get(accountId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // 导出账户数据为JSON文件
  async exportToFile(accountId: string): Promise<void> {
    const data = await this.getAccountData(accountId);
    if (!data) throw new Error('没有数据可导出');

    const exportData = {
      version: '2.0',
      exportTime: new Date().toISOString(),
      account: {
        username: data.account.username,
        createdAt: data.account.createdAt,
      },
      tasks: data.tasks,
      taskInstances: data.taskInstances,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `金蝶数据传输平台_${data.account.username}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // 从JSON文件导入数据
  async importFromFile(file: File, username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          
          // 验证数据格式
          if (!data.tasks || !Array.isArray(data.tasks)) {
            throw new Error('无效的数据格式');
          }

          // 获取账户
          const account = await this.getAccount(username);
          if (!account) {
            throw new Error('账户不存在');
          }

          // 保存导入的数据
          await this.saveAccountData(account.id, {
            tasks: data.tasks,
            taskInstances: data.taskInstances || [],
            lastModified: new Date().toISOString(),
          });

          resolve();
        } catch (error: any) {
          reject(new Error(`导入失败: ${error.message}`));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }

  // 删除账户及其所有数据
  async deleteAccount(username: string): Promise<void> {
    if (!this.db) await this.init();

    const account = await this.getAccount(username);
    if (!account) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_ACCOUNTS, STORE_DATA], 'readwrite');
      
      // 删除账户
      const accountStore = transaction.objectStore(STORE_ACCOUNTS);
      accountStore.delete(username);

      // 删除账户数据
      const dataStore = transaction.objectStore(STORE_DATA);
      dataStore.delete(account.id);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// 导出单例
export const localFileStorage = new LocalFileStorage();
