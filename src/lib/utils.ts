import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as a compact currency string (e.g., ZMW 10K, ZMW 4.9M)
 */
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ZMW',
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(amount);
}

/**
 * Formats a number as a full currency string (e.g., ZMW 10,000.00)
 */
export function formatFullCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ZMW',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
