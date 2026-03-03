import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as a compact currency string.
 * Increased precision to 2 decimal places to minimize rounding error in the summary view.
 */
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ZMW',
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a number as a full, high-precision currency string.
 * Used for tooltips to show the exact, unrounded amount.
 */
export function formatFullCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ZMW',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
