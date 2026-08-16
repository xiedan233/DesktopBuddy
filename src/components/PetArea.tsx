import { useTaskContext } from '../store/TaskContext';
import { usePetState } from '../hooks/usePetState';
import PetCharacter from './PetCharacter';
import { PET_STATE_LABELS, PET_STATE_COLORS } from '../utils/pet-states';
import { PetState } from '../types';

/**
 * PetArea - 宠物角色区组件
 * 显示自嘲熊 GIF 表情包和当前状态文字
 * 根据任务完成度自动切换宠物状态（10 种状态）
 */
export default function PetArea(): JSX.Element {
  const { tasks } = useTaskContext();
  const {
    petState,
    completionRatio,
    completedCount,
    totalCount,
    hasOverdueTasks,
    overdueCount,
  } = usePetState(tasks);

  const colors = PET_STATE_COLORS[petState];
  const label = PET_STATE_LABELS[petState];

  // 完成度百分比
  const percent = Math.round(completionRatio * 100);

  return (
    <div
      className={`flex h-[120px] flex-col items-center justify-center gap-1 ${colors.bg} transition-colors duration-300`}
    >
      {/* 自嘲熊 GIF 表情包 */}
      <div className="h-[90px] w-[90px]">
        <PetCharacter state={petState} />
      </div>

      {/* 状态文字 + 进度 */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium ${colors.text}`}>{label}</span>
        {totalCount > 0 && (
          <span className="text-2xs text-gray-400">
            {hasOverdueTasks && petState === PetState.PANICKING
              ? `${overdueCount} 个逾期 · ${completedCount}/${totalCount}`
              : `${completedCount}/${totalCount} · ${percent}%`}
          </span>
        )}
      </div>
    </div>
  );
}
