export const DEFAULT_GREETING_TIME_ZONE = "Asia/Jakarta";

const GREETING_WINDOWS = [
  { beforeHour: 3, label: "Selamat dini hari" },
  { beforeHour: 6, label: "Selamat subuh" },
  { beforeHour: 12, label: "Selamat pagi" },
  { beforeHour: 15, label: "Selamat siang" },
  { beforeHour: 18, label: "Selamat sore" },
  { beforeHour: 24, label: "Selamat malam" },
] as const;

function getHourInTimeZone(date: Date, timeZone: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hourCycle: "h23",
    }).formatToParts(date);

    const value = parts.find((part) => part.type === "hour")?.value;
    if (value === undefined) return null;

    const hour = Number(value);
    return Number.isFinite(hour) ? hour % 24 : null;
  } catch {
    return null;
  }
}

/**
 * Greeting based on the visitor's local hour.
 *
 * Server components run in UTC on Vercel, so `new Date().getHours()` would be
 * wrong for Indonesian visitors. Callers should pass the timezone reported by
 * the platform (for example `x-vercel-ip-timezone`); WIB is the safe fallback.
 */
export function getGreeting(
  date: Date = new Date(),
  timeZone: string = DEFAULT_GREETING_TIME_ZONE,
): string {
  const hour =
    getHourInTimeZone(date, timeZone) ??
    getHourInTimeZone(date, DEFAULT_GREETING_TIME_ZONE) ??
    (date.getUTCHours() + 7) % 24;

  return (
    GREETING_WINDOWS.find((window) => hour < window.beforeHour)?.label ??
    "Selamat malam"
  );
}
