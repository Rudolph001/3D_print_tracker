/**
 * Convert decimal hours to hours, minutes, and seconds format
 * @param hours - Time in decimal hours (e.g., 1.5 = 1 hour 30 minutes)
 * @returns Formatted string like "1h 30m 0s" or "2h 15m 30s"
 */
export function formatPrintTime(hours: number): string {
  if (hours <= 0) return "0h 0m 0s";
  
  const totalMinutes = hours * 60;
  const wholeHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = Math.floor(totalMinutes % 60);
  const seconds = Math.round((totalMinutes % 1) * 60);
  
  return `${wholeHours}h ${remainingMinutes}m ${seconds}s`;
}

/**
 * Convert time in hours, minutes, seconds format back to decimal hours
 * @param timeString - Time string like "1h 30m 0s"
 * @returns Decimal hours (e.g., 1.5)
 */
export function parseTimeToHours(timeString: string): number {
  const hourMatch = timeString.match(/(\d+)h/);
  const minuteMatch = timeString.match(/(\d+)m/);
  const secondMatch = timeString.match(/(\d+)s/);
  
  const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
  const seconds = secondMatch ? parseInt(secondMatch[1]) : 0;
  
  return hours + (minutes / 60) + (seconds / 3600);
}