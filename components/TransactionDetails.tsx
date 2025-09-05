"use client"

import { useEffect, useState, useCallback } from 'react'
import { TransactionStatus } from '@/types/lifi'
import { getTransactionStatus, ParsedStatusResponse } from '@/lib/api'
import { cn } from '@/lib/utils'
import { formatAddress, getStatusColor, getStatusBgColor, getStatusTextColor } from '@/lib/lifi-utils'
import { TransactionTimeline } from './TransactionTimeline'
import { ErrorAnalysis } from './ErrorAnalysis'
import { FeeBreakdown } from './FeeBreakdown'
import { PerformanceAnalytics } from './PerformanceAnalytics'
import { 
  RefreshCw, 
  Copy, 
  ExternalLink, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2
} from 'lucide-react'

interface TransactionDetailsProps {
  txHash: string
}

export function TransactionDetails({ txHash }: TransactionDetailsProps) {
  const [status, setStatus] = useState<ParsedStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      setError(null)
      const data = await getTransactionStatus({ txHash })
      setStatus(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [txHash])

  useEffect(() => {
    setLoading(true)
    fetchStatus()
  }, [txHash, fetchStatus])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchStatus()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getStatusIcon = (status?: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.DONE:
        return <CheckCircle className="h-5 w-5" />
      case TransactionStatus.PENDING:
        return <Clock className="h-5 w-5" />
      case TransactionStatus.FAILED:
        return <XCircle className="h-5 w-5" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/10 p-6">
        <p className="text-red-800 dark:text-red-200">Failed to fetch transaction status</p>
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error.message}</p>
        <button
          onClick={fetchStatus}
          className="mt-3 text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!status) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full", getStatusBgColor(status.status))}>
              <div className={getStatusTextColor(status.status)}>
                {getStatusIcon(status.status)}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Transaction Status</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {status.displaySubstatus || status.displayStatus}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              "p-2 rounded-lg",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              "transition-colors",
              "disabled:opacity-50"
            )}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </button>
        </div>

        {status.substatusMessage && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {status.substatusMessage}
            </p>
          </div>
        )}
      </div>

      {/* Transaction Timeline */}
      <TransactionTimeline status={status} />

      {/* Error Analysis */}
      {(status.status === TransactionStatus.FAILED || 
        status.substatus || 
        status.substatusMessage?.includes('error') ||
        status.substatusMessage?.includes('failed')) && (
        <ErrorAnalysis 
          error={status.error}
          substatus={status.substatus}
          substatusMessage={status.substatusMessage}
          transactionData={status}
        />
      )}

      {/* Fee Breakdown */}
      {status.feeCosts && status.feeCosts.length > 0 && (
        <FeeBreakdown fees={status.feeCosts} />
      )}

      {/* Performance Analytics */}
      <PerformanceAnalytics />

      {/* Additional Details */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold mb-4">Transaction Details</h3>
        
        <div className="space-y-3">
          {status.transactionId && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Transaction ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{formatAddress(status.transactionId)}</span>
                <button
                  onClick={() => copyToClipboard(status.transactionId!)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {status.tool && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bridge</span>
              <span className="text-sm font-medium">{status.tool}</span>
            </div>
          )}

          {status.fromAddress && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">From Address</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{formatAddress(status.fromAddress)}</span>
                <button
                  onClick={() => copyToClipboard(status.fromAddress!)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {status.toAddress && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">To Address</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{formatAddress(status.toAddress)}</span>
                <button
                  onClick={() => copyToClipboard(status.toAddress!)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {status.lifiExplorerLink && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">LI.FI Explorer</span>
              <a
                href={status.lifiExplorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                View on Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {status.bridgeExplorerLink && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bridge Explorer</span>
              <a
                href={status.bridgeExplorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                View on Bridge Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
