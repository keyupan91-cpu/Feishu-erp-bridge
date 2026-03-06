import axios from 'axios';
import type { FeishuConfig, FeishuFieldParam, FilterCondition } from '../types';

// 飞书API响应类型
interface FeishuResponse {
  code: number;
  msg: string;
  data?: any;
  tenant_access_token?: string;
}

// 测试连接结果类型
export interface TestConnectionResult {
  success: boolean;
  recordCount: number;
  statusCode: number;
  message: string;
  details?: any;
}

class FeishuService {
  private appId: string;
  private appSecret: string;
  private appToken: string;
  private accessToken: string | null = null;
  private baseURL: string;

  constructor(config: FeishuConfig) {
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.appToken = config.appToken;
    // 在开发环境下使用相对路径，让Vite代理处理请求
    this.baseURL = '';
    
    console.log('FeishuService initialized with:', {
      appId: this.appId,
      appSecret: this.appSecret ? '***' : 'empty',
      appToken: this.appToken,
    });
  }

  // 获取飞书访问令牌
  async getToken(): Promise<string> {
    try {
      const url = `${this.baseURL}/open-apis/auth/v3/tenant_access_token/internal`;
      const payload = {
        app_id: this.appId,
        app_secret: this.appSecret,
      };
      
      console.log('Requesting token from:', url);
      console.log('Payload:', { app_id: this.appId, app_secret: this.appSecret ? '***' : 'empty' });
      
      const response = await axios.post<FeishuResponse>(url, payload, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });

      console.log('Token response:', response.data);

      if (response.data.code === 0) {
        this.accessToken = response.data.tenant_access_token || null;
        return this.accessToken || '';
      } else {
        throw new Error(`获取飞书令牌失败: ${response.data.msg} (code: ${response.data.code})`);
      }
    } catch (error: any) {
      console.error('获取飞书访问令牌失败:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error config:', error.config);
      if (error.response) {
        throw new Error(`获取飞书令牌失败: ${error.response.data?.msg || error.message} (status: ${error.response.status})`);
      }
      throw error;
    }
  }

  // 测试连接功能
  async testConnection(tableId: string, viewId?: string, filterConditions?: FilterCondition[]): Promise<TestConnectionResult> {
    try {
      // 1. 获取访问令牌
      await this.getToken();

      // 2. 构建查询参数 - 不指定field_names获取所有字段
      const requestBody: any = {};

      // 添加视图ID（如果提供）
      if (viewId) {
        requestBody.view_id = viewId;
      }

      // 添加筛选条件（如果提供）
      let needsClientFilter = false;
      if (filterConditions && filterConditions.length > 0) {
        const { filter, needsClientFilter: needsFilter } = this.buildFilter(filterConditions);
        if (filter) {
          requestBody.filter = filter;
        }
        needsClientFilter = needsFilter;
      }

      console.log('Search request body:', requestBody);
      console.log('Needs client filter:', needsClientFilter);

      // 3. 查询记录
      const url = `${this.baseURL}/open-apis/bitable/v1/apps/${this.appToken}/tables/${tableId}/records/search`;
      console.log('Search URL:', url);
      
      let allItems: any[] = [];
      let pageToken: string | undefined = undefined;
      
      // 如果需要在客户端过滤，需要获取所有数据
      const pageSize = needsClientFilter ? 500 : 1;
      
      while (true) {
        const searchResponse: { data: FeishuResponse } = await axios.post<FeishuResponse>(
          url,
          requestBody,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json; charset=utf-8',
            },
            params: {
              page_size: pageSize,
              page_token: pageToken,
            },
          }
        );

        console.log('Search response:', searchResponse.data);

        if (searchResponse.data.code === 0) {
          const items = searchResponse.data.data?.items || [];
          allItems = allItems.concat(items);
          pageToken = searchResponse.data.data?.page_token;
          
          // 如果不需要客户端过滤，只查询一页即可
          if (!needsClientFilter) {
            break;
          }
        } else {
          throw new Error(`查询失败: ${searchResponse.data.msg} (code: ${searchResponse.data.code})`);
        }
        
        if (!pageToken) break;
      }

      console.log('Total items fetched:', allItems.length);

      // 4. 处理响应
      let items = allItems;
      
      // 如果需要在客户端过滤（如isEmpty/isNotEmpty）
      if (needsClientFilter && filterConditions) {
        items = this.clientFilter(items, filterConditions);
        console.log('After client filter, items count:', items.length);
      }
      
      const total = items.length;

      return {
        success: true,
        recordCount: total,
        statusCode: 0,
        message: `连接成功，共查询到 ${total} 条记录`,
        details: {
          hasMore: false,
          pageToken: undefined,
        },
      };
    } catch (error: any) {
      console.error('飞书连接测试失败:', error);

      let errorMessage = error.message;
      let statusCode = -1;

      if (error.response) {
        // 服务器返回了错误响应
        statusCode = error.response.status;
        errorMessage = error.response.data?.msg || error.response.data?.error || error.message;
      } else if (error.request) {
        // 请求已发送但没有收到响应
        errorMessage = '网络错误，无法连接到飞书服务器';
      }

      return {
        success: false,
        recordCount: 0,
        statusCode,
        message: `连接失败: ${errorMessage}`,
      };
    }
  }

  // 构建筛选条件
  private buildFilter(conditions: FilterCondition[]): { filter: any | null, needsClientFilter: boolean } {
    // 过滤掉不支持的条件（如isEmpty/isNotEmpty）
    const apiConditions = conditions
      .map(condition => this.buildSingleCondition(condition))
      .filter(condition => condition !== null);
    
    // 检查是否有需要在客户端过滤的条件
    const needsClientFilter = conditions.some(
      c => c.operator === 'isEmpty' || c.operator === 'isNotEmpty'
    );
    
    // 如果没有API支持的条件，返回null
    if (apiConditions.length === 0) {
      return { filter: null, needsClientFilter };
    }
    
    // 飞书API要求filter必须包含conjunction和conditions
    const filter = {
      conjunction: 'and',
      conditions: apiConditions,
    };
    console.log('Built filter:', JSON.stringify(filter, null, 2));
    console.log('Needs client filter:', needsClientFilter);
    return { filter, needsClientFilter };
  }

  // 构建单个筛选条件
  private buildSingleCondition(condition: FilterCondition): any {
    const result: any = {
      field_name: condition.fieldName,
    };

    // 根据操作符类型构建不同的条件
    // 注意：isEmpty 和 isNotEmpty 在飞书API中可能不支持，需要在代码中过滤
    switch (condition.operator) {
      case 'isEmpty':
        // 为空：飞书API不支持，返回null表示需要在代码中过滤
        return null;
      case 'isNotEmpty':
        // 不为空：飞书API不支持，返回null表示需要在代码中过滤
        return null;
      case 'eq':
        result.operator = 'is';
        result.value = condition.value ? [condition.value] : [];
        break;
      case 'ne':
        result.operator = 'isNot';
        result.value = condition.value ? [condition.value] : [];
        break;
      case 'contains':
        result.operator = 'contains';
        result.value = condition.value ? [condition.value] : [];
        break;
      case 'notContains':
        result.operator = 'doesNotContain';
        result.value = condition.value ? [condition.value] : [];
        break;
      default:
        result.operator = 'is';
        result.value = condition.value ? [condition.value] : [];
    }
    
    console.log(`Built condition for ${condition.fieldName}:`, result);

    return result;
  }

  // 提取飞书字段的实际值（处理多行文本等复杂类型）
  private extractFieldValue(fieldValue: any): string {
    if (fieldValue === null || fieldValue === undefined) {
      return '';
    }
    
    // 如果是数组（如多行文本 [{text: '...', type: 'text'}]）
    if (Array.isArray(fieldValue)) {
      // 提取所有 text 值并拼接
      return fieldValue.map(item => {
        if (typeof item === 'object' && item.text) {
          return item.text;
        }
        return String(item);
      }).join('');
    }
    
    // 如果是对象，尝试提取 text 或 value 属性
    if (typeof fieldValue === 'object') {
      if (fieldValue.text) {
        return String(fieldValue.text);
      }
      if (fieldValue.value) {
        return String(fieldValue.value);
      }
      return JSON.stringify(fieldValue);
    }
    
    return String(fieldValue);
  }

  // 客户端过滤（用于isEmpty/isNotEmpty等API不支持的筛选条件，以及API过滤后的二次确认）
  private clientFilter(items: any[], filterConditions: FilterCondition[]): any[] {
    console.log('开始客户端过滤，记录数:', items.length);
    console.log('过滤条件:', JSON.stringify(filterConditions, null, 2));
    
    const result = items.filter(item => {
      const fields = item.fields || item;
      
      for (const condition of filterConditions) {
        const rawFieldValue = fields[condition.fieldName];
        const fieldValue = this.extractFieldValue(rawFieldValue);
        const expectedValue = condition.value || '';
        
        switch (condition.operator) {
          case 'isEmpty':
            // 为空：字段值为空、null、undefined或空字符串
            const isEmpty = fieldValue === '';
            console.log(`检查 isEmpty: ${condition.fieldName} = "${fieldValue}", isEmpty = ${isEmpty}`);
            if (!isEmpty) {
              return false;
            }
            break;
          case 'isNotEmpty':
            // 不为空：字段值有内容
            const isNotEmpty = fieldValue !== '';
            console.log(`检查 isNotEmpty: ${condition.fieldName} = "${fieldValue}", isNotEmpty = ${isNotEmpty}`);
            if (!isNotEmpty) {
              return false;
            }
            break;
          case 'eq':
            // 等于
            const isEqual = fieldValue === expectedValue;
            console.log(`检查 eq: ${condition.fieldName} = "${fieldValue}", 期望 = "${expectedValue}", 匹配 = ${isEqual}`);
            if (!isEqual) {
              return false;
            }
            break;
          case 'ne':
            // 不等于
            if (fieldValue === expectedValue) {
              return false;
            }
            break;
          case 'contains':
            // 包含
            if (!fieldValue.includes(expectedValue)) {
              return false;
            }
            break;
          case 'notContains':
            // 不包含
            if (fieldValue.includes(expectedValue)) {
              return false;
            }
            break;
        }
      }
      
      return true;
    });
    
    console.log('客户端过滤完成，结果数:', result.length);
    return result;
  }

  // 获取表格数据
  async getTableData(tableId: string, viewId?: string, filterConditions?: FilterCondition[], fieldNames?: string[]) {
    try {
      if (!this.accessToken) {
        await this.getToken();
      }

      const requestBody: any = {};
      
      // 只有在指定了具体字段名时才添加field_names
      if (fieldNames && fieldNames.length > 0) {
        requestBody.field_names = fieldNames;
      }

      if (viewId) {
        requestBody.view_id = viewId;
      }

      // 添加筛选条件
      let needsClientFilter = false;
      if (filterConditions && filterConditions.length > 0) {
        const { filter, needsClientFilter: needsFilter } = this.buildFilter(filterConditions);
        if (filter) {
          requestBody.filter = filter;
        }
        needsClientFilter = needsFilter;
      }

      // 如果需要在客户端过滤，需要获取所有数据
      let allItems: any[] = [];
      let pageToken: string | undefined = undefined;
      
      while (true) {
        const tableResponse: { data: FeishuResponse } = await axios.post<FeishuResponse>(
          `${this.baseURL}/open-apis/bitable/v1/apps/${this.appToken}/tables/${tableId}/records/search`,
          requestBody,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json; charset=utf-8',
            },
            params: {
              page_size: 500,
              page_token: pageToken,
            },
          }
        );

        if (tableResponse.data.code === 0) {
          const items = tableResponse.data.data?.items || [];
          allItems = allItems.concat(items);
          pageToken = tableResponse.data.data?.page_token;
          
          // 如果不需要客户端过滤且已经获取到数据，直接返回
          if (!needsClientFilter && allItems.length > 0) {
            // 继续获取剩余数据
            if (!pageToken) break;
          }
        } else {
          throw new Error(`获取数据失败: ${tableResponse.data.msg} (code: ${tableResponse.data.code})`);
        }
        
        if (!pageToken) break;
      }

      // 构建返回结果
      const result: FeishuResponse = {
        code: 0,
        msg: 'success',
        data: {
          items: allItems,
          total: allItems.length,
          has_more: false,
        },
      };

      // 如果需要在客户端过滤（如isEmpty/isNotEmpty）
      if (needsClientFilter && filterConditions) {
        console.log('客户端过滤前记录数:', allItems.length);
        console.log('客户端过滤条件:', filterConditions);
        result.data.items = this.clientFilter(allItems, filterConditions);
        result.data.total = result.data.items.length;
        console.log('客户端过滤后记录数:', result.data.items.length);
      }

      return result;
    } catch (error: any) {
      console.error('获取飞书表格数据失败:', error);
      if (error.response) {
        throw new Error(`获取数据失败: ${error.response.data?.msg || error.message} (status: ${error.response.status})`);
      }
      throw error;
    }
  }

  // 格式化字段数据
  formatFieldData(data: any, fieldParams: FeishuFieldParam[]) {
    const formattedData: Record<string, any> = {};

    fieldParams.forEach(param => {
      const fieldValue = data[param.fieldName];
      if (fieldValue !== undefined) {
        if (param.decimalPlaces !== undefined && typeof fieldValue === 'number') {
          formattedData[param.variableName] = Number(fieldValue.toFixed(param.decimalPlaces));
        } else {
          formattedData[param.variableName] = fieldValue;
        }
      }
    });

    return formattedData;
  }

  // 回写数据到飞书
  async writeBackData(tableId: string, recordId: string, data: Record<string, any>) {
    try {
      if (!this.accessToken) {
        await this.getToken();
      }

      console.log('飞书回写请求:', {
        url: `${this.baseURL}/open-apis/bitable/v1/apps/${this.appToken}/tables/${tableId}/records/${recordId}`,
        tableId,
        recordId,
        data,
      });

      const response = await axios.put<FeishuResponse>(
        `${this.baseURL}/open-apis/bitable/v1/apps/${this.appToken}/tables/${tableId}/records/${recordId}`,
        {
          fields: data,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );

      console.log('飞书回写响应:', response.data);

      if (response.data.code === 0) {
        return response.data;
      } else {
        throw new Error(`回写数据失败: ${response.data.msg} (code: ${response.data.code})`);
      }
    } catch (error: any) {
      console.error('回写数据到飞书失败:', error);
      console.error('错误详情:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      if (error.response) {
        throw new Error(`回写数据失败: ${error.response.data?.msg || error.message} (status: ${error.response.status})`);
      }
      throw error;
    }
  }
}

export default FeishuService;
