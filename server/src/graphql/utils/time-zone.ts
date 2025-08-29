// src/utils/timeZone.ts

/**
 * Checks if a given string is a valid IANA time zone.
 * Example valid values: "UTC", "America/New_York", "Asia/Tokyo"
 */
export function isValidIANA(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}
