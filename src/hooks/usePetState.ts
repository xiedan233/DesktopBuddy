import { useMemo } from 'react';
import type { Task } from '@shared/types/index';
import { getPetState } from '../utils/pet-states';

/**
 * usePetState - 宠物状态计算 Hook
 * 根据任务完成比例、是否有任务、是否有逾期任务综合计算宠物状态
 *
 * 状态优先级：
 * 1. PANICKING     - 有逾期未完成任务（deadline 已过且未完成）
 * 2. SLEEPING      - 无任务
 * 3. AWAKENING     - 有任务但 0% 完成
 * 4. STARTING      - 1-15% 完成
 * 5. BUSY          - 16-35% 完成
 * 6. WORKING       - 36-55% 完成
 * 7. HALFWAY       - 56-75% 完成
 * 8. ALMOST_DONE   - 76-95% 完成
 * 9. FINAL_SPRINT  - 96-99% 完成
 * 10. CELEBRATING  - 100% 完成
 *
 * @param tasks 任务列表
 * @returns 宠物状态、完成数量、总数、完成比例、是否有逾期
 */
export function usePetState(tasks: Task[]) {
  const {
    completedCount,
    totalCount,
    completionRatio,
    hasTasks,
    hasOverdueTasks,
    overdueCount,
  } = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const ratio = total === 0 ? 0 : completed / total;

    // 检测逾期任务：有截止时间、未完成、截止时间已过
    const now = Date.now();
    const overdue = tasks.filter((t) => {
      if (t.completed || !t.deadline) return false;
      const deadlineTime = new Date(t.deadline).getTime();
      return !isNaN(deadlineTime) && deadlineTime < now;
    });

    return {
      completedCount: completed,
      totalCount: total,
      completionRatio: ratio,
      hasTasks: total > 0,
      hasOverdueTasks: overdue.length > 0,
      overdueCount: overdue.length,
    };
  }, [tasks]);

  const petState = useMemo(() => {
    return getPetState(completionRatio, hasTasks, hasOverdueTasks);
  }, [completionRatio, hasTasks, hasOverdueTasks]);

  return {
    petState,
    completedCount,
    totalCount,
    completionRatio,
    hasOverdueTasks,
    overdueCount,
  };
}
