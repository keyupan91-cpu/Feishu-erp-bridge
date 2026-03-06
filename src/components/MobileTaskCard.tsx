import { Button, Card, Tag } from 'antd';
import {
  CloudSyncOutlined,
  SettingOutlined,
  StopOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { TaskConfig, TaskInstance } from '../types';
import { TaskStatus } from '../types';

/**
 * 移动端任务卡片组件
 * - 触摸友好的大按钮
 * - 简洁的信息展示
 * - 支持横向滑动
 */
export interface MobileTaskCardProps {
  task: TaskConfig;
  onEdit?: () => void;
  onConfig?: () => void;
  onTest?: () => void;
  onToggle?: () => void;
  onExecute?: () => void;
}

export function MobileTaskCard({
  task,
  onConfig,
  onTest,
  onToggle,
  onExecute,
}: MobileTaskCardProps) {
  const getStatusTag = () => {
    if (task.enabled) {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          已启用
        </Tag>
      );
    }
    return (
      <Tag icon={<CloseCircleOutlined />} color="default">
        已禁用
      </Tag>
    );
  };

  const getScheduleTag = () => {
    // 当前版本暂不支持定时调度功能
    return null;
  };

  return (
    <Card
      className="mobile-task-card"
      size="small"
      bodyStyle={{ padding: '12px 16px' }}
    >
      <div className="mobile-task-card-header">
        <div className="mobile-task-card-info">
          <h3 className="mobile-task-card-title">{task.name}</h3>
          <div className="mobile-task-card-tags">
            {getStatusTag()}
            {getScheduleTag()}
          </div>
        </div>
      </div>

      <div className="mobile-task-card-body">
        <div className="mobile-task-card-row">
          <span className="label">源：</span>
          <span className="value">飞书 · {task.feishuConfig?.tableId || '-'}</span>
        </div>
        <div className="mobile-task-card-row">
          <span className="label">目标：</span>
          <span className="value">金蝶 · {task.kingdeeConfig?.formId || '-'}</span>
        </div>
        {task.description && (
          <div className="mobile-task-card-description">
            <span className="label">说明：</span>
            <span className="value">{task.description}</span>
          </div>
        )}
      </div>

      <div className="mobile-task-card-footer">
        <Button
          type="primary"
          size="middle"
          icon={task.enabled ? <PlayCircleOutlined /> : <StopOutlined />}
          onClick={onExecute}
          disabled={!task.enabled}
          className="execute-btn"
          block
        >
          {task.enabled ? '执行' : '已禁用'}
        </Button>
        <Button
          size="middle"
          icon={<SettingOutlined />}
          onClick={onConfig}
          className="config-btn"
        >
          配置
        </Button>
        <Button
          size="middle"
          icon={<ThunderboltOutlined />}
          onClick={onTest}
          className="test-btn"
        >
          测试
        </Button>
        <Button
          size="middle"
          icon={<CloudSyncOutlined />}
          onClick={onToggle}
          className="toggle-btn"
        >
          {task.enabled ? '禁用' : '启用'}
        </Button>
      </div>

      <style>{`
        .mobile-task-card {
          margin-bottom: 12px;
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
        }

        .mobile-task-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .mobile-task-card-info {
          flex: 1;
          min-width: 0;
        }

        .mobile-task-card-title {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #2C3E50;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mobile-task-card-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .mobile-task-card-body {
          margin-bottom: 12px;
        }

        .mobile-task-card-row {
          display: flex;
          align-items: flex-start;
          margin-bottom: 6px;
          font-size: 14px;
          line-height: 1.5;
        }

        .mobile-task-card-row .label {
          color: #5D6D7E;
          font-weight: 500;
          margin-right: 8px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .mobile-task-card-row .value {
          color: #2C3E50;
          word-break: break-word;
          flex: 1;
        }

        .mobile-task-card-description {
          display: flex;
          align-items: flex-start;
          font-size: 13px;
          line-height: 1.5;
          color: #5D6D7E;
          background: #F8FAFC;
          padding: 8px 12px;
          border-radius: 6px;
          margin-top: 8px;
        }

        .mobile-task-card-description .label {
          font-weight: 500;
          margin-right: 8px;
          white-space: nowrap;
        }

        .mobile-task-card-description .value {
          word-break: break-word;
        }

        .mobile-task-card-footer {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid #E8EDF2;
        }

        .mobile-task-card-footer .ant-btn {
          min-height: 44px;
          border-radius: 8px;
        }

        .mobile-task-card-footer .execute-btn {
          flex: 2;
        }

        .mobile-task-card-footer .config-btn,
        .mobile-task-card-footer .test-btn,
        .mobile-task-card-footer .toggle-btn {
          flex: 1;
        }

        /* 暗黑模式适配 */
        @media (prefers-color-scheme: dark) {
          .mobile-task-card {
            background: #1a1a2e;
          }

          .mobile-task-card-title,
          .mobile-task-card-row .value {
            color: #eaeaea;
          }

          .mobile-task-card-row .label,
          .mobile-task-card-description {
            color: #b8b8b8;
          }

          .mobile-task-card-description {
            background: #16213e;
          }

          .mobile-task-card-footer {
            border-top-color: #2a2a4e;
          }
        }
      `}</style>
    </Card>
  );
}

/**
 * 移动端任务实例状态卡片
 */
export interface MobileTaskInstanceCardProps {
  instance: TaskInstance;
  taskName?: string; // 可选的任务名称
  onStop?: () => void;
  onDelete?: () => void;
  onViewLogs?: () => void;
}

export function MobileTaskInstanceCard({
  instance,
  taskName,
  onStop,
  onDelete,
  onViewLogs,
}: MobileTaskInstanceCardProps) {
  const getStatusConfig = () => {
    switch (instance.status) {
      case TaskStatus.RUNNING:
        return { icon: <PlayCircleOutlined />, color: 'blue', text: '执行中' };
      case TaskStatus.SUCCESS:
        return { icon: <CheckCircleOutlined />, color: 'green', text: '已完成' };
      case TaskStatus.ERROR:
        return { icon: <CloseCircleOutlined />, color: 'red', text: '出错' };
      default:
        return { icon: <ClockCircleOutlined />, color: 'default', text: '等待中' };
    }
  };

  const statusConfig = getStatusConfig();

  const getProgressPercent = () => {
    if (instance.progress !== undefined) {
      return instance.progress;
    }
    return instance.status === TaskStatus.SUCCESS ? 100 : 0;
  };

  return (
    <Card
      className="mobile-instance-card"
      size="small"
      bodyStyle={{ padding: '12px 16px' }}
    >
      <div className="mobile-instance-header">
        <div className="mobile-instance-info">
          <h4 className="mobile-instance-title">
            {taskName || instance.taskId || '任务实例'}
          </h4>
          <div className="mobile-instance-meta">
            <Tag icon={statusConfig.icon} color={statusConfig.color as any}>
              {statusConfig.text}
            </Tag>
          </div>
        </div>
      </div>

      {instance.progress !== undefined && (
        <div className="mobile-instance-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${getProgressPercent()}%` }}
            />
          </div>
          <span className="progress-text">{getProgressPercent()}%</span>
        </div>
      )}

      <div className="mobile-instance-time">
        <div className="time-row">
          <span className="label">开始：</span>
          <span className="value">
            {instance.startTime
              ? new Date(instance.startTime).toLocaleString('zh-CN')
              : '-'}
          </span>
        </div>
        {instance.endTime && (
          <div className="time-row">
            <span className="label">结束：</span>
            <span className="value">
              {new Date(instance.endTime).toLocaleString('zh-CN')}
            </span>
          </div>
        )}
      </div>

      {instance.logs && instance.logs.length > 0 && (
        <div className="mobile-instance-logs">
          <div className="log-entry">
            <span className="log-time">
              {new Date(instance.logs[instance.logs.length - 1].timestamp).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <span className="log-message">
              {instance.logs[instance.logs.length - 1].message}
            </span>
          </div>
        </div>
      )}

      <div className="mobile-instance-footer">
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="middle"
            icon={<CloudSyncOutlined />}
            onClick={onViewLogs}
            style={{ flex: 1 }}
          >
            查看日志
          </Button>
          {instance.status === TaskStatus.RUNNING && onStop && (
            <Button
              size="middle"
              danger
              icon={<StopOutlined />}
              onClick={onStop}
            >
              停止
            </Button>
          )}
          {onDelete && (
            <Button
              size="middle"
              danger
              icon={<DeleteOutlined />}
              onClick={onDelete}
            />
          )}
        </div>
      </div>

      <style>{`
        .mobile-instance-card {
          margin-bottom: 12px;
          border-radius: 12px;
          background: #ffffff;
        }

        .mobile-instance-header {
          margin-bottom: 12px;
        }

        .mobile-instance-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mobile-instance-title {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #2C3E50;
        }

        .mobile-instance-progress {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: #E8EDF2;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4A90E2 0%, #7AB8F5 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 13px;
          font-weight: 600;
          color: #4A90E2;
          min-width: 45px;
          text-align: right;
        }

        .mobile-instance-time {
          background: #F8FAFC;
          padding: 10px 12px;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .time-row {
          display: flex;
          font-size: 13px;
          line-height: 1.5;
        }

        .time-row .label {
          color: #5D6D7E;
          margin-right: 8px;
          white-space: nowrap;
        }

        .time-row .value {
          color: #2C3E50;
          word-break: break-word;
        }

        .mobile-instance-logs {
          background: #1a1a2e;
          color: #eaeaea;
          padding: 10px 12px;
          border-radius: 8px;
          margin-bottom: 12px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 12px;
          max-height: 100px;
          overflow-y: auto;
        }

        .log-entry {
          display: flex;
          gap: 8px;
        }

        .log-time {
          color: #7AB8F5;
          white-space: nowrap;
        }

        .log-message {
          word-break: break-word;
        }

        .mobile-instance-footer {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid #E8EDF2;
        }

        .mobile-instance-footer .ant-btn {
          min-height: 44px;
          border-radius: 8px;
        }

        /* 暗黑模式适配 */
        @media (prefers-color-scheme: dark) {
          .mobile-instance-card {
            background: #1a1a2e;
          }

          .mobile-instance-title,
          .time-row .value {
            color: #eaeaea;
          }

          .mobile-instance-time {
            background: #16213e;
          }

          .time-row .label {
            color: #b8b8b8;
          }

          .progress-bar {
            background: #2a2a4e;
          }

          .mobile-instance-footer {
            border-top-color: #2a2a4e;
          }
        }
      `}</style>
    </Card>
  );
}
