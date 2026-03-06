// 企业级账户管理服务
import axios from 'axios';
import { getAuthToken } from './apiService';

const API_BASE_URL = '/api';

// 账户信息类型
export interface EnterpriseAccount {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  department?: string;
  role: 'admin' | 'operator' | 'viewer';
  status: 'active' | 'inactive' | 'locked';
  createdAt: string;
  lastLoginAt?: string;
  createdBy?: string;
}

// 操作日志类型
export interface OperationLog {
  id: string;
  accountId: string;
  username: string;
  action: string;
  module: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// 登录历史类型
export interface LoginHistory {
  id: string;
  accountId: string;
  username: string;
  loginTime: string;
  logoutTime?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failed';
  failReason?: string;
}

// 账户管理服务
export const accountManagementApi = {
  // 获取所有账户列表（仅管理员）
  getAccounts: async () => {
    const token = getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/admin/accounts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  // 创建账户
  createAccount: async (data: {
    username: string;
    password: string;
    email?: string;
    phone?: string;
    department?: string;
    role?: 'admin' | 'operator' | 'viewer';
  }) => {
    const token = getAuthToken();
    const response = await axios.post(`${API_BASE_URL}/admin/accounts`, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  // 更新账户信息
  updateAccount: async (accountId: string, data: Partial<EnterpriseAccount>) => {
    const token = getAuthToken();
    const response = await axios.put(`${API_BASE_URL}/admin/accounts/${accountId}`, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  // 删除账户
  deleteAccount: async (accountId: string) => {
    const token = getAuthToken();
    const response = await axios.delete(`${API_BASE_URL}/admin/accounts/${accountId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  // 重置密码
  resetPassword: async (accountId: string, newPassword: string) => {
    const token = getAuthToken();
    const response = await axios.post(`${API_BASE_URL}/admin/accounts/${accountId}/reset-password`, {
      password: newPassword,
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  // 锁定/解锁账户
  toggleAccountLock: async (accountId: string, lock: boolean) => {
    const token = getAuthToken();
    const response = await axios.post(`${API_BASE_URL}/admin/accounts/${accountId}/toggle-lock`, {
      lock,
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  // 获取操作日志
  getOperationLogs: async (accountId?: string, module?: string) => {
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (accountId) params.append('accountId', accountId);
    if (module) params.append('module', module);

    const response = await axios.get(`${API_BASE_URL}/admin/operation-logs?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  // 获取登录历史
  getLoginHistory: async (accountId?: string) => {
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (accountId) params.append('accountId', accountId);

    const response = await axios.get(`${API_BASE_URL}/admin/login-history?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },
};

// 账户个人服务
export const accountProfileApi = {
  // 获取当前账户信息
  getProfile: async () => {
    const token = getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/account/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  // 更新个人信息
  updateProfile: async (data: {
    email?: string;
    phone?: string;
    department?: string;
  }) => {
    const token = getAuthToken();
    const response = await axios.put(`${API_BASE_URL}/account/profile`, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  // 修改密码
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const token = getAuthToken();
    const response = await axios.post(`${API_BASE_URL}/account/change-password`, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },
};
