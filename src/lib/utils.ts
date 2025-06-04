import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Copies the given text to the clipboard.
 * Uses the modern navigator.clipboard API.
 * Returns a promise that resolves on success or rejects on failure.
 */
export function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) {
    // Fallback or error handling for older browsers might be needed
    return Promise.reject("Clipboard API not available");
  }
  return navigator.clipboard.writeText(text);
}
