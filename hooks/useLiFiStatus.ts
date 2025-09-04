'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  getTransactionStatus, 
  getMultipleStatuses,
  pollTransactionStatus,
  ParsedStatusResponse
} from '@/lib/api'
import { ApiError } from '@/types/lifi'
import { StatusRequest } from '@/types/lifi'

interface UseTransactionStatusOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  maxRetries?: number
  onStatusChange?: (status: ParsedStatusResponse) => void
  onError?: (error: ApiError) => void
}

interface UseTransactionStatusReturn {
  status: ParsedStatusResponse | null
  loading: boolean
  error: ApiError | null
  refetch: () => Promise<void>
  startPolling: () => void
  stopPolling: () => void
  isPolling: boolean
}

/**
 * Hook for fetching and managing single transaction status
 */
export function useTransactionStatus(
  request: StatusRequest | null,
  options: UseTransactionStatusOptions = {}
): UseTransactionStatusReturn {
  const [status, setStatus] = useState<ParsedStatusResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  
  const {
    autoRefresh = false,
    refreshInterval = 10000,
    maxRetries = 3,
    onStatusChange,
    onError
  } = options

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)

  const fetchStatus = useCallback(async (showLoading = true) => {
    if (!request?.txHash) return

    if (showLoading) {
      setLoading(true)
    }
    setError(null)

    try {
      const result = await getTransactionStatus(request)
      setStatus(result)
      retryCountRef.current = 0
      onStatusChange?.(result)

      // Stop polling if transaction is completed or failed
      if (result.isCompleted || result.isFailed) {
        stopPolling()
      }
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError)
      onError?.(apiError)
      
      // Retry logic for retryable errors
      if (apiError.isRetryable && retryCountRef.current < maxRetries) {
        retryCountRef.current++
        setTimeout(() => fetchStatus(false), 2000 * retryCountRef.current)
      }
    } finally {
      setLoading(false)
    }
  }, [request, maxRetries, onStatusChange, onError])

  const refetch = useCallback(() => fetchStatus(true), [fetchStatus])

  const startPolling = useCallback(() => {
    if (isPolling) return

    setIsPolling(true)
    fetchStatus(false)
    
    pollingRef.current = setInterval(() => {
      fetchStatus(false)
    }, refreshInterval)
  }, [fetchStatus, refreshInterval, isPolling])

  const stopPolling = useCallback(() => {
    setIsPolling(false)
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    if (request?.txHash) {
      fetchStatus()
      
      if (autoRefresh) {
        startPolling()
      }
    }

    return () => {
      stopPolling()
    }
  }, [request?.txHash, autoRefresh]) // Only re-run when txHash changes

  return {
    status,
    loading,
    error,
    refetch,
    startPolling,
    stopPolling,
    isPolling
  }
}

interface UseMultipleStatusesOptions {
  fromChain?: string
  toChain?: string
  bridge?: string
  onUpdate?: (statuses: (ParsedStatusResponse | null)[]) => void
  onError?: (error: Error) => void
}

interface UseMultipleStatusesReturn {
  statuses: (ParsedStatusResponse | null)[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  totalCount: number
  completedCount: number
  failedCount: number
  pendingCount: number
}

/**
 * Hook for fetching multiple transaction statuses
 */
export function useMultipleStatuses(
  txHashes: string[],
  options: UseMultipleStatusesOptions = {}
): UseMultipleStatusesReturn {
  const [statuses, setStatuses] = useState<(ParsedStatusResponse | null)[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { onUpdate, onError } = options

  const fetchStatuses = useCallback(async () => {
    if (txHashes.length === 0) {
      setStatuses([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const results = await getMultipleStatuses(txHashes, options)
      setStatuses(results)
      onUpdate?.(results)
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [txHashes.join(','), options.fromChain, options.toChain, options.bridge, onUpdate, onError])

  const refetch = useCallback(() => fetchStatuses(), [fetchStatuses])

  // Calculate stats
  const totalCount = statuses.length
  const completedCount = statuses.filter(s => s?.isCompleted).length
  const failedCount = statuses.filter(s => s?.isFailed).length
  const pendingCount = statuses.filter(s => s?.isPending).length

  useEffect(() => {
    fetchStatuses()
  }, [fetchStatuses])

  return {
    statuses,
    loading,
    error,
    refetch,
    totalCount,
    completedCount,
    failedCount,
    pendingCount
  }
}

interface UsePollTransactionOptions {
  maxAttempts?: number
  intervalMs?: number
  autoStart?: boolean
  onUpdate?: (status: ParsedStatusResponse) => void
  onComplete?: (status: ParsedStatusResponse) => void
  onError?: (error: Error) => void
}

interface UsePollTransactionReturn {
  status: ParsedStatusResponse | null
  loading: boolean
  error: Error | null
  isPolling: boolean
  startPolling: () => void
  stopPolling: () => void
  progress: number
  estimatedTimeRemaining?: string
}

/**
 * Hook for polling transaction status until completion
 */
export function usePollTransaction(
  request: StatusRequest | null,
  options: UsePollTransactionOptions = {}
): UsePollTransactionReturn {
  const [status, setStatus] = useState<ParsedStatusResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  const {
    maxAttempts = 60,
    intervalMs = 5000,
    autoStart = false,
    onUpdate,
    onComplete,
    onError
  } = options

  const pollingPromiseRef = useRef<Promise<ParsedStatusResponse> | null>(null)

  const startPolling = useCallback(async () => {
    if (!request?.txHash || isPolling) return

    setIsPolling(true)
    setLoading(true)
    setError(null)

    try {
      pollingPromiseRef.current = pollTransactionStatus(request, {
        maxAttempts,
        intervalMs,
        onUpdate: (status) => {
          setStatus(status)
          onUpdate?.(status)
        }
      })

      const finalStatus = await pollingPromiseRef.current
      setStatus(finalStatus)
      onComplete?.(finalStatus)
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
      setIsPolling(false)
      pollingPromiseRef.current = null
    }
  }, [request, maxAttempts, intervalMs, onUpdate, onComplete, onError, isPolling])

  const stopPolling = useCallback(() => {
    setIsPolling(false)
    setLoading(false)
    // Note: We can't actually cancel the ongoing promise, but we can ignore its result
  }, [])

  useEffect(() => {
    if (autoStart && request?.txHash) {
      startPolling()
    }

    return () => {
      stopPolling()
    }
  }, [autoStart, request?.txHash, startPolling, stopPolling])

  return {
    status,
    loading,
    error,
    isPolling,
    startPolling,
    stopPolling,
    progress: status?.progress ?? 0,
    estimatedTimeRemaining: status?.estimatedTimeRemaining
  }
}

/**
 * Hook for managing transaction search history
 */
export function useTransactionHistory() {
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('lifi-search-history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch {
        // Ignore invalid JSON
      }
    }
  }, [])

  const addToHistory = useCallback((txHash: string) => {
    setHistory(prev => {
      const updated = [txHash, ...prev.filter(h => h !== txHash)].slice(0, 10)
      localStorage.setItem('lifi-search-history', JSON.stringify(updated))
      return updated
    })
  }, [])

  const removeFromHistory = useCallback((txHash: string) => {
    setHistory(prev => {
      const updated = prev.filter(h => h !== txHash)
      localStorage.setItem('lifi-search-history', JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem('lifi-search-history')
  }, [])

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory
  }
}
