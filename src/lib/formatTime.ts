/** `mm:ss`, clamped at zero. Shared by every exam timer. */
export function formatExamTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

/**
 * Contest clock readout.
 *
 * Identical to {@link formatExamTime} below one hour, and `hh:mm:ss` above it, so
 * a two hour set never renders as a misleading `120:00`.
 */
export function formatContestClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  if (seconds < 3600) return formatExamTime(seconds);
  const hours = Math.floor(seconds / 3600);
  return `${hours.toString().padStart(2, "0")}:${formatExamTime(seconds % 3600)}`;
}
