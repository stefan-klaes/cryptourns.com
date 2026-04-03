import { format, formatDistanceToNow } from "date-fns";

/** Relative time for the activity feed (e.g. "2 minutes ago"). */
export function formatFeedTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return formatDistanceToNow(d, { addSuffix: true });
}

/** Absolute date/time for tooltips and `title` on `<time>`. */
export function formatFeedTimestampAbsolute(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return format(d, "PPpp");
}
