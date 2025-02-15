
export function stripFileExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '');
}


import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
