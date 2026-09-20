const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const MONTHS_SHORT_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/**
 * Parse a date string as a LOCAL date (no UTC conversion).
 * Handles both "YYYY-MM-DD" and full ISO timestamps from TIMESTAMPTZ.
 * new Date("2026-10-10") in JS creates UTC midnight, which shifts -5h to Oct 9.
 * This function avoids that by extracting the parts manually.
 */
export function parseLocalDate(dateString: string): {
  year: number;
  month: number;
  day: number;
} {
  const datePart = dateString.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  return { year, month, day };
}

/**
 * Format "YYYY-MM-DD" as "10 de octubre de 2026" (Spanish, no timezone shift).
 */
export function formatDateLong(dateString: string): string {
  const { year, month, day } = parseLocalDate(dateString);
  return `${day} de ${MONTHS_ES[month - 1]} de ${year}`;
}

/**
 * Format "YYYY-MM-DD" as "10 oct 2026" (short Spanish, no timezone shift).
 */
export function formatDateShort(dateString: string): string {
  const { year, month, day } = parseLocalDate(dateString);
  return `${day} ${MONTHS_SHORT_ES[month - 1]} ${year}`;
}

/**
 * Format "YYYY-MM-DD" as "10/10/2026" (numeric, no timezone shift).
 */
export function formatDateNumeric(dateString: string): string {
  const { year, month, day } = parseLocalDate(dateString);
  return `${day}/${month}/${year}`;
}

/**
 * Check if a "YYYY-MM-DD" date is in the past (compared to today in local time).
 */
export function isDatePast(dateString: string): boolean {
  const { year, month, day } = parseLocalDate(dateString);
  const now = new Date();
  const dateObj = new Date(year, month - 1, day);
  return dateObj < new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
