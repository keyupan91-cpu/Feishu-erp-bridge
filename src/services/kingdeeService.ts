import axios from 'axios';
import type { KingdeeConfig } from '../types';

// 金蝶API响应类型
interface KingdeeResponse {
  LoginResultType?: number;
  Result?: any;
  Exception?: string;
  [key: string]: any;
}

// 测试连接结果类型
export interface TestConnectionResult {
  success: boolean;
  statusCode: number;
  message: string;
  details?: any;
}

class KingdeeService {
  private username: string;
  private password: string;
  private baseUrl: string;  // 用户输入的金蝶服务器地址
  private acctId?: string;
  private dbId?: string;

  // Session 复用相关
  private isLoggedIn: boolean = false;
  private loginTime: number = 0;
  private readonly SESSION_TIMEOUT: number = 30 * 60 * 1000; // 30分钟 session 有效期

  constructor(config: KingdeeConfig) {
    // 保存用户输入的服务器地址
    this.baseUrl = config.loginParams.baseUrl || '';
    this.username = config.loginParams.username;
    this.password = config.loginParams.password;
    this.acctId = config.loginParams.acctId;
    this.dbId = config.loginParams.dbId;

    console.log('KingdeeService initialized with:', {
      baseUrl: this.baseUrl,
      username: this.username,
      acctId: this.acctId ? '***' : 'empty',
      dbId: this.dbId ? '***' : 'empty',
    });
  }

  // 检查 session 是否有效
  private isSessionValid(): boolean {
    if (!this.isLoggedIn) return false;
    const now = Date.now();
    const elapsed = now - this.loginTime;
    const isValid = elapsed < this.SESSION_TIMEOUT;
    console.log(`Session check: ${isValid ? 'valid' : 'expired'} (${Math.floor(elapsed / 1000)}s elapsed)`);
    return isValid;
  }

  // 标记登录成功
  private markLoggedIn(): void {
    this.isLoggedIn = true;
    this.loginTime = Date.now();
    console.log('Session marked as logged in at:', new Date(this.loginTime).toLocaleString());
  }

  // 清除 session
  private clearSession(): void {
    this.isLoggedIn = false;
    this.loginTime = 0;
    console.log('Session cleared');
  }

  // 获取登录状态
  getLoginStatus(): boolean {
    return this.isSessionValid();
  }

  // 登录金蝶系统
  async login(): Promise<boolean> {
    try {
      // 使用后端代理路由
      const url = '/K3Cloud/Kingdee.BOS.WebApi.ServicesStub.AuthService.ValidateUser.common.kdsvc';
      const acctId = this.acctId || this.dbId || '';

      // 构建请求体，包含 baseUrl 用于后端代理
      const payload = {
        baseUrl: this.baseUrl,  // 传递给后端代理
        acctID: acctId,
        username: this.username,
        password: this.password,
        lcid: 2052,
      };

      console.log('Logging in to Kingdee via proxy:', url);
      console.log('Login payload:', {
        baseUrl: this.baseUrl,
        acctID: acctId ? '***' : 'empty',
        username: this.username,
        password: this.password ? '***' : 'empty'
      });

      const response = await axios.post<KingdeeResponse>(url, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      });

      console.log('Login response:', response.data);

      // 检查是否是错误消息
      if (typeof response.data === 'string' && (response.data as string).startsWith('response_error')) {
        throw new Error(`金蝶服务器错误: ${response.data}`);
      }

      // 检查登录结果
      if (response.data.LoginResultType === 1) {
        console.log('金蝶登录成功');
        this.markLoggedIn(); // 标记 session 有效
        return true;
      } else {
        console.log('金蝶登录失败');
        this.clearSession(); // 清除 session
        return false;
      }
    } catch (error: any) {
      console.error('金蝶登录失败:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        throw new Error(`登录失败: ${error.response.data?.Exception || error.response.data?.error || error.message}`);
      }
      throw error;
    }
  }

  // 测试连接功能
  async testConnection(): Promise<TestConnectionResult> {
    try {
      // 尝试登录来测试连接
      const loginSuccess = await this.login();

      if (loginSuccess) {
        return {
          success: true,
          statusCode: 200,
          message: '金蝶连接测试成功，登录验证通过',
          details: {
            baseUrl: this.baseUrl,
            username: this.username,
          },
        };
      } else {
        return {
          success: false,
          statusCode: 401,
          message: '金蝶连接测试失败，登录验证未通过，请检查用户名、密码或账套ID',
        };
      }
    } catch (error: any) {
      console.error('金蝶连接测试失败:', error);

      let errorMessage = error.message;
      let statusCode = -1;

      if (error.response) {
        statusCode = error.response.status;
        errorMessage = error.response.data?.Exception || error.response.data?.msg || error.response.data?.error || error.message;
      } else if (error.request) {
        errorMessage = '网络错误，无法连接到金蝶服务器';
      }

      return {
        success: false,
        statusCode,
        message: `连接失败: ${errorMessage}`,
      };
    }
  }

  // 验证数据（不实际保存，只验证）
  async validateData(formId: string, data: any): Promise<any> {
    try {
      // 检查 session 是否有效，无效则重新登录
      if (!this.isSessionValid()) {
        console.log('Session invalid or expired, re-login required');
        const loginSuccess = await this.login();
        if (!loginSuccess) {
          throw new Error('金蝶登录失败，无法验证数据');
        }
      } else {
        console.log('Using existing session, skip login');
      }

      const url = '/K3Cloud/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.Save.common.kdsvc';

      // 构建验证用的payload，将ValidateFlag设为true进行验证
      const payload = {
        baseUrl: this.baseUrl,  // 传递给后端代理
        formid: formId,
        data: {
          ...data,
          ValidateFlag: 'true',
        },
      };

      console.log('Validating data to Kingdee:', url);
      console.log('Validate payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post<KingdeeResponse>(url, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      console.log('Validate response:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('验证数据失败:', error);
      if (error.response) {
        throw new Error(`验证失败: ${error.response.data?.Exception || error.response.data?.error || error.message}`);
      }
      throw error;
    }
  }

  // 保存数据到金蝶
  async saveData(formId: string, data: any): Promise<any> {
    try {
      // 检查 session 是否有效，无效则重新登录
      if (!this.isSessionValid()) {
        console.log('Session invalid or expired, re-login required');
        const loginSuccess = await this.login();
        if (!loginSuccess) {
          throw new Error('金蝶登录失败，无法保存数据');
        }
      } else {
        console.log('Using existing session, skip login');
      }

      const url = '/K3Cloud/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.Save.common.kdsvc';
      const payload = {
        baseUrl: this.baseUrl,  // 传递给后端代理
        formid: formId,
        data: data,
      };

      console.log('Saving data to Kingdee:', url);
      console.log('Save payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post<KingdeeResponse>(url, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      console.log('Save response:', response.data);

      // 检查是否有异常
      if (response.data.Exception) {
        const error = new Error(`保存失败: ${response.data.Exception}`);
        (error as any).responseData = response.data;
        throw error;
      }

      // 检查ResponseStatus中的错误
      if (response.data.Result?.ResponseStatus) {
        const status = response.data.Result.ResponseStatus;
        if (!status.IsSuccess && status.Errors && status.Errors.length > 0) {
          const errorMessages = status.Errors.map((e: any) => e.Message).join('; ');
          const error = new Error(`保存失败: ${errorMessages}`);
          (error as any).responseData = response.data;
          throw error;
        }
      }

      return response.data;
    } catch (error: any) {
      console.error('保存数据到金蝶失败:', error);
      if (error.response) {
        const errorData = error.response.data;
        const errorMessage = errorData?.Exception || errorData?.error || error.message;
        // 创建带有响应数据的错误对象
        const enhancedError = new Error(`保存失败: ${errorMessage}`);
        (enhancedError as any).responseData = errorData;
        throw enhancedError;
      }
      throw error;
    }
  }
}

export default KingdeeService;