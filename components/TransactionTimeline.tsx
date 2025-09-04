"use client"

import { StatusResponse, TransactionInfo } from '@/types/lifi'
import { formatAmount, formatUSD } from '@/lib/utils'
import { getChainName } from '@/lib/lifi-utils'
import { ArrowRight, Check, Clock, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

interface TransactionTimelineProps {
  status: StatusResponse
}

export function TransactionTimeline({ status }: TransactionTimelineProps) {
  const renderTransactionCard = (
    title: string,
    tx: TransactionInfo | undefined,
    type: 'sending' | 'receiving'
  ) => {
    if (!tx) return null

    const isComplete = tx.txHash && tx.timestamp

    return (
      <div className="flex-1">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">{title}</h4>
            <div className={`p-1 rounded-full ${isComplete ? 'bg-green-100 dark:bg-green-900/20' : 'bg-yellow-100 dark:bg-yellow-900/20'}`}>
              {isComplete ? (
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            {tx.chainId && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Chain</span>
                <span className="font-medium">{getChainName(tx.chainId)}</span>
              </div>
            )}

            {tx.token && tx.amount && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Amount</span>
                <div className="text-right">
                  <div className="font-medium">
                    {formatAmount(tx.amount, tx.token.decimals)} {tx.token.symbol}
                  </div>
                  {tx.amountUSD && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatUSD(tx.amountUSD)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tx.gasUsed && tx.gasPrice && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Gas Cost</span>
                <span className="font-mono text-xs">
                  {(parseFloat(tx.gasUsed) * parseFloat(tx.gasPrice) / 1e18).toFixed(6)} ETH
                </span>
              </div>
            )}

            {tx.timestamp && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Time</span>
                <span className="text-xs">
                  {format(new Date(tx.timestamp * 1000), 'MMM d, HH:mm:ss')}
                </span>
              </div>
            )}

            {tx.txLink && (
              <a
                href={tx.txLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded-md"
              >
                View Transaction
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-4">
        {renderTransactionCard('Source Transaction', status.sending, 'sending')}
        
        <div className="flex items-center justify-center">
          <ArrowRight className="h-6 w-6 text-gray-400" />
        </div>
        
        {renderTransactionCard('Destination Transaction', status.receiving, 'receiving')}
      </div>
    </div>
  )
}
