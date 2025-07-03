/**
 * Convert decimal hours to HH:MM:SS format
 * @param hours - Time in decimal hours (e.g., 1.5 = 1 hour 30 minutes)
 * @returns Formatted string like "1:30:00" or "0:10:59"
 */
export function formatPrintTime(hours: number): string {
  if (hours <= 0) return "0:00:00";
  
  const totalSeconds = Math.round(hours * 3600);
  const wholeHours = Math.floor(totalSeconds / 3600);
  const remainingMinutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${wholeHours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Convert HH:MM:SS format back to decimal hours
 * @param timeString - Time string like "1:30:00" or "0:10:59"
 * @returns Decimal hours (e.g., 1.5)
 */
export function parseTimeToHours(timeString: string): number {
  const parts = timeString.split(':');
  if (parts.length !== 3) return 0;
  
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  const seconds = parseInt(parts[2]) || 0;
  
  return hours + (minutes / 60) + (seconds / 3600);
}

/**
 * Validate time string format (HH:MM:SS)
 * @param timeString - Time string to validate
 * @returns true if valid format
 */
export function isValidTimeFormat(timeString: string): boolean {
  const timeRegex = /^\d{1,2}:\d{2}:\d{2}$/;
  if (!timeRegex.test(timeString)) return false;
  
  const parts = timeString.split(':');
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const seconds = parseInt(parts[2]);
  
  return minutes < 60 && seconds < 60;
}