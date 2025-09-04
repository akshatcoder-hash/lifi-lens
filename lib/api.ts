import { 
  StatusRequest, 
  StatusResponse, 
  BatchStatusRequest,
  BatchStatusResponse,
  ApiError 
} from '@/types/lifi'
import { lifiClient } from './lifi-client'
import { 
  parseStatusResponse, 
  ParsedStatusResponse,
  isValidTxHash 
} from './lifi-utils'

/**
 * Enhanced API interface using LiFiClient with caching and error handling
 */

/**
 * Get transaction status with enhanced parsing and error handling
 */
export async function getTransactionStatus(
  params: StatusRequest
): Promise<ParsedStatusResponse> {
  // Validate transaction hash format
  if (!isValidTxHash(params.txHash)) {
    throw new Error(`Invalid transaction hash format: ${params.txHash}`)
  }

  try {
    const response = await lifiClient.getStatus(params)
    return parseStatusResponse(response)
  } catch (error) {
    const apiError = error as ApiError
    console.error('Error fetching transaction status:', {
      txHash: params.txHash,
      error: apiError.message,
      code: apiError.code,
      isRetryable: apiError.isRetryable
    })
    throw error
  }
}

/**
 * Get raw transaction status without parsing (for compatibility)
 */
export async function getTransactionStatusRaw(
  params: StatusRequest
): Promise<StatusResponse> {
  return lifiClient.getStatus(params)
}

/**
 * Get multiple transaction statuses efficiently with batch processing
 */
export async function getMultipleStatuses(
  txHashes: string[],
  options?: {
    fromChain?: string
    toChain?: string
    bridge?: string
    parsed?: boolean
  }
): Promise<(ParsedStatusResponse | null)[]> {
  if (txHashes.length === 0) return []

  // Validate all transaction hashes
  const invalidHashes = txHashes.filter(hash => !isValidTxHash(hash))
  if (invalidHashes.length > 0) {
    throw new Error(`Invalid transaction hash formats: ${invalidHashes.join(', ')}`)
  }

  const batchRequest: BatchStatusRequest = {
    txHashes,
    fromChain: options?.fromChain,
    toChain: options?.toChain,
    bridge: options?.bridge
  }

  try {
    const batchResponse = await lifiClient.getBatchStatus(batchRequest)
    
    return batchResponse.results.map(result => {
      if (result.error) {
        console.error('Error in batch status request:', {
          txHash: result.txHash,
          error: result.error.message,
          code: result.error.code
        })
        return null
      }

      return result.data ? parseStatusResponse(result.data) : null
    })
  } catch (error) {
    console.error('Error fetching multiple transaction statuses:', error)
    throw error
  }
}

/**
 * Get multiple transaction statuses raw (without parsing)
 */
export async function getMultipleStatusesRaw(
  txHashes: string[],
  options?: {
    fromChain?: string
    toChain?: string
    bridge?: string
  }
): Promise<BatchStatusResponse> {
  const batchRequest: BatchStatusRequest = {
    txHashes,
    fromChain: options?.fromChain,
    toChain: options?.toChain,
    bridge: options?.bridge
  }

  return lifiClient.getBatchStatus(batchRequest)
}

/**
 * Poll transaction status until completion or failure
 */
export async function pollTransactionStatus(
  params: StatusRequest,
  options?: {
    maxAttempts?: number
    intervalMs?: number
    onUpdate?: (status: ParsedStatusResponse) => void
  }
): Promise<ParsedStatusResponse> {
  const maxAttempts = options?.maxAttempts ?? 60 // 5 minutes with 5s intervals
  const intervalMs = options?.intervalMs ?? 5000

  let attempts = 0
  
  while (attempts < maxAttempts) {
    try {
      const status = await getTransactionStatus(params)
      
      // Call update callback if provided
      options?.onUpdate?.(status)
      
      // Return if transaction is completed or failed
      if (status.isCompleted || status.isFailed) {
        return status
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, intervalMs))
      attempts++
      
    } catch (error) {
      const apiError = error as ApiError
      
      // If error is not retryable, throw immediately
      if (!apiError.isRetryable) {
        throw error
      }
      
      // For retryable errors, continue polling
      attempts++
      await new Promise(resolve => setTimeout(resolve, intervalMs))
    }
  }
  
  throw new Error(`Transaction status polling timed out after ${maxAttempts} attempts`)
}

/**
 * Clear API client cache
 */
export function clearCache(): void {
  lifiClient.clearCache()
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  lifiClient.clearExpiredCache()
}

// Re-export client for advanced usage
export { lifiClient }

// Re-export utilities for convenience
export * from './lifi-utils'
