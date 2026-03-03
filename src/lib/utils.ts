import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as a compact currency string.
 * Uses exactly one decimal place for a clean yet descriptive look.
 */
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ZMW',
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(amount);
}

/**
 * Formats a number as a full, high-precision currency string.
 * Used for tooltips to show the exact, unrounded amount.
 * maximumFractionDigits is set high to ensure no data is lost.
 */
export function formatFullCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ZMW',
    minimumFractionDigits: 2,
    maximumFractionDigits: 20,
  }).format(amount);
}
