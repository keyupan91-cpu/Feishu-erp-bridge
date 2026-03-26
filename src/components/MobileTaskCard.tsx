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
 * 绉诲姩绔换鍔″崱鐗囩粍浠?
 * - 触摸友好的大按钮
 * - 绠€娲佺殑淇℃伅灞曠ず
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
          onClick={(e) => {
            e.stopPropagation();
            onExecute?.();
          }}
          disabled={!task.enabled}
          className="execute-btn"
          block
          style={{ pointerEvents: 'auto' }}
        >
          {task.enabled ? '执行' : '已禁用'}
        </Button>
        <Button
          size="middle"
          icon={<SettingOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onConfig?.();
          }}
          className="config-btn"
          block
          style={{ pointerEvents: 'auto' }}
        >
          配置
        </Button>
        <Button
          type="default"
          size="middle"
          icon={<ThunderboltOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onTest?.();
          }}
          className="test-btn"
          block
          style={{ pointerEvents: 'auto' }}
        >
          测试
        </Button>
        <Button
          size="middle"
          icon={<CloudSyncOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className="toggle-btn"
          block
          style={{ pointerEvents: 'auto' }}
        >
          {task.enabled ? '禁用' : '启用'}
        </Button>
      </div>

      <style>{`
        .mobile-task-card {
          margin-bottom: 14px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #d9e1e7;
          background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
          box-shadow: 0 8px 20px rgba(90, 110, 126, 0.08);
        }

        .mobile-task-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }

        .mobile-task-card-info {
          flex: 1;
          min-width: 0;
        }

        .mobile-task-card-title {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 700;
          color: #2f4454;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mobile-task-card-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .mobile-task-card-body {
          margin-bottom: 10px;
          padding: 8px 10px;
          background: #f4f8fb;
          border: 1px solid #e2e9ee;
          border-radius: 10px;
        }

        .mobile-task-card-row {
          display: flex;
          align-items: flex-start;
          margin-bottom: 6px;
          font-size: 14px;
          line-height: 1.5;
        }

        .mobile-task-card-row .label {
          color: #677a89;
          font-weight: 500;
          margin-right: 8px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .mobile-task-card-row .value {
          color: #33495b;
          word-break: break-word;
          flex: 1;
        }

        .mobile-task-card-description {
          display: flex;
          align-items: flex-start;
          font-size: 13px;
          line-height: 1.5;
          color: #5d7080;
          background: #edf3f7;
          padding: 8px 12px;
          border-radius: 8px;
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
          flex-wrap: wrap;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid #e2e9ef;
        }

        .mobile-task-card-footer .ant-btn {
          min-height: 40px;
          border-radius: 10px;
          font-weight: 600;
        }

        .mobile-task-card-footer .execute-btn {
          flex: 1 1 100%;
        }

        .mobile-task-card-footer .config-btn,
        .mobile-task-card-footer .test-btn,
        .mobile-task-card-footer .toggle-btn {
          flex: 1 1 calc(33.333% - 6px);
          min-width: 92px;
        }
      `}</style>
    </Card>
  );
}

/**
 * 绉诲姩绔换鍔″疄渚嬬姸鎬佸崱鐗?
 */
export interface MobileTaskInstanceCardProps {
  instance: TaskInstance;
  taskName?: string; // 鍙€夌殑浠诲姟鍚嶇О
  onStop?: () => void;
  onDelete?: () => void;
  onViewLogs?: () => void;
  latestLog?: { timestamp: string; message: string; level: string }; // 鏈€鏂版棩蹇楋紙浠庡閮ㄤ紶鍏ワ級
}

export function MobileTaskInstanceCard({
  instance,
  taskName,
  onStop,
  onDelete,
  onViewLogs,
  latestLog,
}: MobileTaskInstanceCardProps) {
  const getStatusConfig = () => {
    switch (instance.status) {
      case TaskStatus.RUNNING:
        return { icon: <PlayCircleOutlined />, color: 'blue', text: '运行中' };
      case TaskStatus.PAUSED:
        return { icon: <ClockCircleOutlined />, color: 'orange', text: '停止中' };
      case TaskStatus.SUCCESS:
        return { icon: <CheckCircleOutlined />, color: 'green', text: '已完成' };
      case TaskStatus.ERROR:
        return { icon: <CloseCircleOutlined />, color: 'red', text: '失败' };
      case TaskStatus.WARNING:
        return { icon: <CloseCircleOutlined />, color: 'orange', text: '部分成功' };
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

      {latestLog ? (
        <div className="mobile-instance-logs">
          <div className="log-entry">
            <span className="log-time">
              {new Date(latestLog.timestamp).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <span className="log-message">
              {latestLog.message}
            </span>
          </div>
        </div>
      ) : (
        <div className="mobile-instance-logs" style={{ textAlign: 'center', color: '#888' }}>
          暂无日志
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
          {instance.status !== TaskStatus.RUNNING && instance.status !== TaskStatus.PAUSED && instance.status !== TaskStatus.IDLE && onDelete && (
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
          margin-bottom: 14px;
          border-radius: 14px;
          background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
          border: 1px solid #d9e1e7;
          box-shadow: 0 8px 20px rgba(90, 110, 126, 0.08);
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
          font-weight: 700;
          color: #2f4454;
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
          background: #dee7ef;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #617f93 0%, #7f9caf 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 13px;
          font-weight: 600;
          color: #4f677b;
          min-width: 45px;
          text-align: right;
        }

        .mobile-instance-time {
          background: #f2f7fa;
          border: 1px solid #dee6ec;
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
          color: #697e8d;
          margin-right: 8px;
          white-space: nowrap;
        }

        .time-row .value {
          color: #30495a;
          word-break: break-word;
        }

        .mobile-instance-logs {
          background: #f6f9fc;
          color: #344b5d;
          border: 1px dashed #d5e0e8;
          padding: 10px 12px;
          border-radius: 8px;
          margin-bottom: 12px;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 12px;
          max-height: 100px;
          overflow-y: auto;
        }

        .log-entry {
          display: flex;
          gap: 8px;
        }

        .log-time {
          color: #648094;
          white-space: nowrap;
        }

        .log-message {
          word-break: break-word;
        }

        .mobile-instance-footer {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid #e2e9ef;
        }

        .mobile-instance-footer .ant-btn {
          min-height: 40px;
          border-radius: 10px;
          font-weight: 600;
        }
      `}</style>
    </Card>
  );
}

