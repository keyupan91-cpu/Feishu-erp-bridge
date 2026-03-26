/**
 * 飞书多维表格字段类型编码
 * @see https://open.feishu.cn/document/ukTMukTMukTM/uETN04SM5QjL1ITM
 */
export const FeishuFieldType = {
  TEXT: 1,         // 文本（单行/多行）
  NUMBER: 2,       // 数字
  SINGLE_SELECT: 3, // 单选
  MULTI_SELECT: 4,  // 多选
  DATE: 5,         // 日期
  CHECKBOX: 7,     // 复选框
  PERSON: 11,      // 人员
  PHONE: 13,       // 电话
  LINK: 15,        // 超链接
  ATTACHMENT: 17,  // 附件
  FORMULA: 20,     // 公式
  LOCATION: 22,    // 地理位置
  GROUP_CHAT: 23,  // 群组
  CREATED_TIME: 1001,   // 创建时间
  MODIFIED_TIME: 1002,  // 最后修改时间
  CREATED_USER: 1003,   // 创建人
  MODIFIED_USER: 1004,  // 最后修改人
  AUTO_NUMBER: 1005,    // 自动编号
} as const;

// 字段类型编码 -> 默认处理类型映射
export const FieldTypeToProcessType: Record<number, import('../types').FieldProcessType> = {
  [FeishuFieldType.TEXT]: 'text',
  [FeishuFieldType.NUMBER]: 'number',
  [FeishuFieldType.SINGLE_SELECT]: 'select',
  [FeishuFieldType.MULTI_SELECT]: 'multiselect',
  [FeishuFieldType.DATE]: 'date',
  [FeishuFieldType.CHECKBOX]: 'checkbox',
  [FeishuFieldType.PERSON]: 'person',
  [FeishuFieldType.PHONE]: 'phone',
  [FeishuFieldType.LINK]: 'text',
  [FeishuFieldType.ATTACHMENT]: 'text',
  [FeishuFieldType.FORMULA]: 'auto',
  [FeishuFieldType.LOCATION]: 'text',
  [FeishuFieldType.GROUP_CHAT]: 'text',
  [FeishuFieldType.CREATED_TIME]: 'datetime',
  [FeishuFieldType.MODIFIED_TIME]: 'datetime',
  [FeishuFieldType.CREATED_USER]: 'person',
  [FeishuFieldType.MODIFIED_USER]: 'person',
  [FeishuFieldType.AUTO_NUMBER]: 'text',
};

// 字段类型编码 -> 中文名称映射
export const FieldTypeNames: Record<number, string> = {
  [FeishuFieldType.TEXT]: '文本',
  [FeishuFieldType.NUMBER]: '数字',
  [FeishuFieldType.SINGLE_SELECT]: '单选',
  [FeishuFieldType.MULTI_SELECT]: '多选',
  [FeishuFieldType.DATE]: '日期',
  [FeishuFieldType.CHECKBOX]: '复选框',
  [FeishuFieldType.PERSON]: '人员',
  [FeishuFieldType.PHONE]: '电话',
  [FeishuFieldType.LINK]: '超链接',
  [FeishuFieldType.ATTACHMENT]: '附件',
  [FeishuFieldType.FORMULA]: '公式',
  [FeishuFieldType.LOCATION]: '地理位置',
  [FeishuFieldType.GROUP_CHAT]: '群组',
  [FeishuFieldType.CREATED_TIME]: '创建时间',
  [FeishuFieldType.MODIFIED_TIME]: '最后修改时间',
  [FeishuFieldType.CREATED_USER]: '创建人',
  [FeishuFieldType.MODIFIED_USER]: '最后修改人',
  [FeishuFieldType.AUTO_NUMBER]: '自动编号',
};

/**
 * 根据飞书字段类型编码获取默认处理类型
 */
export function getDefaultProcessType(fieldType?: number): import('../types').FieldProcessType {
  if (fieldType === undefined || fieldType === null) {
    return 'auto';
  }
  return FieldTypeToProcessType[fieldType] || 'auto';
}

/**
 * 根据飞书字段类型编码获取中文名称
 */
export function getFieldTypeName(fieldType?: number): string {
  if (fieldType === undefined || fieldType === null) {
    return 'δ֪';
  }
  return FieldTypeNames[fieldType] || `δ֪ (${fieldType})`;
}

/**
 * 格式化日期值
 */
export function formatDate(value: any, format: 'YYYY-MM-DD' | 'YYYY/MM/DD' | 'YYYYMMDD' | 'timestamp'): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  let timestamp: number;

  // 如果已经是时间戳
  if (typeof value === 'number') {
    timestamp = value;
  } else if (typeof value === 'string') {
    // 尝试解析字符串
    const parsed = Date.parse(value);
    if (isNaN(parsed)) {
      return value; // 无法解析，返回原始值
    }
    timestamp = parsed;
  } else {
    return String(value);
  }

  // 根据格式返回
  if (format === 'timestamp') {
    return String(timestamp);
  }

  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`;
    case 'YYYYMMDD':
      return `${year}${month}${day}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * 提取人员/多选字段的文本值（逗号分隔）
 */
export function extractTextValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  // 如果是数组
  if (Array.isArray(value)) {
    const texts = value.map(item => {
      if (typeof item === 'string') {
        return item;
      }
      if (item && typeof item === 'object') {
        return item.text || item.name || String(item);
      }
      return String(item);
    });
    return texts.filter(t => t).join(',');
  }

  // 如果是对象（有 value 数组）
  if (typeof value === 'object' && value.value && Array.isArray(value.value)) {
    return extractTextValue(value.value);
  }

  // 如果是对象（有 text 字段）
  if (typeof value === 'object' && value.text) {
    return value.text;
  }

  return String(value);
}
