"use client"

import { FeeCost } from '@/types/lifi'
import { formatAmount, formatUSD } from '@/lib/utils'
import { Info } from 'lucide-react'

interface FeeBreakdownProps {
  fees: FeeCost[]
}

export function FeeBreakdown({ fees }: FeeBreakdownProps) {
  const totalFeesUSD = fees.reduce((sum, fee) => {
    return sum + (fee.amountUSD ? parseFloat(fee.amountUSD) : 0)
  }, 0)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="font-semibold mb-4">Fee Breakdown</h3>
      
      <div className="space-y-3">
        {fees.map((fee, index) => (
          <div
            key={index}
            className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{fee.name}</p>
                {fee.included && (
                  <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                    Included
                  </span>
                )}
              </div>
              
              {fee.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {fee.description}
                </p>
              )}
              
              {fee.percentage && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {fee.percentage}% of transaction
                </p>
              )}
            </div>
            
            <div className="text-right ml-4">
              {fee.amount && fee.token && (
                <p className="text-sm font-medium">
                  {formatAmount(fee.amount, fee.token.decimals)} {fee.token.symbol}
                </p>
              )}
              {fee.amountUSD && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {formatUSD(fee.amountUSD)}
                </p>
              )}
            </div>
          </div>
        ))}
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="font-semibold">Total Fees</p>
              <Info className="h-4 w-4 text-gray-400" />
            </div>
            <p className="font-semibold text-lg">
              {formatUSD(totalFeesUSD.toString())}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}