/**
 * Utility functions for formatting data in the content library
 */

/**
 * Formats a date/time into a relative time string (e.g., "3d ago", "2h ago")
 */
export const formatRelativeTime = (date: string | Date | undefined): string => {
  if (!date) return "";

  const now = new Date();
  const target = typeof date === "string" ? new Date(date) : date;
  
  // Handle invalid dates
  if (isNaN(target.getTime())) return "";

  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  // Less than 1 minute
  if (diffInSeconds < 60) {
    return "now";
  }

  // Less than 1 hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }

  // Less than 1 day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }

  // Less than 1 week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }

  // Less than 1 month (30 days)
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks}w ago`;
  }

  // Less than 1 year
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months}mo ago`;
  }

  // 1 year or more
  const years = Math.floor(diffInSeconds / 31536000);
  return `${years}y ago`;
};

/**
 * Truncates text to a specified length and adds ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

/**
 * Formats a user ID to a more readable format
 */
const formatUserId = (userId: string): string => {
  // If it looks like a UUID, show a shortened version or generic label
  if (userId && userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return "User"; // Or could be "Anonymous" or userId.substring(0, 8) for short ID
  }
  
  // Otherwise return as-is (for actual usernames)
  return userId;
};

/**
 * Formats a metadata string with creator and time
 */
export const formatMetadata = (createdBy?: string, createdAt?: string | Date): string => {
  if (!createdBy && !createdAt) return "";
  
  const timeStr = formatRelativeTime(createdAt);
  
  if (createdBy && timeStr) {
    const formattedUser = formatUserId(createdBy);
    return `${formattedUser} • ${timeStr}`;
  }
  
  if (createdBy) {
    return formatUserId(createdBy);
  }
  
  return timeStr || "";
};

/**
 * Formats duration in seconds to MM:SS format
 */
export const formatDuration = (seconds?: number): string => {
  if (!seconds) return "0:00";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};