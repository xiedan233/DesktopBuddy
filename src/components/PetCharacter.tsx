import { PetState } from '../types';

/**
 * PetCharacter - 宠物角色组件
 * 直接显示自嘲熊表情包 GIF 动图
 * 根据任务完成度状态切换不同 GIF
 *
 * 10 状态映射：
 * - SLEEPING:     无任务，熊在睡觉
 * - AWAKENING:    有任务但 0% 完成，刚醒来
 * - STARTING:     1-15%，开始动起来
 * - BUSY:         16-35%，忙得团团转
 * - WORKING:      36-55%，认真工作中
 * - HALFWAY:      56-75%，过半啦
 * - ALMOST_DONE:  76-95%，看到曙光
 * - FINAL_SPRINT: 96-99%，最后冲刺
 * - CELEBRATING:  100%，全部搞定
 * - PANICKING:    有逾期任务，急死了
 */

interface PetCharacterProps {
  state: PetState;
}

/** 每个状态对应的 GIF 路径（放在 public/pet-gifs/ 目录下） */
const PET_GIF_MAP: Record<PetState, string> = {
  [PetState.SLEEPING]: 'pet-gifs/sleeping.gif',
  [PetState.AWAKENING]: 'pet-gifs/awakening.gif',
  [PetState.STARTING]: 'pet-gifs/starting.gif',
  [PetState.BUSY]: 'pet-gifs/busy.gif',
  [PetState.WORKING]: 'pet-gifs/working.gif',
  [PetState.HALFWAY]: 'pet-gifs/halfway.gif',
  [PetState.ALMOST_DONE]: 'pet-gifs/almost-done.gif',
  [PetState.FINAL_SPRINT]: 'pet-gifs/final-sprint.gif',
  [PetState.CELEBRATING]: 'pet-gifs/celebrating.gif',
  [PetState.PANICKING]: 'pet-gifs/panicking.gif',
};

export default function PetCharacter({
  state,
}: PetCharacterProps): JSX.Element {
  return (
    <div
      className="pet-transition h-full w-full animate-fade-in-scale"
      key={state}
    >
      <img
        src={PET_GIF_MAP[state]}
        alt="自嘲熊"
        className="h-full w-full object-contain"
        draggable={false}
      />
    </div>
  );
}
