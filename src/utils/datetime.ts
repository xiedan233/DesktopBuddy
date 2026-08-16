/**
 * 把 deadline ISO 字符串归一化为毫秒时间戳。
 * 无效值或空值返回 null，调用方用时间戳比较即可忽略字符串格式差异。
 */
export function deadlineToTs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}
