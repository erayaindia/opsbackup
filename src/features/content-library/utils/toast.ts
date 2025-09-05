/**
 * Simple toast notification utility
 * Uses browser title for notifications as a lightweight solution
 */

let toastTimeout: NodeJS.Timeout | null = null;

export const showToast = (message: string, type: 'success' | 'error' = 'success', duration = 2000) => {
  // Clear any existing toast
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  // Store original title
  const originalTitle = document.title;
  
  // Set toast message in title
  const icon = type === 'success' ? '✓' : '✗';
  document.title = `${icon} ${message}`;
  
  // Restore original title after duration
  toastTimeout = setTimeout(() => {
    document.title = originalTitle;
    toastTimeout = null;
  }, duration);
};

export const showSuccessToast = (message: string) => {
  showToast(message, 'success');
};

export const showErrorToast = (message: string) => {
  showToast(message, 'error');
};