import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatAmount(amount: string, decimals: number): string {
  if (!amount) return "0"
  const value = parseFloat(amount) / Math.pow(10, decimals)
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  })
}

export function formatUSD(amount?: string): string {
  if (!amount) return "$0.00"
  const value = parseFloat(amount)
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}


export function getStatusColor(status: string): string {
  switch (status) {
    case "NOT_FOUND":
      return "text-gray-500"
    case "INVALID":
      return "text-red-500"
    case "PENDING":
      return "text-yellow-500"
    case "DONE":
      return "text-green-500"
    case "FAILED":
      return "text-red-600"
    default:
      return "text-gray-400"
  }
}

export function getStatusBgColor(status: string): string {
  switch (status) {
    case "NOT_FOUND":
      return "bg-gray-100 dark:bg-gray-800"
    case "INVALID":
      return "bg-red-100 dark:bg-red-900/20"
    case "PENDING":
      return "bg-yellow-100 dark:bg-yellow-900/20"
    case "DONE":
      return "bg-green-100 dark:bg-green-900/20"
    case "FAILED":
      return "bg-red-100 dark:bg-red-900/20"
    default:
      return "bg-gray-100 dark:bg-gray-800"
  }
}

export function isValidTransactionHash(hash: string): boolean {
  if (!hash || typeof hash !== 'string') return false
  
  // Remove whitespace
  const cleanHash = hash.trim()
  
  // Check for Ethereum transaction hash format (0x + 64 hex characters)
  const ethHashRegex = /^0x[a-fA-F0-9]{64}$/
  return ethHashRegex.test(cleanHash)
}

export function formatTransactionHash(hash: string, length: number = 8): string {
  if (!hash || !isValidTransactionHash(hash)) return hash
  
  if (hash.length <= length * 2 + 2) return hash // If hash is short enough, return as is
  
  return `${hash.slice(0, length + 2)}...${hash.slice(-length)}`
}

export function getTransactionType(hash: string): 'ethereum' | 'lifi' | 'invalid' {
  if (!isValidTransactionHash(hash)) return 'invalid'
  
  // For now, we treat all valid hashes as potentially either type
  // In a real implementation, you might have more sophisticated detection
  return 'ethereum'
}
