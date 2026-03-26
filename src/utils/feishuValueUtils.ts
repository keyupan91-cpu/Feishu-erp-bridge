import type { FieldProcessType } from '../types';
import { FeishuFieldType, formatDate } from './fieldTypeUtils';

const EXTRA_FEISHU_FIELD_TYPE = {
  SINGLE_LINK: 18,
  LOOKUP: 19,
  DUPLEX_LINK: 21,
} as const;

type DateFormat = 'YYYY-MM-DD' | 'YYYY/MM/DD' | 'YYYYMMDD' | 'timestamp';

export interface FieldValueFormatOptions {
  processType?: FieldProcessType;
  sourceFieldType?: number;
  sourceUiType?: string;
  decimalPlaces?: number;
  dateFormat?: DateFormat;
  preserveNumberScale?: boolean;
}

export interface FeishuFieldPreviewValue {
  extractedValue: any;
  formattedValue: any;
  effectiveProcessType: FieldProcessType;
}

const EMPTY_TEXT = '';

function isPrimitive(value: any): boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function toText(value: any): string {
  if (value === null || value === undefined) {
    return EMPTY_TEXT;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function extractLabel(value: any): string {
  if (value === null || value === undefined) {
    return EMPTY_TEXT;
  }
  if (isPrimitive(value)) {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(extractLabel).filter(Boolean).join(',');
  }
  if (typeof value === 'object') {
    if (typeof value.text === 'string') {
      return value.text;
    }
    if (typeof value.name === 'string') {
      return value.name;
    }
    if (typeof value.label === 'string') {
      return value.label;
    }
    if (typeof value.id === 'string') {
      return value.id;
    }
    if (value.value !== undefined) {
      return extractLabel(value.value);
    }
  }
  return toText(value);
}

function extractRichTextArray(value: any[]): string | null {
  if (!value.length) {
    return EMPTY_TEXT;
  }
  const isRichText = value.every((item) => item && typeof item === 'object' && 'text' in item);
  if (!isRichText) {
    return null;
  }
  return value.map((item) => (item?.text ? String(item.text) : EMPTY_TEXT)).join('');
}

function extractArrayByComma(value: any[]): string {
  return value.map(extractLabel).filter(Boolean).join(',');
}

function extractAttachment(value: any): string {
  if (!Array.isArray(value)) {
    return toText(value);
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return toText(item);
      }
      if (typeof item.name === 'string') {
        return item.name;
      }
      if (typeof item.file_token === 'string') {
        return item.file_token;
      }
      return toText(item);
    })
    .filter(Boolean)
    .join(',');
}

function extractLocation(value: any): string {
  if (!value || typeof value !== 'object') {
    return toText(value);
  }
  if (typeof value.address === 'string') {
    return value.address;
  }
  if (typeof value.name === 'string') {
    return value.name;
  }
  const longitude = value.longitude ?? value.lng;
  const latitude = value.latitude ?? value.lat;
  if (longitude !== undefined && latitude !== undefined) {
    return `${longitude},${latitude}`;
  }
  return toText(value);
}

function normalizeBoolean(value: any): boolean | any {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return false;
    }
  }
  return value;
}

function normalizeTimestamp(value: any): number | null {
  if (value === null || value === undefined || value === EMPTY_TEXT) {
    return null;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null;
    }
    if (value < 10_000_000_000) {
      return value * 1000;
    }
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      return normalizeTimestamp(Number(trimmed));
    }
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (typeof value === 'object') {
    if (value.timestamp !== undefined) {
      return normalizeTimestamp(value.timestamp);
    }
    if (value.value !== undefined) {
      return normalizeTimestamp(value.value);
    }
  }

  return null;
}

function resolveAutoProcessType(sourceFieldType?: number, sourceUiType?: string, extractedValue?: any): FieldProcessType {
  if (sourceUiType) {
    switch (sourceUiType) {
      case 'DateTime':
      case 'CreatedTime':
      case 'ModifiedTime':
        return 'datetime';
      case 'SingleSelect':
        return 'select';
      case 'MultiSelect':
        return 'multiselect';
      case 'User':
      case 'GroupChat':
      case 'CreatedUser':
      case 'ModifiedUser':
        return 'person';
      case 'Checkbox':
        return 'checkbox';
      case 'Currency':
      case 'Progress':
      case 'Rating':
        return 'number';
      default:
        break;
    }
  }

  switch (sourceFieldType) {
    case FeishuFieldType.NUMBER:
      return 'number';
    case FeishuFieldType.DATE:
    case FeishuFieldType.CREATED_TIME:
    case FeishuFieldType.MODIFIED_TIME:
      return 'datetime';
    case FeishuFieldType.SINGLE_SELECT:
      return 'select';
    case FeishuFieldType.MULTI_SELECT:
      return 'multiselect';
    case FeishuFieldType.CHECKBOX:
      return 'checkbox';
    case FeishuFieldType.PERSON:
    case FeishuFieldType.GROUP_CHAT:
    case FeishuFieldType.CREATED_USER:
    case FeishuFieldType.MODIFIED_USER:
      return 'person';
    case FeishuFieldType.PHONE:
      return 'phone';
    case FeishuFieldType.FORMULA:
      return typeof extractedValue === 'number' ? 'number' : 'text';
    default:
      return 'text';
  }
}

export function extractFeishuFieldValue(rawValue: any, sourceFieldType?: number): any {
  if (rawValue === null || rawValue === undefined) {
    return EMPTY_TEXT;
  }

  if (isPrimitive(rawValue)) {
    return rawValue;
  }

  if (Array.isArray(rawValue)) {
    const richTextValue = extractRichTextArray(rawValue);
    if (richTextValue !== null) {
      return richTextValue;
    }

    if (
      sourceFieldType === FeishuFieldType.MULTI_SELECT ||
      sourceFieldType === FeishuFieldType.PERSON ||
      sourceFieldType === FeishuFieldType.GROUP_CHAT ||
      sourceFieldType === EXTRA_FEISHU_FIELD_TYPE.SINGLE_LINK ||
      sourceFieldType === EXTRA_FEISHU_FIELD_TYPE.DUPLEX_LINK ||
      sourceFieldType === EXTRA_FEISHU_FIELD_TYPE.LOOKUP
    ) {
      return extractArrayByComma(rawValue);
    }

    return rawValue.map(extractLabel).filter(Boolean).join(',');
  }

  if (typeof rawValue === 'object') {
    if (sourceFieldType === FeishuFieldType.CHECKBOX) {
      return normalizeBoolean(rawValue);
    }

    if (sourceFieldType === FeishuFieldType.ATTACHMENT) {
      return extractAttachment(rawValue);
    }

    if (sourceFieldType === FeishuFieldType.LOCATION) {
      return extractLocation(rawValue);
    }

    if (rawValue.text !== undefined) {
      return rawValue.text;
    }

    if (rawValue.name !== undefined) {
      return rawValue.name;
    }

    if (rawValue.value !== undefined) {
      return extractFeishuFieldValue(rawValue.value, sourceFieldType);
    }

    return toText(rawValue);
  }

  return rawValue;
}

function formatAsNumber(
  value: any,
  decimalPlaces?: number,
  shouldRound: boolean = true,
  preserveScale: boolean = false
): any {
  if (value === null || value === undefined || value === EMPTY_TEXT) {
    return EMPTY_TEXT;
  }
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return value;
  }
  if (!shouldRound) {
    return numericValue;
  }
  const fixedDigits = decimalPlaces ?? 2;
  if (preserveScale) {
    return numericValue.toFixed(fixedDigits);
  }
  return Number(numericValue.toFixed(fixedDigits));
}

function formatAsTimestamp(value: any): string {
  const timestamp = normalizeTimestamp(value);
  if (timestamp === null) {
    return toText(value);
  }
  return String(timestamp);
}

function formatByProcessType(
  extractedValue: any,
  processType: FieldProcessType,
  options: FieldValueFormatOptions,
  shouldRoundNumber: boolean
): any {
  switch (processType) {
    case 'number':
      return formatAsNumber(
        extractedValue,
        options.decimalPlaces,
        shouldRoundNumber,
        options.preserveNumberScale === true
      );

    case 'date':
    case 'datetime': {
      const dateValue = normalizeTimestamp(extractedValue);
      return formatDate(dateValue ?? extractedValue, options.dateFormat || 'YYYY-MM-DD');
    }

    case 'timestamp':
      return formatAsTimestamp(extractedValue);

    case 'multiselect':
    case 'person':
      if (Array.isArray(extractedValue)) {
        return extractedValue.map(extractLabel).filter(Boolean).join(',');
      }
      return toText(extractedValue);

    case 'checkbox':
      return normalizeBoolean(extractedValue);

    case 'text':
    case 'select':
    case 'phone':
    case 'auto':
    default:
      return extractedValue;
  }
}

export function buildFeishuFieldPreview(rawValue: any, options: FieldValueFormatOptions): FeishuFieldPreviewValue {
  const processType = options.processType || 'auto';
  const extractedValue = extractFeishuFieldValue(rawValue, options.sourceFieldType);
  const effectiveProcessType =
    processType === 'auto'
      ? resolveAutoProcessType(options.sourceFieldType, options.sourceUiType, extractedValue)
      : processType;
  const shouldRoundNumber = processType === 'number';
  const formattedValue = formatByProcessType(extractedValue, effectiveProcessType, options, shouldRoundNumber);

  return {
    extractedValue,
    formattedValue,
    effectiveProcessType,
  };
}

export function formatFeishuFieldValue(rawValue: any, options: FieldValueFormatOptions): any {
  return buildFeishuFieldPreview(rawValue, options).formattedValue;
}
