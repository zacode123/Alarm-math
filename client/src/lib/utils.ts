export function stripFileExtension(filename: string): string {
  // Only strip extension for display, don't modify actual filename
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex === -1 ? filename : filename.substring(0, lastDotIndex);
}


import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}