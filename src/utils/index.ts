// Common utility functions

/**
 * Format a date to a readable string
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Capitalize the first letter of a string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Debounce function to limit how often a function can be called
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Generate a random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array)
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Format balance/price values for SMP currency
 * @param value - The value to format (string, number, or undefined)
 * @param options - Optional formatting options
 * @returns Formatted string with Vietnamese locale and SMP suffix
 */
export const formatBalance = (
  value: string | number | undefined | null,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSuffix?: boolean;
  }
): string => {
  if (value === undefined || value === null || value === '') {
    return '0 SMP';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0 SMP';
  }

  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 8,
    showSuffix = true
  } = options || {};

  const formatted = numValue.toLocaleString('vi-VN', {
    minimumFractionDigits,
    maximumFractionDigits
  });

  return showSuffix ? `${formatted} SMP` : formatted;
};

/**
 * Format price values for SMP currency (with 2 decimal places)
 * @param value - The value to format
 * @returns Formatted string with Vietnamese locale and SMP suffix
 */
export const formatPrice = (value: string | number | undefined | null): string => {
  return formatBalance(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
    showSuffix: true
  });
};

/**
 * Format registration fee values for SMP currency (with 0 decimal places)
 * @param value - The value to format
 * @returns Formatted string with Vietnamese locale and SMP suffix
 */
export const formatRegistrationFee = (value: string | number | undefined | null): string => {
  return formatBalance(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    showSuffix: true
  });
}; 