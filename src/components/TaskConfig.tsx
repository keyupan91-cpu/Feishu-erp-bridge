import React, { useState } from 'react';
import { Tabs, Form, Input, Button, Table, InputNumber, Select, message, Modal, Card, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TaskConfig, FeishuFieldParam, FilterCondition, WriteBackField } from '../types';
import { useResponsive } from '../hooks/useResponsive';

const { TabPane } = Tabs;
const { TextArea, Password } = Input;

interface TaskConfigProps {
  task: TaskConfig;
  onSave: (task: TaskConfig) => void;
  onTest: (type: 'feishu' | 'kingdee' | 'kingdee-validate') => void;
  onCancel?: () => void;
}

const TaskConfigComponent: React.FC<TaskConfigProps> = ({ task, onSave, onTest }) => {
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState('feishu');
  const [feishuConfig, setFeishuConfig] = useState(task.feishuConfig);
  const [kingdeeConfig, setKingdeeConfig] = useState(task.kingdeeConfig);
  const [fieldParams, setFieldParams] = useState<FeishuFieldParam[]>([...task.feishuConfig.fieldParams]);
  const [filterConditions, setFilterConditions] = useState(task.feishuConfig.filterConditions || []);
  const [writeBackFields, setWriteBackFields] = useState<WriteBackField[]>(task.feishuConfig.writeBackFields || []);
  
  const handleFieldParamChange = (index: number, key: keyof FeishuFieldParam, value: any) => {
    const newFieldParams = [...fieldParams];
    newFieldParams[index] = { ...newFieldParams[index], [key]: value };
    setFieldParams(newFieldParams);
  };
  
  const handleAddFieldParam = () => {
    setFieldParams([...fieldParams, {
      id: Date.now().toString(),
      variableName: '',
      fieldName: '',
      decimalPlaces: 2,
    }]);
  };
  
  const handleDeleteFieldParam = (index: number) => {
    const newFieldParams = [...fieldParams];
    newFieldParams.splice(index, 1);
    setFieldParams(newFieldParams);
  };
  
  // 处理筛选条件变更
  const handleFilterConditionChange = (index: number, key: keyof FilterCondition, value: any) => {
    const newFilterConditions = [...filterConditions];
    newFilterConditions[index] = { ...newFilterConditions[index], [key]: value };
    setFilterConditions(newFilterConditions);
  };
  
  // 添加筛选条件
  const handleAddFilterCondition = () => {
    setFilterConditions([...filterConditions, {
      fieldName: '',
      operator: 'eq',
      value: '',
    }]);
  };
  
  // 删除筛选条件
  const handleDeleteFilterCondition = (index: number) => {
    const newFilterConditions = [...filterConditions];
    newFilterConditions.splice(index, 1);
    setFilterConditions(newFilterConditions);
  };
  
  // 处理回写字段变更
  const handleWriteBackFieldChange = (index: number, key: keyof WriteBackField, value: any) => {
    const newWriteBackFields = [...writeBackFields];
    newWriteBackFields[index] = { ...newWriteBackFields[index], [key]: value };
    setWriteBackFields(newWriteBackFields);
  };
  
  // 添加回写字段
  const handleAddWriteBackField = () => {
    setWriteBackFields([...writeBackFields, {
      id: Date.now().toString(),
      fieldName: '',
      source: 'success',
    }]);
  };
  
  // 删除回写字段
  const handleDeleteWriteBackField = (index: number) => {
    const newWriteBackFields = [...writeBackFields];
    newWriteBackFields.splice(index, 1);
    setWriteBackFields(newWriteBackFields);
  };
  
  const handleSave = () => {
    // 保存配置时不做必填验证，允许保存部分配置

    const updatedTask: TaskConfig = {
      ...task,
      feishuConfig: {
        ...feishuConfig,
        fieldParams,
        filterConditions,
        writeBackFields,
      },
      kingdeeConfig,
    };

    onSave(updatedTask);
  };

  // 移动端字段参数卡片
  const renderMobileFieldParamCard = (param: FeishuFieldParam, index: number) => (
    <Card
      key={param.id}
      size="small"
      className="mobile-config-card"
      bodyStyle={{ padding: '12px 16px' }}
      style={{ marginBottom: '12px', borderRadius: '12px' }}
    >
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontWeight: 600, color: '#2C3E50', marginBottom: '8px' }}>
          字段参数 #{index + 1}
        </div>
      </div>
      <Form layout="vertical" size="large">
        <Form.Item label="变量名" style={{ marginBottom: '12px' }}>
          <Input
            value={param.variableName}
            onChange={(e) => handleFieldParamChange(index, 'variableName', e.target.value)}
            placeholder="如：A"
            style={{ height: '44px', fontSize: '16px' }}
          />
        </Form.Item>
        <Form.Item label="字段名" style={{ marginBottom: '12px' }}>
          <Input
            value={param.fieldName}
            onChange={(e) => handleFieldParamChange(index, 'fieldName', e.target.value)}
            placeholder="飞书字段名称"
            style={{ height: '44px', fontSize: '16px' }}
          />
        </Form.Item>
        <Form.Item label="小数位数" style={{ marginBottom: 0 }}>
          <InputNumber
            min={0}
            max={10}
            value={param.decimalPlaces}
            onChange={(value) => handleFieldParamChange(index, 'decimalPlaces', value)}
            style={{ width: '100%', height: '44px', fontSize: '16px' }}
          />
        </Form.Item>
      </Form>
      <Button
        icon={<DeleteOutlined />}
        danger
        size="large"
        onClick={() => handleDeleteFieldParam(index)}
        block
        style={{ marginTop: '12px', height: '44px', borderRadius: '8px' }}
      >
        删除此参数
      </Button>
    </Card>
  );

  // 移动端筛选条件卡片
  const renderMobileFilterCard = (condition: FilterCondition, index: number) => (
    <Card
      key={index}
      size="small"
      className="mobile-config-card"
      bodyStyle={{ padding: '12px 16px' }}
      style={{ marginBottom: '12px', borderRadius: '12px' }}
    >
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontWeight: 600, color: '#2C3E50', marginBottom: '8px' }}>
          筛选条件 #{index + 1}
        </div>
      </div>
      <Form layout="vertical" size="large">
        <Form.Item label="字段名" style={{ marginBottom: '12px' }}>
          <Input
            value={condition.fieldName}
            onChange={(e) => handleFilterConditionChange(index, 'fieldName', e.target.value)}
            placeholder="如：状态"
            style={{ height: '44px', fontSize: '16px' }}
          />
        </Form.Item>
        <Form.Item label="操作符" style={{ marginBottom: '12px' }}>
          <Select
            value={condition.operator}
            onChange={(value) => handleFilterConditionChange(index, 'operator', value)}
            style={{ width: '100%', height: '44px', fontSize: '16px' }}
            options={[
              { value: 'eq', label: '等于' },
              { value: 'ne', label: '不等于' },
              { value: 'contains', label: '包含' },
              { value: 'notContains', label: '不包含' },
              { value: 'isEmpty', label: '为空' },
              { value: 'isNotEmpty', label: '不为空' },
            ]}
          />
        </Form.Item>
        <Form.Item label="值" style={{ marginBottom: 0 }}>
          <Input
            value={condition.value || ''}
            onChange={(e) => handleFilterConditionChange(index, 'value', e.target.value)}
            placeholder="筛选值"
            style={{ height: '44px', fontSize: '16px' }}
          />
        </Form.Item>
      </Form>
      <Button
        icon={<DeleteOutlined />}
        danger
        size="large"
        onClick={() => handleDeleteFilterCondition(index)}
        block
        style={{ marginTop: '12px', height: '44px', borderRadius: '8px' }}
      >
        删除此条件
      </Button>
    </Card>
  );

  // 移动端回写字段卡片
  const renderMobileWriteBackCard = (field: WriteBackField, index: number) => (
    <Card
      key={index}
      size="small"
      className="mobile-config-card"
      bodyStyle={{ padding: '12px 16px' }}
      style={{ marginBottom: '12px', borderRadius: '12px' }}
    >
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontWeight: 600, color: '#2C3E50', marginBottom: '8px' }}>
          回写字段 #{index + 1}
        </div>
      </div>
      <Form layout="vertical" size="large">
        <Form.Item label="飞书字段名" style={{ marginBottom: '12px' }}>
          <Input
            value={field.fieldName}
            onChange={(e) => handleWriteBackFieldChange(index, 'fieldName', e.target.value)}
            placeholder="如：同步状态"
            style={{ height: '44px', fontSize: '16px' }}
          />
        </Form.Item>
        <Form.Item label="数据来源" style={{ marginBottom: '12px' }}>
          <Select
            value={field.source}
            onChange={(value) => handleWriteBackFieldChange(index, 'source', value)}
            style={{ width: '100%', height: '44px', fontSize: '16px' }}
            options={[
              { value: 'success', label: '成功消息' },
              { value: 'error', label: '错误消息' },
              { value: 'response', label: '完整响应' },
            ]}
          />
        </Form.Item>
        <Form.Item label="JSON 路径（可选）" style={{ marginBottom: 0 }}>
          <Input
            value={field.jsonPath || ''}
            onChange={(e) => handleWriteBackFieldChange(index, 'jsonPath', e.target.value)}
            placeholder="如：Result.ResponseStatus.Errors[0].Message"
            style={{ height: '44px', fontSize: '16px' }}
          />
        </Form.Item>
      </Form>
      <Button
        icon={<DeleteOutlined />}
        danger
        size="large"
        onClick={() => handleDeleteWriteBackField(index)}
        block
        style={{ marginTop: '12px', height: '44px', borderRadius: '8px' }}
      >
        删除此字段
      </Button>
    </Card>
  );
  
  const fieldParamColumns = [
    {
      title: '变量名',
      dataIndex: 'variableName',
      key: 'variableName',
      width: 120,
      render: (_: string, record: FeishuFieldParam, index: number) => (
        <Input
          value={record.variableName}
          onChange={(e) => handleFieldParamChange(index, 'variableName', e.target.value)}
          placeholder="如：A"
        />
      ),
    },
    {
      title: '字段名',
      dataIndex: 'fieldName',
      key: 'fieldName',
      width: 200,
      render: (_: string, record: FeishuFieldParam, index: number) => (
        <Input
          value={record.fieldName}
          onChange={(e) => handleFieldParamChange(index, 'fieldName', e.target.value)}
          placeholder="飞书字段名称"
        />
      ),
    },
    {
      title: '小数位数',
      dataIndex: 'decimalPlaces',
      key: 'decimalPlaces',
      width: 100,
      render: (_: number, record: FeishuFieldParam, index: number) => (
        <InputNumber
          min={0}
          max={10}
          value={record.decimalPlaces}
          onChange={(value) => handleFieldParamChange(index, 'decimalPlaces', value)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Button
          icon={<DeleteOutlined />}
          danger
          size="small"
          onClick={() => handleDeleteFieldParam(index)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="飞书参数" key="feishu">
          <Form layout="vertical">
            <Form.Item label="App ID">
              <Input 
                value={feishuConfig.appId || ''} 
                onChange={(e) => setFeishuConfig({ ...feishuConfig, appId: e.target.value })} 
                placeholder="cli_a9a3c20f1178dcc1"
              />
            </Form.Item>
            <Form.Item label="App Secret">
              <Input 
                value={feishuConfig.appSecret || ''} 
                onChange={(e) => setFeishuConfig({ ...feishuConfig, appSecret: e.target.value })} 
                placeholder="HZOqHVAZ7gLxgQLvDjpZOxIt36zNW85p"
              />
            </Form.Item>
            <Form.Item label="App Token">
              <Input 
                value={feishuConfig.appToken} 
                onChange={(e) => setFeishuConfig({ ...feishuConfig, appToken: e.target.value })} 
                placeholder="YiFubTwajaRZ1GsTnnocXLesn7g"
              />
            </Form.Item>

            <Form.Item label="表格ID">
              <Input 
                value={feishuConfig.tableId} 
                onChange={(e) => setFeishuConfig({ ...feishuConfig, tableId: e.target.value })} 
              />
            </Form.Item>
            <Form.Item label="视图ID (可选)">
              <Input 
                value={feishuConfig.viewId} 
                onChange={(e) => setFeishuConfig({ ...feishuConfig, viewId: e.target.value })} 
              />
            </Form.Item>
            
            <Form.Item label="字段参数">
              {isMobile ? (
                <div>
                  {fieldParams.map((param, index) => renderMobileFieldParamCard(param, index))}
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddFieldParam}
                    block
                    size="large"
                    style={{ height: '44px', borderRadius: '8px', marginTop: '12px' }}
                  >
                    添加字段参数
                  </Button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddFieldParam}>
                      添加字段参数
                    </Button>
                  </div>
                  <Table
                    columns={fieldParamColumns}
                    dataSource={fieldParams.map((param) => ({ ...param, key: param.id }))}
                    pagination={false}
                  />
                </>
              )}
            </Form.Item>
            
            <Form.Item label="筛选条件">
              {isMobile ? (
                <div>
                  {filterConditions.map((condition, index) => renderMobileFilterCard(condition, index))}
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddFilterCondition}
                    block
                    size="large"
                    style={{ height: '44px', borderRadius: '8px', marginTop: '12px' }}
                  >
                    添加筛选条件
                  </Button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddFilterCondition}>
                      添加筛选条件
                    </Button>
                  </div>
                  <Table
                    columns={[
                      {
                        title: '字段名',
                        dataIndex: 'fieldName',
                        key: 'fieldName',
                        render: (_: string, record: FilterCondition, index: number) => (
                          <Input
                            value={record.fieldName}
                            onChange={(e) => handleFilterConditionChange(index, 'fieldName', e.target.value)}
                          />
                        ),
                      },
                      {
                        title: '操作符',
                        dataIndex: 'operator',
                        key: 'operator',
                        render: (_: string, record: FilterCondition, index: number) => (
                          <Select
                            value={record.operator}
                            onChange={(value) => handleFilterConditionChange(index, 'operator', value)}
                            style={{ width: 120 }}
                            options={[
                              { value: 'eq', label: '等于' },
                              { value: 'ne', label: '不等于' },
                              { value: 'contains', label: '包含' },
                              { value: 'notContains', label: '不包含' },
                              { value: 'isEmpty', label: '为空' },
                              { value: 'isNotEmpty', label: '不为空' },
                            ]}
                          />
                        ),
                      },
                      {
                        title: '值',
                        dataIndex: 'value',
                        key: 'value',
                        render: (_: string, record: FilterCondition, index: number) => (
                          <Input
                            value={record.value || ''}
                            onChange={(e) => handleFilterConditionChange(index, 'value', e.target.value)}
                          />
                        ),
                      },
                      {
                        title: '操作',
                        key: 'action',
                        render: (_: any, __: any, index: number) => (
                          <Button
                            icon={<DeleteOutlined />}
                            danger
                            size="small"
                            onClick={() => handleDeleteFilterCondition(index)}
                          >
                            删除
                          </Button>
                        ),
                      },
                    ]}
                    dataSource={filterConditions.map((condition, index) => ({ ...condition, key: index }))}
                    pagination={false}
                  />
                </>
              )}
            </Form.Item>
            
            <Form.Item label="回写字段配置">
              {isMobile ? (
                <div>
                  {writeBackFields.map((field, index) => renderMobileWriteBackCard(field, index))}
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddWriteBackField}
                    block
                    size="large"
                    style={{ height: '44px', borderRadius: '8px', marginTop: '12px' }}
                  >
                    添加回写字段
                  </Button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddWriteBackField}>
                      添加回写字段
                    </Button>
                  </div>
                  <Table
                    columns={[
                  {
                    title: '飞书字段名',
                    dataIndex: 'fieldName',
                    key: 'fieldName',
                    render: (_: string, record: WriteBackField, index: number) => (
                      <Input 
                        value={record.fieldName} 
                        onChange={(e) => handleWriteBackFieldChange(index, 'fieldName', e.target.value)} 
                        placeholder="如：同步状态"
                      />
                    ),
                  },
                  {
                    title: '数据来源',
                    dataIndex: 'source',
                    key: 'source',
                    render: (_: string, record: WriteBackField, index: number) => (
                      <Select 
                        value={record.source} 
                        onChange={(value) => handleWriteBackFieldChange(index, 'source', value)} 
                        style={{ width: 120 }}
                        options={[
                          { value: 'success', label: '成功消息' },
                          { value: 'error', label: '错误消息' },
                          { value: 'response', label: '完整响应' },
                        ]}
                      />
                    ),
                  },
                  {
                    title: 'JSON路径（可选）',
                    dataIndex: 'jsonPath',
                    key: 'jsonPath',
                    render: (_: string, record: WriteBackField, index: number) => (
                      <Input 
                        value={record.jsonPath || ''} 
                        onChange={(e) => handleWriteBackFieldChange(index, 'jsonPath', e.target.value)} 
                        placeholder="如：Result.ResponseStatus.Errors[0].Message"
                      />
                    ),
                  },
                  {
                    title: '操作',
                    key: 'action',
                    render: (_: any, __: any, index: number) => (
                      <Button 
                        icon={<DeleteOutlined />} 
                        danger
                        size="small"
                        onClick={() => handleDeleteWriteBackField(index)}
                      >
                        删除
                      </Button>
                    ),
                  },
                ]}
                    dataSource={writeBackFields.map((field, index) => ({ ...field, key: index }))}
                    pagination={false}
                  />
                </>
              )}
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" onClick={() => onTest('feishu')} style={{ marginRight: 8 }}>
                测试连接
              </Button>
              <Button type="primary" onClick={handleSave}>
                保存配置
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
        
        <TabPane tab="金蝶参数" key="kingdee">
          <Form layout="vertical">
            <Form.Item label="App ID">
              <Input 
                value={kingdeeConfig.loginParams.appId} 
                onChange={(e) => setKingdeeConfig({ 
                  ...kingdeeConfig, 
                  loginParams: { 
                    ...kingdeeConfig.loginParams, 
                    appId: e.target.value 
                  } 
                })} 
              />
            </Form.Item>
            <Form.Item label="App Secret">
              <Password 
                value={kingdeeConfig.loginParams.appSecret} 
                onChange={(e) => setKingdeeConfig({ 
                  ...kingdeeConfig, 
                  loginParams: { 
                    ...kingdeeConfig.loginParams, 
                    appSecret: e.target.value 
                  } 
                })} 
              />
            </Form.Item>
            <Form.Item label="用户名">
              <Input 
                value={kingdeeConfig.loginParams.username} 
                onChange={(e) => setKingdeeConfig({ 
                  ...kingdeeConfig, 
                  loginParams: { 
                    ...kingdeeConfig.loginParams, 
                    username: e.target.value 
                  } 
                })} 
              />
            </Form.Item>
            <Form.Item label="DB ID (数据中心ID)">
              <Input 
                value={kingdeeConfig.loginParams.dbId} 
                onChange={(e) => setKingdeeConfig({ 
                  ...kingdeeConfig, 
                  loginParams: { 
                    ...kingdeeConfig.loginParams, 
                    dbId: e.target.value 
                  } 
                })} 
              />
            </Form.Item>
            <Form.Item label="密码">
              <Password 
                value={kingdeeConfig.loginParams.password} 
                onChange={(e) => setKingdeeConfig({ 
                  ...kingdeeConfig, 
                  loginParams: { 
                    ...kingdeeConfig.loginParams, 
                    password: e.target.value 
                  } 
                })} 
              />
            </Form.Item>
            <Form.Item label="API地址">
              <Input 
                value={kingdeeConfig.loginParams.baseUrl} 
                onChange={(e) => setKingdeeConfig({ 
                  ...kingdeeConfig, 
                  loginParams: { 
                    ...kingdeeConfig.loginParams, 
                    baseUrl: e.target.value 
                  } 
                })} 
              />
            </Form.Item>
            <Form.Item label="表单ID">
              <Input 
                value={kingdeeConfig.formId} 
                onChange={(e) => setKingdeeConfig({ 
                  ...kingdeeConfig, 
                  formId: e.target.value 
                })} 
              />
            </Form.Item>
            <Form.Item label="数据模板 (JSON)">
              <div style={{ marginBottom: 8, textAlign: 'right' }}>
                <Button 
                  size="small" 
                  onClick={() => {
                    // 获取当前光标位置或文本末尾
                    const textarea = document.querySelector('textarea[data-template="kingdee"]') as HTMLTextAreaElement;
                    if (textarea) {
                      const cursorPos = textarea.selectionStart || kingdeeConfig.dataTemplate?.length || 0;
                      const textBefore = kingdeeConfig.dataTemplate?.substring(0, cursorPos) || '';
                      const textAfter = kingdeeConfig.dataTemplate?.substring(cursorPos) || '';
                      
                      // 显示变量选择弹窗
                      Modal.info({
                        title: '选择变量插入',
                        content: (
                          <div>
                            <p>点击变量名插入到模板中：</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                              {fieldParams.length === 0 ? (
                                <span style={{ color: '#999' }}>暂无变量，请先在飞书参数中添加字段参数</span>
                              ) : (
                                fieldParams.map(param => (
                                  <Button
                                    key={param.id}
                                    size="small"
                                    onClick={() => {
                                      const variable = `{{${param.variableName}}}`;
                                      const newTemplate = textBefore + variable + textAfter;
                                      setKingdeeConfig({
                                        ...kingdeeConfig,
                                        dataTemplate: newTemplate
                                      });
                                      Modal.destroyAll();
                                      message.success(`已插入变量 {{${param.variableName}}}`);
                                    }}
                                  >
                                    {param.variableName} ({param.fieldName})
                                  </Button>
                                ))
                              )}
                            </div>
                          </div>
                        ),
                        onOk() {},
                      });
                    }
                  }}
                >
                  导入变量
                </Button>
              </div>
              <TextArea 
                data-template="kingdee"
                rows={10} 
                value={kingdeeConfig.dataTemplate} 
                onChange={(e) => setKingdeeConfig({ 
                  ...kingdeeConfig, 
                  dataTemplate: e.target.value 
                })} 
                placeholder={`示例格式：
{
  "NeedUpDateFields": [],
  "NeedReturnFields": [],
  "IsDeleteEntry": "true",
  "ValidateFlag": "true",
  "Model": {
    "FID": 0,
    "FBillTypeID": { "FNUMBER": "FKDLX01_SYS" },
    "FDATE": "{{A}}",
    "FPAYORGID": { "FNumber": "100" },
    "FREMARK": "{{B}}"
  }
}`}
              />
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" onClick={() => onTest('kingdee')} style={{ marginRight: 8 }}>
                测试连接
              </Button>
              <Button type="default" onClick={() => onTest('kingdee-validate')} style={{ marginRight: 8 }}>
                验证数据
              </Button>
              <Button type="primary" onClick={handleSave}>
                保存配置
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>

      {isMobile && (
        <style>{`
          .mobile-config-card {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }

          .mobile-config-card .ant-form-item-label {
            padding-bottom: 4px;
          }

          .mobile-config-card .ant-form-item-label > label {
            font-size: 14px;
            font-weight: 500;
            color: #5D6D7E;
          }

          .mobile-config-card .ant-input,
          .mobile-config-card .ant-select-selector,
          .mobile-config-card .ant-input-number-input {
            font-size: 16px;
            padding: 12px 16px;
          }

          .mobile-config-card .ant-input-number {
            display: flex;
            align-items: center;
          }

          /* 暗黑模式适配 */
          @media (prefers-color-scheme: dark) {
            .mobile-config-card {
              background: #1a1a2e;
              border-color: #2a2a4e;
            }

            .mobile-config-card .ant-form-item-label > label {
              color: #b8b8b8;
            }

            .mobile-config-card .ant-input,
            .mobile-config-card .ant-select-selector,
            .mobile-config-card .ant-input-number {
              background: #16213e;
              border-color: #2a2a4e;
              color: #eaeaea;
            }
          }
        `}</style>
      )}
    </div>
  );
};

export default TaskConfigComponent;
