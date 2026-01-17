import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format nilai RX Power buat display
 * Tambahin unit dB dan warna based on value
 */
export function formatPower(power: number): { value: string; color: string } {
  const value = `${power.toFixed(2)} dB`

  // Warna based on SPEC/UNSPEC logic (Update: Threshold -24.89 dB sampai -13.5 dB)
  if (power >= -24.89 && power <= -13.5) {
    return { value, color: "text-green-600 dark:text-green-400" }
  }
  return { value, color: "text-red-600 dark:text-red-400" }
}

/**
 * Dapetin warna badge based on status
 */
export function getStatusColor(status: string): string {
  const statusUpper = status.toUpperCase()

  const colorMap: Record<string, string> = {
    "SPEC": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "UNSPEC": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    "ONLINE": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "OFFLINE": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    "KENDALA": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    "CLOSE": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "PROGRESS": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  }

  return colorMap[statusUpper] || "bg-gray-100 text-gray-800"
}

/**
 * Format angka dengan thousand separator
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('id-ID')
}

/**
 * Format persentase
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}
