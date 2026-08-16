/**
 * 督促文案库（按「提醒类型 × 语气」分池）
 *
 * 三种提醒类型：
 *  - NUDGE_*    周期催促（占位符：{count} 未完成任务数）
 *  - DEADLINE_* 截止警告（占位符：{title} 任务名 + {label} 剩余时间级别，如「1小时」「30分钟」「10分钟」）
 *  - OVERDUE_*  逾期警告（占位符：{title} 任务名）
 *
 * 三种语气（整体配比 5 : 3 : 2）：
 *  - *_CHEER 鼓励风（50%）：温柔鼓励、陪跑式，熊秘书的暖心面
 *  - *_NUDGE 督促风（30%）：秘书式中性提醒，推一把
 *  - *_HARSH 狠话风（20%）：自嘲熊毒舌，扎心但不伤人
 *
 * 抽选统一走 {@link pickByTone}，保证所有系统提醒 Toast 语气「以鼓励为主」。
 */

/* ------------------------------------------------------------------ *
 * 一、周期催促（{count}）
 * ------------------------------------------------------------------ */

/** 周期催促 · 鼓励风（10条）- 占位符 {count} */
export const NUDGE_CHEER: string[] = [
  '您已经很努力啦！还剩 {count} 个任务，熊为您打 call！',
  '太棒了，进度稳稳的！只剩 {count} 个任务，您是效率之王！',
  '进展不错！还有 {count} 个任务，再接再厉~',
  '了不起！把这 {count} 个任务收掉，今天就全清啦！',
  '熊好开心！只剩 {count} 个任务，保持这个节奏！',
  '相信熊，您完全搞得定这 {count} 个任务，慢慢来也没关系~',
  '{count} 个任务而已，对您来说小菜一碟，冲鸭！',
  '深呼吸，挑个最简单的先开始~ {count} 个任务，一步一步来就好。',
  '今天辛苦了！剩下 {count} 个任务做完，就可以好好休息啦~',
  '熊在这儿陪着您！{count} 个任务，我们一起把它们拿下~',
];

/** 周期催促 · 督促风（12条）- 占位符 {count} */
export const NUDGE_NUDGE: string[] = [
  '还有 {count} 个任务没完成，别摸鱼了！',
  '主人，您还有 {count} 个待办事项等待处理哦~',
  '提醒一下，{count} 个任务还在排队呢，该动起来了！',
  '已经歇够了吧？{count} 个任务等着您呢！',
  '时间不等人，{count} 个任务还在路上！',
  '休息结束！{count} 个任务请求您的关注！',
  '您的专属秘书提醒：还有 {count} 个任务未完成！',
  '任务清单还有 {count} 项，加油加油！',
  '今日事今日毕，还有 {count} 个任务！',
  '嘀嘀嘀——{count} 个任务提醒，请查收！',
  '效率时间到！{count} 个任务等您来消灭！',
  '任务进度提醒：剩余 {count} 个任务未完成，冲鸭！',
];

/** 周期催促 · 狠话风（6条）- 占位符 {count}，熊式毒舌 */
export const NUDGE_HARSH: string[] = [
  '再不动手，{count} 个任务要造反了！熊已放弃治疗…',
  '{count} 个任务在角落里长蘑菇了，熊都替您社死了。',
  '拖延冠军就是您吧？{count} 个任务原地积灰中，熊看不下去了。',
  '熊数了三遍，还是 {count} 个没动，怀疑您在跟任务玩冷战。',
  '{count} 个任务哭着来找熊告状了，熊只能说：确实是您的错。',
  '别装忙了，{count} 个任务一个都没少，熊已经记在小本本上了。',
];

/* ------------------------------------------------------------------ *
 * 二、截止警告（{title} + {label}）
 * ------------------------------------------------------------------ */

/** 截止警告 · 鼓励风（4条）- 占位符 {title} / {label} */
export const DEADLINE_CHEER: string[] = [
  '任务「{title}」只剩{label}了，您一定来得及，冲鸭！',
  '💪 「{title}」还剩{label}，专注一下就搞定，熊相信您！',
  '🌟 别慌！任务「{title}」还有{label}，从容做完完全够用~',
  '🐻 熊来陪跑！任务「{title}」只剩{label}了，我们一起冲到终点！',
];

/** 截止警告 · 督促风（4条）- 占位符 {title} / {label} */
export const DEADLINE_NUDGE: string[] = [
  '⏳ 任务「{title}」只剩{label}了，该准备收尾了哦~',
  '📋 秘书提醒：「{title}」还有{label}到期，请安排一下。',
  '⌛ 「{title}」倒计时{label}，先把手机放下吧~',
  '🔖 任务「{title}」还剩{label}，现在开始正合适。',
];

/** 截止警告 · 狠话风（10条）- 占位符 {title} / {label}（沿用原 URGENT_MESSAGES） */
export const DEADLINE_HARSH: string[] = [
  '⚠️ 紧急！任务「{title}」还有{label}就截止了，赶紧行动！',
  '🔥 任务「{title}」只剩{label}了！立刻马上！',
  '🚨 最后{label}！任务「{title}」即将超时！',
  '⏰ 时间到啦！任务「{title}」还剩{label}，快快快！',
  '⚡ 紧急通知：「{title}」截止倒计时{label}！',
  '📢 别犹豫了！任务「{title}」只剩{label}！',
  '🎯 冲刺时间！任务「{title}」剩余{label}！',
  '💫 任务「{title}」还有{label}到期，现在就做！',
  '🔔 倒计时{label}！任务「{title}」需要您的关注！',
  '❗ 最紧急提醒：「{title}」仅剩{label}，十万火急！',
];

/* ------------------------------------------------------------------ *
 * 三、逾期警告（{title}）
 * ------------------------------------------------------------------ */

/** 逾期警告 · 鼓励风（4条）- 占位符 {title} */
export const OVERDUE_CHEER: string[] = [
  '任务「{title}」超时了，别灰心，现在补上还来得及！',
  '🌈 「{title}」虽然过期了，但做完依然算数，熊给您加油！',
  '🐻 熊不怪您~ 任务「{title}」现在开始，五分钟就能有进展！',
  '💪 「{title}」逾期没关系，重要的是继续，您可以的！',
];

/** 逾期警告 · 督促风（4条）- 占位符 {title} */
export const OVERDUE_NUDGE: string[] = [
  '📌 任务「{title}」已过截止时间，请尽快处理。',
  '⏱️ 「{title}」超时了，顺手把时间表也调整一下吧~',
  '📢 秘书通报：任务「{title}」已逾期，需要您确认后续安排。',
  '🗓️ 任务「{title}」欠账了，今天把它清掉吧。',
];

/** 逾期警告 · 狠话风（5条）- 占位符 {title}（沿用原 OVERDUE_MESSAGES） */
export const OVERDUE_HARSH: string[] = [
  '🔥 任务「{title}」已经超时了！熊急死了！',
  '⏰ 截止已过！任务「{title}」快做掉，别让熊一直慌！',
  '🚨 任务「{title}」逾期啦！现在补救还来得及！',
  '💢 拖延警告：任务「{title}」已超时，熊都替你着急了！',
  '⚡ 任务「{title}」逾期！立刻开始，拒绝继续拖延！',
];

/* ------------------------------------------------------------------ *
 * 四、向后兼容别名（旧变量名 → 新分池）
 * ------------------------------------------------------------------ */

/** @deprecated 请使用 {@link NUDGE_NUDGE} */
export const NUDGE_MESSAGES: string[] = NUDGE_NUDGE;

/** @deprecated 请使用 {@link NUDGE_CHEER} */
export const ENCOURAGE_MESSAGES: string[] = NUDGE_CHEER;

/** @deprecated 请使用 {@link DEADLINE_HARSH} */
export const URGENT_MESSAGES: string[] = DEADLINE_HARSH;

/** @deprecated 请使用 {@link OVERDUE_HARSH} */
export const OVERDUE_MESSAGES: string[] = OVERDUE_HARSH;

/* ------------------------------------------------------------------ *
 * 五、工具函数
 * ------------------------------------------------------------------ */

/**
 * 从数组中随机选取一条文案
 * @param messages 文案数组
 * @returns 随机选取的文案；数组为空时返回空字符串
 */
export function pickRandomMessage(messages: string[]): string {
  if (messages.length === 0) {
    return '';
  }
  const index = Math.floor(Math.random() * messages.length);
  return messages[index];
}

/**
 * 按 5:3:2（鼓励 : 督促 : 狠话）从三类语气池中随机抽一条文案
 *
 * 权重区间：
 *  - [0.0, 0.5) → 鼓励（50%）
 *  - [0.5, 0.8) → 督促（30%）
 *  - [0.8, 1.0) → 狠话（20%）
 *
 * @param cheer 鼓励风文案池
 * @param nudge 督促风文案池
 * @param harsh 狠话风文案池
 * @returns 抽中的文案模板（仍含占位符，需再经 formatMessage 处理）
 */
export function pickByTone(
  cheer: string[],
  nudge: string[],
  harsh: string[],
): string {
  const r: number = Math.random();
  if (r < 0.5) {
    return pickRandomMessage(cheer); // 50% 鼓励
  }
  if (r < 0.8) {
    return pickRandomMessage(nudge); // 30% 督促
  }
  return pickRandomMessage(harsh); // 20% 狠话
}

/**
 * 替换文案中的占位符
 * @param template 文案模板
 * @param params 替换参数
 * @returns 替换后的文案
 */
export function formatMessage(
  template: string,
  params: { count?: number; minutes?: number; label?: string; title?: string },
): string {
  let result = template;
  if (params.count !== undefined) {
    result = result.replace(/\{count\}/g, String(params.count));
  }
  if (params.minutes !== undefined) {
    result = result.replace(/\{minutes\}/g, String(params.minutes));
  }
  if (params.label !== undefined) {
    result = result.replace(/\{label\}/g, String(params.label));
  }
  if (params.title !== undefined) {
    result = result.replace(/\{title\}/g, params.title);
  }
  return result;
}
