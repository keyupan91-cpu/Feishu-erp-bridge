// 初始化默认账户和数据
import { localFileStorage } from './localFileStorage';
import type { Account } from './localFileStorage';
import type { TaskConfig, TaskInstance } from '../types';

// 默认账户信息
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = '123456';

// 默认数据（从备份文件导入）
const defaultData = {
  tasks: [
    {
      name: "付款单",
      description: "",
      feishuConfig: {
        appToken: "YiFubTwajaRZ1GsTnnocXLesn7g",

        tableId: "tblKN6XjXbh61fHy",
        fieldParams: [
          {
            id: "1772556784229",
            variableName: "A",
            fieldName: "年月",
            decimalPlaces: 2
          }
        ],
        appId: "cli_a9a3c20f1178dcc1",
        appSecret: "HZOqHVAZ7gLxgQLvDjpZOxIt36zNW85p",
        viewId: "",
        filterConditions: [
          {
            fieldName: "收付款单据编号",
            operator: "isEmpty",
            value: ""
          },
          {
            fieldName: "公司主体",
            operator: "eq",
            value: "深圳市青年力量传播有限公司"
          }
        ],
        writeBackFields: [
          {
            id: "1772562486782",
            fieldName: "收付款单据编号",
            source: "error"
          }
        ]
      },
      kingdeeConfig: {
        loginParams: {
          appId: "330883_5fbBxYvLzrA/1/9IX3TKVzyM3Jw/7tkP",
          appSecret: "c340ba05653248969e09729402218404",

          password: "tcdee@123",
          baseUrl: "http://47.113.148.159:8090/K3Cloud",
          username: "administrator",
          dbId: "692515d408132a"
        },
        formId: "AP_PAYBILL",
        dataTemplate: JSON.stringify({
          NeedUpDateFields: [],
          NeedReturnFields: [],
          IsDeleteEntry: "true",
          SubSystemId: "",
          IsVerifyBaseDataField: "false",
          IsEntryBatchFill: "true",
          ValidateFlag: "true",
          NumberSearch: "true",
          IsAutoAdjustField: "true",
          InterationFlags: "",
          IgnoreInterationFlag: "",
          IsControlPrecision: "false",
          ValidateRepeatJson: "false",
          Model: {
            FID: 0,
            FBillTypeID: { FNUMBER: "FKDLX01_SYS" },
            FDATE: "2026-03-04 00:00:00",
            FPAYORGID: { FNumber: "100" },
            FCURRENCYID: { FNumber: "PRE001" },
            FCONTACTUNITTYPE: "BD_Supplier",
            FCONTACTUNIT: { FNumber: "VEN00001" },
            FSETTLEORGID: { FNumber: "100" },
            FPURCHASEORGID: { FNumber: "100" },
            FrectUNITTYPE: "BD_Supplier",
            FrectUNIT: { FNumber: "VEN00001" },
            FEXCHANGERATE: 1.0,
            FDOCUMENTSTATUS: "Z",
            FSETTLECUR: { FNUMBER: "PRE001" },
            FSETTLERATE: 1.0,
            FISINIT: false,
            FISSAMEORG: true,
            FIsCredit: false,
            FIsWriteOff: false,
            FMatchMethodID: 0,
            FREALPAY: false,
            FREMARK: "测试",
            FISCARRYRATE: false,
            FMoreReceive: false,
            FVirIsSameAcctOrg: false,
            FBUSINESSTYPE: "2",
            FCancelStatus: "A",
            FSETTLEMAINBOOKID: { FNUMBER: "PRE001" },
            FPAYBILLENTRY: [
              {
                FSETTLETYPEID: { FNumber: "JSFS04_SYS" },
                FPURPOSEID: { FNumber: "SFKYT08_SYS" },
                FPAYTOTALAMOUNTFOR: 1,
                FPAYAMOUNTFOR_E: 1,
                FSETTLEDISTAMOUNTFOR: 0,
                FSETTLEPAYAMOUNTFOR: 1,
                FOversHORTAGEFOR: 0,
                FHANDLINGCHARGEFOR: 0,
                FPURCHASEORDERID: 0,
                FRecType: "0",
                FPAYAMOUNT_E: 1,
                FPOSTDATE: "2026-03-04 00:00:00",
                FPRICE: 0,
                FMATERIALSEQ: 0,
                FORDERENTRYID: 0,
                FRuZhangType: "1",
                FPayType: "A",
                FTaxAmt: 0,
                FNOTVERIFICATEAMOUNT: 1,
                FBankInvoice: false,
                FNoteStatus: "0",
                FUnique: 0,
                FMessageInstruct: "0",
                FCollectionAmount: 0,
                FByAgentBank: false,
                FOverseaPay: false,
                FXDexchangeRate: 0,
                FRELATEREFUNDAMOUNT: 0
              }
            ]
          }
        }, null, 2)
      },
      enabled: true,
      id: "1772554064756",
      createdAt: "2026-03-03T16:07:44.756Z",
      updatedAt: "2026-03-03T18:35:56.970Z"
    },
    {
      name: "付款单 (副本)",
      description: "",
      feishuConfig: {
        appToken: "YiFubTwajaRZ1GsTnnocXLesn7g",

        tableId: "tblKN6XjXbh61fHy",
        fieldParams: [
          {
            id: "1772556784229",
            variableName: "A",
            fieldName: "年月",
            decimalPlaces: 2
          }
        ],
        appId: "cli_a9a3c20f1178dcc1",
        appSecret: "HZOqHVAZ7gLxgQLvDjpZOxIt36zNW85p",
        viewId: "",
        filterConditions: [
          {
            fieldName: "收付款单据编号",
            operator: "isEmpty",
            value: ""
          },
          {
            fieldName: "公司主体",
            operator: "eq",
            value: "深圳市青年力量传播有限公司"
          }
        ],
        writeBackFields: [
          {
            id: "1772562486782",
            fieldName: "收付款单据编号",
            source: "error"
          }
        ]
      },
      kingdeeConfig: {
        loginParams: {
          appId: "330883_5fbBxYvLzrA/1/9IX3TKVzyM3Jw/7tkP",
          appSecret: "c340ba05653248969e09729402218404",

          password: "tcdee@123",
          baseUrl: "http://47.113.148.159:8090/K3Cloud",
          username: "administrator1",
          dbId: "692515d408132a"
        },
        formId: "AP_PAYBILL1",
        dataTemplate: JSON.stringify({
          NeedUpDateFields: [],
          NeedReturnFields: [],
          IsDeleteEntry: "true",
          SubSystemId: "",
          IsVerifyBaseDataField: "false",
          IsEntryBatchFill: "true",
          ValidateFlag: "true",
          NumberSearch: "true",
          IsAutoAdjustField: "true",
          InterationFlags: "",
          IgnoreInterationFlag: "",
          IsControlPrecision: "false",
          ValidateRepeatJson: "false",
          Model: {
            FID: 0,
            FBillTypeID: { FNUMBER: "FKDLX01_SYS" },
            FDATE: "2026-03-04 00:00:00",
            FPAYORGID: { FNumber: "100" },
            FCURRENCYID: { FNumber: "PRE001" },
            FCONTACTUNITTYPE: "BD_Supplier",
            FCONTACTUNIT: { FNumber: "VEN00001" },
            FSETTLEORGID: { FNumber: "100" },
            FPURCHASEORGID: { FNumber: "100" },
            FrectUNITTYPE: "BD_Supplier",
            FrectUNIT: { FNumber: "VEN00001" },
            FEXCHANGERATE: 1.0,
            FDOCUMENTSTATUS: "Z",
            FSETTLECUR: { FNUMBER: "PRE001" },
            FSETTLERATE: 1.0,
            FISINIT: false,
            FISSAMEORG: true,
            FIsCredit: false,
            FIsWriteOff: false,
            FMatchMethodID: 0,
            FREALPAY: false,
            FREMARK: "测试",
            FISCARRYRATE: false,
            FMoreReceive: false,
            FVirIsSameAcctOrg: false,
            FBUSINESSTYPE: "2",
            FCancelStatus: "A",
            FSETTLEMAINBOOKID: { FNUMBER: "PRE001" },
            FPAYBILLENTRY: [
              {
                FSETTLETYPEID: { FNumber: "JSFS04_SYS" },
                FPURPOSEID: { FNumber: "SFKYT08_SYS" },
                FPAYTOTALAMOUNTFOR: 1,
                FPAYAMOUNTFOR_E: 1,
                FSETTLEDISTAMOUNTFOR: 0,
                FSETTLEPAYAMOUNTFOR: 1,
                FOversHORTAGEFOR: 0,
                FHANDLINGCHARGEFOR: 0,
                FPURCHASEORDERID: 0,
                FRecType: "0",
                FPAYAMOUNT_E: 1,
                FPOSTDATE: "2026-03-04 00:00:00",
                FPRICE: 0,
                FMATERIALSEQ: 0,
                FORDERENTRYID: 0,
                FRuZhangType: "1",
                FPayType: "A",
                FTaxAmt: 0,
                FNOTVERIFICATEAMOUNT: 1,
                FBankInvoice: false,
                FNoteStatus: "0",
                FUnique: 0,
                FMessageInstruct: "0",
                FCollectionAmount: 0,
                FByAgentBank: false,
                FOverseaPay: false,
                FXDexchangeRate: 0,
                FRELATEREFUNDAMOUNT: 0
              }
            ]
          }
        }, null, 2)
      },
      enabled: true,
      id: "1772604551523",
      createdAt: "2026-03-04T06:09:11.523Z",
      updatedAt: "2026-03-04T07:24:33.188Z"
    }
  ] as TaskConfig[],
  taskInstances: [
    {
      id: "1772604504656",
      taskId: "1772554064756",
      status: "error",
      logs: [
        { id: "1772604504761", taskId: "1772554064756", timestamp: "2026-03-04T06:08:24.761Z", level: "info", message: "开始执行任务" },
        { id: "1772604504761", taskId: "1772554064756", timestamp: "2026-03-04T06:08:24.761Z", level: "info", message: "任务名称: 付款单" },
        { id: "1772604504761", taskId: "1772554064756", timestamp: "2026-03-04T06:08:24.761Z", level: "info", message: "开始查询飞书数据..." },
        { id: "1772604504762", taskId: "1772554064756", timestamp: "2026-03-04T06:08:24.762Z", level: "info", message: "表格ID: tblKN6XjXbh61fHy" },
        { id: "1772604504762", taskId: "1772554064756", timestamp: "2026-03-04T06:08:24.762Z", level: "info", message: "筛选条件: 2 个" },
        { id: "1772604509650", taskId: "1772554064756", timestamp: "2026-03-04T06:08:29.650Z", level: "info", message: "成功获取 1055 条飞书数据" },
        { id: "1772604509650", taskId: "1772554064756", timestamp: "2026-03-04T06:08:29.650Z", level: "info", message: "开始导入数据到金蝶..." },
        { id: "1772604509650", taskId: "1772554064756", timestamp: "2026-03-04T06:08:29.650Z", level: "info", message: "表单ID: AP_PAYBILL" },
        { id: "1772604509651", taskId: "1772554064756", timestamp: "2026-03-04T06:08:29.651Z", level: "info", message: "正在处理第 1/1055 条数据 (Record ID: recvcIOnm4LAmM)" },
        { id: "1772604509651", taskId: "1772554064756", timestamp: "2026-03-04T06:08:29.651Z", level: "info", message: "飞书数据: {\"A\":[{\"text\":\"202602\",\"type\":\"text\"}]}" },
        { id: "1772604509651", taskId: "1772554064756", timestamp: "2026-03-04T06:08:30.483Z", level: "info", message: "金蝶返回: {\"Result\":{\"ResponseStatus\":{\"ErrorCode\":500..." },
        { id: "1772604510483", taskId: "1772554064756", timestamp: "2026-03-04T06:08:30.483Z", level: "error", message: "第 1 条数据导入失败: 第1行分录，银行业务的结算方式，我方银行相关信息必录！" },
        { id: "1772604514539", taskId: "1772554064756", timestamp: "2026-03-04T06:08:34.539Z", level: "info", message: "任务已停止" }
      ],
      webApiLogs: [],
      progress: 0,
      startTime: "2026-03-04T06:08:24.760Z",
      totalCount: 1055,
      successCount: 0,
      errorCount: 4,
      endTime: "2026-03-04T06:08:39.576Z"
    },
    {
      id: "1772610023226",
      taskId: "1772554064756",
      status: "error",
      logs: [
        { id: "1772610023370", taskId: "1772554064756", timestamp: "2026-03-04T07:40:23.370Z", level: "info", message: "开始执行任务" },
        { id: "1772610023370", taskId: "1772554064756", timestamp: "2026-03-04T07:40:23.370Z", level: "info", message: "任务名称: 付款单" },
        { id: "1772610028259", taskId: "1772554064756", timestamp: "2026-03-04T07:40:28.259Z", level: "info", message: "成功获取 1059 条飞书数据" },
        { id: "1772610034815", taskId: "1772554064756", timestamp: "2026-03-04T07:40:34.815Z", level: "warn", message: "任务已停止" }
      ],
      webApiLogs: [],
      progress: 0,
      startTime: "2026-03-04T07:40:23.370Z",
      totalCount: 1059,
      successCount: 0,
      errorCount: 3,
      endTime: "2026-03-04T07:40:37.708Z"
    }
  ] as TaskInstance[]
};

// 初始化默认账户
export async function initDefaultAccount(): Promise<Account | null> {
  try {
    // 检查是否已存在 admin 账户
    let account = await localFileStorage.getAccount(DEFAULT_USERNAME);
    
    if (!account) {
      // 创建默认账户
      console.log('创建默认账户...');
      account = await localFileStorage.registerAccount(DEFAULT_USERNAME, DEFAULT_PASSWORD);
      console.log('默认账户创建成功:', account.username);
      
      // 导入默认数据
      console.log('导入默认数据...');
      await localFileStorage.saveAccountData(account.id, {
        tasks: defaultData.tasks,
        taskInstances: defaultData.taskInstances,
        lastModified: new Date().toISOString(),
      });
      console.log('默认数据导入成功');
    } else {
      console.log('默认账户已存在:', account.username);
    }
    
    return account;
  } catch (error: any) {
    console.error('初始化默认账户失败:', error);
    throw new Error(`初始化默认账户失败: ${error.message}`);
  }
}

// 获取默认账户信息
export function getDefaultAccountInfo() {
  return {
    username: DEFAULT_USERNAME,
    password: DEFAULT_PASSWORD,
  };
}
