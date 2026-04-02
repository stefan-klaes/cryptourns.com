import { format, formatDistanceToNow } from "date-fns";

export function parseValidDate(
  input: Date | string | null | undefined,
): Date | null {
  if (input == null) return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Relative phrase (e.g. "2 days ago") plus absolute tooltip and `dateTime` for `<time>`. */
export function formatSentToUrnRelative(
  input: Date | string | null | undefined,
): {
  relative: string;
  absoluteTitle: string;
  dateTime: string;
} | null {
  const d = parseValidDate(input);
  if (!d) return null;
  return {
    relative: formatDistanceToNow(d, { addSuffix: true }),
    absoluteTitle: format(d, "PPpp"),
    dateTime: d.toISOString(),
  };
}
