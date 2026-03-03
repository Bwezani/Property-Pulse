import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as a compact currency string (e.g., 4.9M) with TRUNCATION.
 * It specifically avoids rounding up (e.g., 4.99M becomes 4.9M).
 */
export function formatCurrency(amount: number) {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (absAmount >= 1_000_000) {
    // Truncate to 1 decimal place without rounding up
    const value = Math.floor((absAmount / 1_000_000) * 10) / 10;
    return `${sign}ZMW ${value.toFixed(1)}M`;
  }
  
  if (absAmount >= 1_000) {
    // Truncate to 1 decimal place without rounding up
    const value = Math.floor((absAmount / 1_000) * 10) / 10;
    return `${sign}ZMW ${value.toFixed(1)}K`;
  }
  
  // For smaller numbers, show standard 2 decimal places (no compact needed)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ZMW',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a number as a high-precision currency string.
 * Used for tooltips to show the exact, unrounded amount from the database.
 */
export function formatFullCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ZMW',
    minimumFractionDigits: 2,
    maximumFractionDigits: 20,
  }).format(amount);
}
