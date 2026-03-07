import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  message,
  Collapse,
  Space,
  Table,
  InputNumber,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { TaskConfig, FeishuFieldParam, FilterCondition, WriteBackField } from '../types';
import { useResponsive } from '../hooks/useResponsive';
import FeishuService from '../services/feishuService';
import { getDefaultProcessType } from '../utils/fieldTypeUtils';

const { TextArea, Password } = Input;
const { Option } = Select;

interface TaskConfigProps {
  task: TaskConfig;
  onSave: (task: TaskConfig) => void;
  onTest: (type: 'feishu' | 'kingdee' | 'kingdee-validate') => void;
  onCancel?: () => void;
}

const TaskConfigComponent: React.FC<TaskConfigProps> = ({ task, onSave, onTest }) => {
  const { isMobile } = useResponsive();
  const [activeKey, setActiveKey] = useState<string[]>(['1']); // 手风琴展开状态
  const [feishuConfig, setFeishuConfig] = useState(task.feishuConfig);
  const [kingdeeConfig, setKingdeeConfig] = useState(task.kingdeeConfig);
  const [fieldParams, setFieldParams] = useState<FeishuFieldParam[]>([...task.feishuConfig.fieldParams]);
  const [filterConditions, setFilterConditions] = useState(task.feishuConfig.filterConditions || []);
  const [writeBackFields, setWriteBackFields] = useState<WriteBackField[]>(task.feishuConfig.writeBackFields || []);

  // 字段列表状态
  const [fieldList, setFieldList] = useState<{ fieldName: string; fieldType: string }[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);

  // 字段参数表格列
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
      width: 180,
      render: (_: string, record: FeishuFieldParam, index: number) => (
        <Select
          value={record.fieldName}
          onChange={(value) => {
            handleFieldParamChange(index, 'fieldName', value);
            // 当字段改变时，自动设置处理类型
            const field = fieldList.find(f => f.fieldName === value);
            if (field && field.fieldType) {
              const fieldTypeNum = parseInt(field.fieldType, 10);
              const defaultProcessType = getDefaultProcessType(fieldTypeNum);
              handleFieldParamChange(index, 'processType', defaultProcessType);
              handleFieldParamChange(index, 'sourceFieldType', fieldTypeNum);
            }
          }}
          style={{ width: '100%' }}
          showSearch
          filterOption={(input, option) =>
            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
          }
        >
          {fieldList.map((field) => (
            <Option key={field.fieldName} value={field.fieldName}>
              {field.fieldName} ({field.fieldType})
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: '处理类型',
      dataIndex: 'processType',
      key: 'processType',
      width: 120,
      render: (_: string, record: FeishuFieldParam, index: number) => (
        <Select
          value={record.processType || 'auto'}
          onChange={(value) => handleFieldParamChange(index, 'processType', value)}
          style={{ width: '100%' }}
        >
          <Option value="auto">自动</Option>
          <Option value="text">文本</Option>
          <Option value="number">数字</Option>
          <Option value="date">日期</Option>
          <Option value="datetime">日期时间</Option>
          <Option value="timestamp">时间戳</Option>
          <Option value="multiselect">多选</Option>
          <Option value="person">人员</Option>
        </Select>
      ),
    },
    {
      title: '格式',
      key: 'format',
      width: 120,
      render: (_: any, record: FeishuFieldParam, index: number) => {
        const processType = record.processType || 'auto';

        // 根据处理类型显示不同的配置
        if (processType === 'number') {
          return (
            <InputNumber
              min={0}
              max={10}
              value={record.decimalPlaces ?? 2}
              onChange={(value) => handleFieldParamChange(index, 'decimalPlaces', value)}
              style={{ width: '100%' }}
              placeholder="小数位"
            />
          );
        } else if (processType === 'date' || processType === 'datetime') {
          return (
            <Select
              value={record.dateFormat || 'YYYY-MM-DD'}
              onChange={(value) => handleFieldParamChange(index, 'dateFormat', value)}
              style={{ width: '100%' }}
            >
              <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
              <Option value="YYYY/MM/DD">YYYY/MM/DD</Option>
              <Option value="YYYYMMDD">YYYYMMDD</Option>
              <Option value="timestamp">时间戳</Option>
            </Select>
          );
        }
        return <span style={{ color: '#999', fontSize: 12 }}>无需配置</span>;
      },
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

  // 获取字段列表
  const handleRefreshFields = async () => {
    if (!feishuConfig.appToken || !feishuConfig.tableId) {
      message.error('请先填写飞书 App Token 和表格 ID');
      setActiveKey(['1']); // 展开基础参数面板
      return;
    }

    setLoadingFields(true);
    try {
      const feishuService = new FeishuService(feishuConfig);
      const fields = await feishuService.getFields(feishuConfig.tableId);
      setFieldList(fields);
      message.success(`成功获取 ${fields.length} 个字段`);
    } catch (error: any) {
      message.error(`获取字段列表失败：${error.message}`);
    } finally {
      setLoadingFields(false);
    }
  };

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
      processType: 'auto',
      decimalPlaces: 2,
      dateFormat: 'YYYY-MM-DD',
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
    <div
      key={param.id}
      style={{
        marginBottom: '12px',
        padding: '12px',
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        background: '#fafafa',
      }}
    >
      <div style={{ fontWeight: 600, color: '#2C3E50', marginBottom: '8px' }}>
        字段参数 #{index + 1}
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
          <Select
            value={param.fieldName}
            onChange={(value) => handleFieldParamChange(index, 'fieldName', value)}
            style={{ width: '100%', height: '44px', fontSize: '16px' }}
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {fieldList.map((field) => (
              <Option key={field.fieldName} value={field.fieldName}>
                {field.fieldName}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="小数位数" style={{ marginBottom: 0 }}>
          <InputNumber
            min={0}
            max={10}
            value={param.decimalPlaces ?? 2}
            onChange={(value) => {
              handleFieldParamChange(index, 'decimalPlaces', value);
            }}
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
    </div>
  );

  // 移动端筛选条件卡片
  const renderMobileFilterCard = (condition: FilterCondition, index: number) => (
    <div
      key={index}
      style={{
        marginBottom: '12px',
        padding: '12px',
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        background: '#fafafa',
      }}
    >
      <div style={{ fontWeight: 600, color: '#2C3E50', marginBottom: '8px' }}>
        筛选条件 #{index + 1}
      </div>
      <Form layout="vertical" size="large">
        <Form.Item label="字段名" style={{ marginBottom: '12px' }}>
          <Select
            value={condition.fieldName}
            onChange={(value) => handleFilterConditionChange(index, 'fieldName', value)}
            style={{ width: '100%', height: '44px', fontSize: '16px' }}
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {fieldList.map((field) => (
              <Option key={field.fieldName} value={field.fieldName}>
                {field.fieldName}
              </Option>
            ))}
          </Select>
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
    </div>
  );

  // 移动端回写字段卡片
  const renderMobileWriteBackCard = (field: WriteBackField, index: number) => (
    <div
      key={index}
      style={{
        marginBottom: '12px',
        padding: '12px',
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        background: '#fafafa',
      }}
    >
      <div style={{ fontWeight: 600, color: '#2C3E50', marginBottom: '8px' }}>
        回写字段 #{index + 1}
      </div>
      <Form layout="vertical" size="large">
        <Form.Item label="飞书字段名" style={{ marginBottom: '12px' }}>
          <Select
            value={field.fieldName}
            onChange={(value) => handleWriteBackFieldChange(index, 'fieldName', value)}
            style={{ width: '100%', height: '44px', fontSize: '16px' }}
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {fieldList.map((f) => (
              <Option key={f.fieldName} value={f.fieldName}>
                {f.fieldName}
              </Option>
            ))}
          </Select>
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
    </div>
  );

  // 手风琴面板内容
  const renderCollapsePanel = () => (
    <>
      {/* 面板 1: 飞书基础参数 */}
      <Collapse.Panel header="飞书基础参数" key="1">
        <Form layout="vertical" size="large">
          <Form.Item label="App ID" required>
            <Input
              value={feishuConfig.appId || ''}
              onChange={(e) => setFeishuConfig({ ...feishuConfig, appId: e.target.value })}
              placeholder="cli_a9a3c20f1178dcc1"
              size="large"
            />
          </Form.Item>
          <Form.Item label="App Secret" required>
            <Input
              value={feishuConfig.appSecret || ''}
              onChange={(e) => setFeishuConfig({ ...feishuConfig, appSecret: e.target.value })}
              placeholder="HZOqHVAZ7gLxgQLvDjpZOxIt36zNW85p"
              size="large"
            />
          </Form.Item>
          <Form.Item label="App Token" required>
            <Input
              value={feishuConfig.appToken}
              onChange={(e) => setFeishuConfig({ ...feishuConfig, appToken: e.target.value })}
              placeholder="YiFubTwajaRZ1GsTnnocXLesn7g"
              size="large"
            />
          </Form.Item>
          <Form.Item label="表格 ID" required>
            <Input
              value={feishuConfig.tableId}
              onChange={(e) => setFeishuConfig({ ...feishuConfig, tableId: e.target.value })}
              size="large"
            />
          </Form.Item>
          <Form.Item label="视图 ID (可选)">
            <Input
              value={feishuConfig.viewId}
              onChange={(e) => setFeishuConfig({ ...feishuConfig, viewId: e.target.value })}
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              icon={<SyncOutlined spin={loadingFields} />}
              onClick={handleRefreshFields}
              loading={loadingFields}
              block
              size="large"
            >
              {loadingFields ? '获取中...' : '更新字段列表'}
            </Button>
          </Form.Item>
        </Form>
      </Collapse.Panel>

      {/* 面板 2: 查询参数字段 */}
      <Collapse.Panel header="查询参数字段" key="2">
        {fieldList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            <p>请先在上方「飞书基础参数」面板中点击「更新字段列表」按钮</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddFieldParam}>
                  添加字段参数
                </Button>
                <Button icon={<SyncOutlined />} onClick={handleRefreshFields} loading={loadingFields}>
                  刷新字段
                </Button>
              </Space>
            </div>
            {isMobile ? (
              <div>
                {fieldParams.map((param, index) => renderMobileFieldParamCard(param, index))}
              </div>
            ) : (
              <Table
                columns={fieldParamColumns}
                dataSource={fieldParams.map((param) => ({ ...param, key: param.id }))}
                pagination={false}
                scroll={{ x: 600 }}
              />
            )}
          </>
        )}
      </Collapse.Panel>

      {/* 面板 3: 筛选字段 */}
      <Collapse.Panel header="筛选字段" key="3">
        {fieldList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            <p>请先在上方「飞书基础参数」面板中点击「更新字段列表」按钮</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddFilterCondition}>
                  添加筛选条件
                </Button>
                <Button icon={<SyncOutlined />} onClick={handleRefreshFields} loading={loadingFields}>
                  刷新字段
                </Button>
              </Space>
            </div>
            {isMobile ? (
              <div>
                {filterConditions.map((condition, index) => renderMobileFilterCard(condition, index))}
              </div>
            ) : (
              <Table
                columns={[
                  {
                    title: '字段名',
                    dataIndex: 'fieldName',
                    key: 'fieldName',
                    render: (_: string, record: FilterCondition, index: number) => (
                      <Select
                        value={record.fieldName}
                        onChange={(value) => handleFilterConditionChange(index, 'fieldName', value)}
                        style={{ width: '100%' }}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                      >
                        {fieldList.map((field) => (
                          <Option key={field.fieldName} value={field.fieldName}>
                            {field.fieldName}
                          </Option>
                        ))}
                      </Select>
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
                scroll={{ x: 600 }}
              />
            )}
          </>
        )}
      </Collapse.Panel>

      {/* 面板 4: 回传字段 */}
      <Collapse.Panel header="回传字段" key="4">
        {fieldList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            <p>请先在上方「飞书基础参数」面板中点击「更新字段列表」按钮</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddWriteBackField}>
                  添加回写字段
                </Button>
                <Button icon={<SyncOutlined />} onClick={handleRefreshFields} loading={loadingFields}>
                  刷新字段
                </Button>
              </Space>
            </div>
            {isMobile ? (
              <div>
                {writeBackFields.map((field, index) => renderMobileWriteBackCard(field, index))}
              </div>
            ) : (
              <Table
                columns={[
                  {
                    title: '飞书字段名',
                    dataIndex: 'fieldName',
                    key: 'fieldName',
                    render: (_: string, record: WriteBackField, index: number) => (
                      <Select
                        value={record.fieldName}
                        onChange={(value) => handleWriteBackFieldChange(index, 'fieldName', value)}
                        style={{ width: '100%' }}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                      >
                        {fieldList.map((f) => (
                          <Option key={f.fieldName} value={f.fieldName}>
                            {f.fieldName}
                          </Option>
                        ))}
                      </Select>
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
                    title: 'JSON 路径（可选）',
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
                scroll={{ x: 600 }}
              />
            )}
          </>
        )}
      </Collapse.Panel>
    </>
  );

  // 金蝶参数面板内容
  const renderKingdeePanel = () => (
    <Form layout="vertical" size="large">
      <Form.Item label="App ID">
        <Input
          value={kingdeeConfig.loginParams.appId}
          onChange={(e) =>
            setKingdeeConfig({
              ...kingdeeConfig,
              loginParams: {
                ...kingdeeConfig.loginParams,
                appId: e.target.value,
              },
            })
          }
          size="large"
        />
      </Form.Item>
      <Form.Item label="App Secret">
        <Password
          value={kingdeeConfig.loginParams.appSecret}
          onChange={(e) =>
            setKingdeeConfig({
              ...kingdeeConfig,
              loginParams: {
                ...kingdeeConfig.loginParams,
                appSecret: e.target.value,
              },
            })
          }
          size="large"
        />
      </Form.Item>
      <Form.Item label="用户名">
        <Input
          value={kingdeeConfig.loginParams.username}
          onChange={(e) =>
            setKingdeeConfig({
              ...kingdeeConfig,
              loginParams: {
                ...kingdeeConfig.loginParams,
                username: e.target.value,
              },
            })
          }
          size="large"
        />
      </Form.Item>
      <Form.Item label="DB ID (数据中心 ID)">
        <Input
          value={kingdeeConfig.loginParams.dbId}
          onChange={(e) =>
            setKingdeeConfig({
              ...kingdeeConfig,
              loginParams: {
                ...kingdeeConfig.loginParams,
                dbId: e.target.value,
              },
            })
          }
          size="large"
        />
      </Form.Item>
      <Form.Item label="密码">
        <Password
          value={kingdeeConfig.loginParams.password}
          onChange={(e) =>
            setKingdeeConfig({
              ...kingdeeConfig,
              loginParams: {
                ...kingdeeConfig.loginParams,
                password: e.target.value,
              },
            })
          }
          size="large"
        />
      </Form.Item>
      <Form.Item label="API 地址">
        <Input
          value={kingdeeConfig.loginParams.baseUrl}
          onChange={(e) =>
            setKingdeeConfig({
              ...kingdeeConfig,
              loginParams: {
                ...kingdeeConfig.loginParams,
                baseUrl: e.target.value,
              },
            })
          }
          size="large"
        />
      </Form.Item>
      <Form.Item label="表单 ID">
        <Input
          value={kingdeeConfig.formId}
          onChange={(e) =>
            setKingdeeConfig({
              ...kingdeeConfig,
              formId: e.target.value,
            })
          }
          size="large"
        />
      </Form.Item>
      <Form.Item label="数据模板 (JSON)">
        <div style={{ marginBottom: 8, textAlign: 'right' }}>
          <Button
            size="small"
            onClick={() => {
              Modal.info({
                title: '选择变量插入',
                content: (
                  <div>
                    <p>点击变量插入到模板中：</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                      {fieldParams.length === 0 ? (
                        <span style={{ color: '#999' }}>暂无变量，请先在飞书参数中添加字段参数</span>
                      ) : (
                        fieldParams.map((param) => (
                          <Button
                            key={param.id}
                            size="small"
                            onClick={() => {
                              const textarea = document.querySelector('textarea[data-template="kingdee"]') as HTMLTextAreaElement;
                              if (textarea) {
                                const cursorPos = textarea.selectionStart || kingdeeConfig.dataTemplate?.length || 0;
                                const textBefore = kingdeeConfig.dataTemplate?.substring(0, cursorPos) || '';
                                const textAfter = kingdeeConfig.dataTemplate?.substring(cursorPos) || '';
                                const variable = `{{${param.variableName}}}`;
                                const newTemplate = textBefore + variable + textAfter;
                                setKingdeeConfig({
                                  ...kingdeeConfig,
                                  dataTemplate: newTemplate,
                                });
                                Modal.destroyAll();
                                message.success(`已插入变量 {{${param.variableName}}}`);
                              }
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
            }}
          >
            导入变量
          </Button>
        </div>
        <TextArea
          data-template="kingdee"
          rows={10}
          value={kingdeeConfig.dataTemplate}
          onChange={(e) =>
            setKingdeeConfig({
              ...kingdeeConfig,
              dataTemplate: e.target.value,
            })
          }
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
          style={{ fontSize: '14px' }}
        />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={() => onTest('kingdee')} size="large">
            测试连接
          </Button>
          <Button type="default" onClick={() => onTest('kingdee-validate')} size="large">
            验证数据
          </Button>
          <Button type="primary" onClick={handleSave} size="large">
            保存配置
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );

  return (
    <div style={{ padding: '20px' }}>
      {/* 飞书配置 - 手风琴面板 */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          飞书参数配置
          <Button
            size="small"
            icon={<SyncOutlined spin={loadingFields} />}
            onClick={handleRefreshFields}
            loading={loadingFields}
          >
            更新字段列表
          </Button>
        </h3>
        <Collapse
          accordion
          activeKey={activeKey}
          onChange={(key) => setActiveKey(Array.isArray(key) ? key : [key])}
          size="large"
        >
          {renderCollapsePanel()}
        </Collapse>
      </div>

      {/* 金蝶配置 - 卡片形式 */}
      <div>
        <h3 style={{ marginBottom: '16px' }}>金蝶参数配置</h3>
        {renderKingdeePanel()}
      </div>

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
