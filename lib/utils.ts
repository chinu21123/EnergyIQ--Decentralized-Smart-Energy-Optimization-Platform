import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface UserData {
  username: string
  full_name: string
  flat_number: string
  email: string
  phone_number: string
  energy_balance: number
  credits: number
}

/**
 * Safely parse user data from localStorage
 * Handles invalid JSON, missing data, and malformed values
 * @param value - The raw value from localStorage
 * @returns Parsed user object or null if invalid
 */
export function safeParseUser(value: string | null): UserData | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value)
    
    // Validate that it has the required fields
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.username === 'string' &&
      typeof parsed.full_name === 'string'
    ) {
      return parsed as UserData
    }
    
    return null
  } catch (error) {
    // Invalid JSON, remove corrupted data
    console.error('Failed to parse user data from localStorage:', error)
    try {
      localStorage.removeItem('energyflow_user')
    } catch (e) {
      console.error('Failed to remove corrupted user data:', e)
    }
    return null
  }
}
