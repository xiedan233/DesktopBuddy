import type { Task, AppConfig, UrgentTaskInfo, NotifiedDeadline } from '@shared/types/index';
import { DeadlineLevel, DEADLINE_LEVELS } from '@shared/types/index';
import { deadlineToTs } from '@shared/utils/datetime';
import { TaskStore } from './store';
import { NotificationService } from './notification';

/**
 * ReminderScheduler - 双引擎提醒调度器
 * 引擎1：周期催促定时器（每 reminderInterval 分钟触发一次）
 * 引擎2：截止检查定时器（每 1 分钟触发一次）
 */
export class ReminderScheduler {
  private store: TaskStore;
  private notifier: NotificationService;
  private nudgeTimer: ReturnType<typeof setInterval> | null = null;
  private deadlineTimer: ReturnType<typeof setInterval> | null = null;
  private config: AppConfig;

  /** 截止检查间隔（毫秒），每 1 分钟检查一次 */
  private static readonly DEADLINE_CHECK_INTERVAL = 60 * 1000;

  constructor(store: TaskStore, notifier: NotificationService) {
    this.store = store;
    this.notifier = notifier;
    this.config = store.getConfig();
  }

  /**
   * 启动双引擎调度器
   * @param config 应用配置
   */
  start(config: AppConfig): void {
    this.config = config;
    this.stop();
    this.startNudgeTimer();
    this.startDeadlineTimer();
    console.log(
      `[ReminderScheduler] 已启动 - 催促间隔: ${config.reminderInterval}分钟, 截止检查: 1分钟`,
    );
  }

  /**
   * 停止所有定时器
   */
  stop(): void {
    if (this.nudgeTimer !== null) {
      clearInterval(this.nudgeTimer);
      this.nudgeTimer = null;
    }
    if (this.deadlineTimer !== null) {
      clearInterval(this.deadlineTimer);
      this.deadlineTimer = null;
    }
    console.log('[ReminderScheduler] 已停止');
  }

  /**
   * 更新催促间隔并重启催促定时器
   */
  updateInterval(minutes: number): void {
    this.config = { ...this.config, reminderInterval: minutes };
    this.startNudgeTimer();
    console.log(`[ReminderScheduler] 催促间隔已更新为 ${minutes} 分钟`);
  }

  /**
   * 启动周期催促定时器
   */
  private startNudgeTimer(): void {
    if (this.nudgeTimer !== null) {
      clearInterval(this.nudgeTimer);
    }
    const intervalMs = this.config.reminderInterval * 60 * 1000;
    this.nudgeTimer = setInterval(() => {
      this.runNudgeCheck();
    }, intervalMs);
  }

  /**
   * 启动截止检查定时器（每 1 分钟）
   */
  private startDeadlineTimer(): void {
    if (this.deadlineTimer !== null) {
      clearInterval(this.deadlineTimer);
    }
    this.deadlineTimer = setInterval(() => {
      this.runDeadlineCheck();
    }, ReminderScheduler.DEADLINE_CHECK_INTERVAL);
  }

  /**
   * 周期催促检查
   * 获取未完成任务，随机选文案发送催促通知
   */
  private runNudgeCheck(): void {
    const allTasks = this.store.getAll();
    const incompleteTasks = allTasks.filter((t) => !t.completed);
    const completedCount = allTasks.length - incompleteTasks.length;

    if (incompleteTasks.length === 0) {
      console.log('[ReminderScheduler] 无未完成任务，跳过催促');
      return;
    }

    // 优先催促逾期任务：只要存在未完成且已超期的任务，就用逾期文案持续弹窗
    // （截止检查引擎已负责「首次逾期」的一次性 Toast，这里保证逾期期间每个周期都提醒）
    const now = Date.now();
    const overdueTasks = incompleteTasks.filter(
      (t) =>
        t.deadline !== null && new Date(t.deadline as string).getTime() < now,
    );
    if (overdueTasks.length > 0) {
      console.log(
        `[ReminderScheduler] 催促检查: ${overdueTasks.length} 个逾期任务，优先弹逾期提醒`,
      );
      this.notifier.sendOverdue(overdueTasks);
      return;
    }

    console.log(
      `[ReminderScheduler] 催促检查: ${incompleteTasks.length} 个未完成任务`,
    );
    this.notifier.sendNudge(incompleteTasks, completedCount);
  }

  /**
   * 截止分级检查
   * 检查所有未完成且有截止时间的任务，判断是否触及新的截止级别
   * 合并通知并更新 notifiedDeadlines 去重
   */
  private runDeadlineCheck(): void {
    const allTasks = this.store.getAll();
    const now = Date.now();
    const urgentList: UrgentTaskInfo[] = [];
    const tasksToUpdate: Map<string, NotifiedDeadline[]> = new Map();

    // 筛选未完成且有截止时间的任务
    const tasksWithDeadline = allTasks.filter(
      (t) => !t.completed && t.deadline !== null,
    );
    const overdueList: Task[] = [];

    for (const task of tasksWithDeadline) {
      const deadlineTime = new Date(task.deadline as string).getTime();
      if (Number.isNaN(deadlineTime)) {
        continue;
      }

      const minutesLeft = (deadlineTime - now) / (60 * 1000);
      const taskTs = deadlineToTs(task.deadline);

      // 级别紧迫度（越大越紧迫）。用字符串索引，避免依赖枚举成员名。
      const URGENCY_MAP: Record<string, number> = {
        '1h': 1,
        '30min': 2,
        '10min': 3,
        overdue: 4,
      };
      const urgencyOf = (level: DeadlineLevel): number => URGENCY_MAP[level] ?? 0;

      // 已通知的「最紧迫级别」紧迫度（仅统计与当前截止时间匹配的）
      const notifiedUrgencies = (task.notifiedDeadlines ?? [])
        .filter((d) => deadlineToTs(d.deadline) === taskTs)
        .map((d) => urgencyOf(d.level));
      const maxNotified = notifiedUrgencies.length
        ? Math.max(...notifiedUrgencies)
        : 0;

      // 判断某级别是否已通知过：必须同时匹配「级别 + 截止时间（按毫秒时间戳比较，忽略字符串格式差异）」
      const isNotified = (level: DeadlineLevel): boolean =>
        task.notifiedDeadlines?.some(
          (d) => d.level === level && deadlineToTs(d.deadline) === taskTs,
        ) ?? false;

      // 已过期：触发一次性逾期通知
      if (minutesLeft < 0) {
        if (isNotified(DeadlineLevel.OVERDUE)) {
          console.log(
            `[runDeadlineCheck] 跳过已通知任务 ${task.title} level=${DeadlineLevel.OVERDUE} deadline=${task.deadline}`,
          );
          continue;
        }
        overdueList.push(task);
        const existing = tasksToUpdate.get(task.id) ?? [];
        existing.push({ level: DeadlineLevel.OVERDUE, deadline: task.deadline });
        tasksToUpdate.set(task.id, existing);
        console.log(
          `[runDeadlineCheck] 触发 ${task.title} level=${DeadlineLevel.OVERDUE} minutesLeft=${minutesLeft}`,
        );
        continue;
      }

      // 未过期：覆盖语义 —— 只弹「比已通知最紧迫级别更紧迫」且尚未通知的级别。
      // 已弹过更紧迫级别 → 更宽松级别视为已覆盖，整任务静默，杜绝逆序/回头弹。
      let bestLevel: { level: DeadlineLevel; label: string; minutesBefore: number } | null =
        null;
      for (const { level, minutesBefore, label } of DEADLINE_LEVELS) {
        if (
          minutesLeft <= minutesBefore &&
          urgencyOf(level) > maxNotified
        ) {
          if (
            bestLevel === null ||
            urgencyOf(level) > urgencyOf(bestLevel.level)
          ) {
            bestLevel = { level, label, minutesBefore };
          }
        }
      }
      if (bestLevel !== null) {
        urgentList.push({
          task,
          level: bestLevel.level,
          label: bestLevel.label,
          minutesLeft,
        });
        const existing = tasksToUpdate.get(task.id) ?? [];
        existing.push({ level: bestLevel.level, deadline: task.deadline });
        tasksToUpdate.set(task.id, existing);
        console.log(
          `[runDeadlineCheck] 触发 ${task.title} level=${bestLevel.level} minutesLeft=${minutesLeft}`,
        );
      } else {
        // 本轮无更紧迫未覆盖级别可弹（已覆盖或全已通知）→ 跳过
        console.log(
          `[runDeadlineCheck] 跳过(已覆盖) ${task.title} maxNotified=${maxNotified} minutesLeft=${minutesLeft}`,
        );
      }
    }

    // 先更新 notifiedDeadlines 并持久化（必须在发送通知之前，确保即使通知发送失败也已去重，下轮不再重复弹）
    if (tasksToUpdate.size > 0) {
      for (const [taskId, levels] of tasksToUpdate) {
        this.store.updateNotifiedDeadlines(taskId, levels);
      }
      this.store.persist();
    }

    if (urgentList.length > 0) {
      try {
        console.log(
          `[ReminderScheduler] 截止检查: 发现 ${urgentList.length} 个紧急任务`,
        );
        this.notifier.sendDeadlineWarning(urgentList);
      } catch (err) {
        console.error('[ReminderScheduler] 发送截止提醒失败（已记录去重）:', err);
      }
    }

    if (overdueList.length > 0) {
      try {
        console.log(
          `[ReminderScheduler] 截止检查: 发现 ${overdueList.length} 个逾期任务`,
        );
        this.notifier.sendOverdue(overdueList);
      } catch (err) {
        console.error('[ReminderScheduler] 发送逾期提醒失败（已记录去重）:', err);
      }
    }
  }
}
