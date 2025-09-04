"use client"

import { AlertTriangle, Info } from 'lucide-react'
import { ToolErrorMessages } from '@/types/lifi'

interface TransactionErrorProps {
  error: {
    code: string
    message: string
  }
}

export function TransactionError({ error }: TransactionErrorProps) {
  const getErrorExplanation = (code: string): string | null => {
    return ToolErrorMessages[code as keyof typeof ToolErrorMessages] || null
  }

  const getErrorSuggestion = (code: string): string | null => {
    switch (code) {
      case 'INSUFFICIENT_LIQUIDITY':
        return 'Try a smaller amount or wait for more liquidity'
      case 'AMOUNT_TOO_LOW':
        return 'Increase the transfer amount to meet minimum requirements'
      case 'AMOUNT_TOO_HIGH':
        return 'Reduce the transfer amount to stay within limits'
      case 'FEES_HIGHER_THAN_AMOUNT':
        return 'Increase the transfer amount to cover fees'
      case 'SLIPPAGE_ERROR':
        return 'Increase slippage tolerance or try again later'
      case 'RPC_ERROR':
        return 'Check network connectivity and try again'
      default:
        return null
    }
  }

  return (
    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
            Transaction Error
          </h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Code: {error.code}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error.message}
              </p>
            </div>

            {getErrorExplanation(error.code) && (
              <div className="flex gap-2 p-3 bg-red-100 dark:bg-red-900/20 rounded-md">
                <Info className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {getErrorExplanation(error.code)}
                </p>
              </div>
            )}

            {getErrorSuggestion(error.code) && (
              <div className="p-3 bg-white dark:bg-gray-900 rounded-md border border-red-200 dark:border-red-800">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Suggestion:</span> {getErrorSuggestion(error.code)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}