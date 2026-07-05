import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { BUSINESS_TZ } from '@/lib/constants'

type Instant = Date | string | number

/** The business calendar date (YYYY-MM-DD) for an instant, in Asia/Riyadh. */
export function businessDate(instant: Instant): string {
  return formatInTimeZone(new Date(instant), BUSINESS_TZ, 'yyyy-MM-dd')
}

/** Format an instant for display in the business timezone. */
export function formatRiyadh(instant: Instant, pattern = 'yyyy-MM-dd HH:mm'): string {
  return formatInTimeZone(new Date(instant), BUSINESS_TZ, pattern)
}

/** Convert an instant to a Date whose fields read as Asia/Riyadh local time. */
export function toRiyadh(instant: Instant): Date {
  return toZonedTime(new Date(instant), BUSINESS_TZ)
}
