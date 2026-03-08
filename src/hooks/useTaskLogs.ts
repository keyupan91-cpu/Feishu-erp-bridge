// 任务日志 Hook - 按需从 IndexedDB 加载日志，不占用常驻内存
import { useState, useEffect, useCallback } from 'react';
import { logStorage } from '../services/logStorage';
import type { TaskLog, WebAPILog } from '../types';

interface UseTaskLogsOptions {
  instanceId?: string;           // 任务实例 ID
  initialLimit?: number;         // 初始加载数量
  enablePolling?: boolean;       // 是否启用轮询（实时更新）
  pollingInterval?: number;      // 轮询间隔（毫秒）
}

interface UseTaskLogsReturn {
  taskLogs: TaskLog[];
  webApiLogs: WebAPILog[];
  totalTaskLogs: number;
  totalWebApiLogs: number;
  isLoading: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTaskLogs(options: UseTaskLogsOptions): UseTaskLogsReturn {
  const {
    instanceId,
    initialLimit = 50,
    enablePolling = false,
    pollingInterval = 1000,
  } = options;

  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [webApiLogs, setWebApiLogs] = useState<WebAPILog[]>([]);
  const [totalTaskLogs, setTotalTaskLogs] = useState(0);
  const [totalWebApiLogs, setTotalWebApiLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(initialLimit);

  // 加载日志
  const loadLogs = useCallback(async (isRefresh = false) => {
    if (!instanceId) {
      setTaskLogs([]);
      setWebApiLogs([]);
      setTotalTaskLogs(0);
      setTotalWebApiLogs(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentOffset = isRefresh ? 0 : offset;
      const currentLimit = isRefresh ? Math.max(limit, initialLimit) : limit;

      const [taskLogsResult, webApiLogsResult, countResult] = await Promise.all([
        logStorage.getTaskLogs(instanceId, {
          limit: currentLimit,
          offset: currentOffset,
          reverse: true, // 最新的在前
        }),
        logStorage.getWebApiLogs(instanceId, {
          limit: currentLimit,
          offset: currentOffset,
          reverse: true,
        }),
        logStorage.getLogCount(instanceId),
      ]);

      setTaskLogs(taskLogsResult);
      setWebApiLogs(webApiLogsResult);
      setTotalTaskLogs(countResult.taskLogs);
      setTotalWebApiLogs(countResult.webApiLogs);
      setOffset(currentOffset + currentLimit);
      setLimit(currentLimit);
    } catch (err: any) {
      setError(err.message || '加载日志失败');
    } finally {
      setIsLoading(false);
    }
  }, [instanceId, offset, limit, initialLimit]);

  // 加载更多
  const loadMore = useCallback(async () => {
    if (!instanceId || isLoading) return;

    const { logStorage } = await import('../services/logStorage');
    const [newTaskLogs, newWebApiLogs] = await Promise.all([
      logStorage.getTaskLogs(instanceId, {
        limit,
        offset,
        reverse: true,
      }),
      logStorage.getWebApiLogs(instanceId, {
        limit,
        offset,
        reverse: true,
      }),
    ]);

    setTaskLogs(prev => [...prev, ...newTaskLogs]);
    setWebApiLogs(prev => [...prev, ...newWebApiLogs]);
    setOffset(prev => prev + limit);
  }, [instanceId, isLoading, offset, limit]);

  // 刷新
  const refresh = useCallback(() => loadLogs(true), [loadLogs]);

  // 初始加载
  useEffect(() => {
    loadLogs();
  }, [instanceId]);

  // 轮询更新
  useEffect(() => {
    if (!enablePolling || !instanceId) return;

    const interval = setInterval(() => {
      loadLogs(true);
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [instanceId, enablePolling, pollingInterval, loadLogs]);

  return {
    taskLogs,
    webApiLogs,
    totalTaskLogs,
    totalWebApiLogs,
    isLoading,
    error,
    loadMore,
    refresh,
  };
}

export default useTaskLogs;
