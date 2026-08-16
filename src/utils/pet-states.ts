import { PetState } from '@shared/types/index';
import { PET_STATE_THRESHOLDS } from '@shared/types/index';

/** 宠物状态显示文本 */
export const PET_STATE_LABELS: Record<PetState, string> = {
  [PetState.SLEEPING]: '熊在睡觉…',
  [PetState.AWAKENING]: '熊刚醒来，还有活没干呢！',
  [PetState.STARTING]: '熊开始动起来啦～',
  [PetState.BUSY]: '熊忙得团团转！',
  [PetState.WORKING]: '熊认真工作中…',
  [PetState.HALFWAY]: '熊完成的任务过半啦！继续加油！',
  [PetState.ALMOST_DONE]: '熊看到曙光了！',
  [PetState.FINAL_SPRINT]: '最后冲刺！快了快了！',
  [PetState.CELEBRATING]: '熊全部搞定！太棒了！🎉',
  [PetState.PANICKING]: '熊急死了！有任务过期了！🔥',
};

/** 宠物状态对应的主题色（背景 + 文字 Tailwind 类名） */
export const PET_STATE_COLORS: Record<PetState, { bg: string; text: string }> = {
  [PetState.SLEEPING]: { bg: 'bg-gray-50', text: 'text-gray-400' },
  [PetState.AWAKENING]: { bg: 'bg-amber-50', text: 'text-amber-500' },
  [PetState.STARTING]: { bg: 'bg-orange-50', text: 'text-orange-400' },
  [PetState.BUSY]: { bg: 'bg-orange-50', text: 'text-orange-500' },
  [PetState.WORKING]: { bg: 'bg-blue-50', text: 'text-blue-500' },
  [PetState.HALFWAY]: { bg: 'bg-cyan-50', text: 'text-cyan-500' },
  [PetState.ALMOST_DONE]: { bg: 'bg-teal-50', text: 'text-teal-500' },
  [PetState.FINAL_SPRINT]: { bg: 'bg-primary/5', text: 'text-primary' },
  [PetState.CELEBRATING]: { bg: 'bg-accent/5', text: 'text-accent' },
  [PetState.PANICKING]: { bg: 'bg-red-50', text: 'text-red-500' },
};

/**
 * 根据完成比例和任务情况计算宠物状态
 *
 * 优先级：PANICKING（逾期）> SLEEPING（无任务）> AWAKENING（有任务0%完成）> 按完成比例梯度
 *
 * @param completionRatio 完成比例 (0.0 ~ 1.0)
 * @param hasTasks 是否有任务
 * @param hasOverdueTasks 是否有逾期未完成任务
 * @returns 对应的 PetState
 */
export function getPetState(
  completionRatio: number,
  hasTasks: boolean,
  hasOverdueTasks: boolean,
): PetState {
  // 逾期任务优先级最高
  if (hasOverdueTasks) {
    return PetState.PANICKING;
  }

  const ratio = Math.max(0, Math.min(1, completionRatio));

  // 无任务 → 睡觉
  if (!hasTasks) {
    return PetState.SLEEPING;
  }

  // 有任务但 0% 完成 → 刚醒来
  if (ratio === 0) {
    return PetState.AWAKENING;
  }

  // 按完成比例匹配
  for (const threshold of PET_STATE_THRESHOLDS) {
    // 跳过特殊状态（SLEEPING/AWAKENING 已在上面处理）
    if ('requiresNoTasks' in threshold) continue;

    if (ratio >= threshold.min && ratio <= threshold.max) {
      return threshold.state;
    }
  }

  return PetState.AWAKENING;
}
