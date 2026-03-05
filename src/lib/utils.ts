import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as a compact currency string (e.g., 4.9M) with TRUNCATION.
 * It specifically avoids rounding up (e.g., 4.99M becomes 4.9M).
 */
export function formatCurrency(value: number): string {
    if (!value) return "ZMW0";

    return `ZMW${value.toLocaleString("en-ZM")}`;
}

/**
 * Formats a number as a high-precision currency string.
 * Used for tooltips to show the exact, unrounded amount from the database.
 */
export function formatFullCurrency(amount: number) {
    return new Intl.NumberFormat("en-ZM", {
        style: "currency",
        currency: "ZMW",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}