import { 
  StatusResponse, 
  TransactionInfo, 
  TransactionStatus, 
  TransactionSubstatus,
  TokenInfo,
  FeeCost,
  StatusMessages,
  SubstatusMessages
} from '@/types/lifi'

/**
 * Utility functions for parsing and formatting LI.FI API responses
 */

export interface ParsedTransactionInfo extends TransactionInfo {
  formattedAmount?: string
  formattedGasAmount?: string
  explorerUrl?: string
  isCompleted: boolean
  isPending: boolean
  isFailed: boolean
}

export interface ParsedStatusResponse extends Omit<StatusResponse, 'sending' | 'receiving'> {
  sending: ParsedTransactionInfo
  receiving?: ParsedTransactionInfo
  displayStatus: string
  displaySubstatus?: string
  isCompleted: boolean
  isPending: boolean
  isFailed: boolean
  totalFeeUSD?: number
  estimatedTimeRemaining?: string
  progress: number
  statusColor: 'success' | 'warning' | 'error' | 'info'
  canRetry: boolean
}

/**
 * Parse and enhance status response with computed fields
 */
export function parseStatusResponse(response: StatusResponse): ParsedStatusResponse {
  const sending = parseTransactionInfo(response.sending)
  const receiving = response.receiving ? parseTransactionInfo(response.receiving) : undefined

  const isCompleted = response.status === TransactionStatus.DONE && 
    response.substatus === TransactionSubstatus.COMPLETED
  const isPending = response.status === TransactionStatus.PENDING
  const isFailed = response.status === TransactionStatus.FAILED

  return {
    ...response,
    sending,
    receiving,
    displayStatus: StatusMessages[response.status] || response.status,
    displaySubstatus: response.substatus ? 
      (SubstatusMessages[response.substatus] || response.substatusMessage || response.substatus) : 
      undefined,
    isCompleted,
    isPending,
    isFailed,
    totalFeeUSD: calculateTotalFeeUSD(response.feeCosts),
    estimatedTimeRemaining: estimateTimeRemaining(response.status, response.substatus),
    progress: calculateProgress(response.status, response.substatus, sending, receiving),
    statusColor: getStatusColor(response.status),
    canRetry: canRetryTransaction(response.status, response.substatus)
  }
}

/**
 * Parse and enhance transaction info with computed fields
 */
export function parseTransactionInfo(info: TransactionInfo): ParsedTransactionInfo {
  const isCompleted = !!info.txHash && !!info.timestamp
  const isPending = !!info.txHash && !info.timestamp
  const isFailed = false // Will be determined by overall status

  return {
    ...info,
    formattedAmount: info.token && info.amount ? 
      formatTokenAmount(info.amount, info.token.decimals, info.token.symbol) : 
      undefined,
    formattedGasAmount: info.gasToken && info.gasAmount ?
      formatTokenAmount(info.gasAmount, info.gasToken.decimals, info.gasToken.symbol) :
      undefined,
    explorerUrl: info.txLink || generateExplorerUrl(info.txHash, info.chainId),
    isCompleted,
    isPending,
    isFailed
  }
}

/**
 * Format token amount with proper decimals and symbol
 */
export function formatTokenAmount(
  amount: string, 
  decimals: number, 
  symbol?: string,
  maxDecimalPlaces = 6
): string {
  try {
    const value = BigInt(amount)
    const divisor = BigInt(10 ** decimals)
    const integerPart = value / divisor
    const fractionalPart = value % divisor

    let formatted: string

    if (fractionalPart === BigInt(0)) {
      formatted = integerPart.toString()
    } else {
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
      const trimmedFractional = fractionalStr.replace(/0+$/, '')
      const truncatedFractional = trimmedFractional.slice(0, maxDecimalPlaces)
      
      if (truncatedFractional) {
        formatted = `${integerPart}.${truncatedFractional}`
      } else {
        formatted = integerPart.toString()
      }
    }

    return symbol ? `${formatted} ${symbol}` : formatted
  } catch (error) {
    // Fallback for invalid amounts
    return symbol ? `${amount} ${symbol}` : amount
  }
}

/**
 * Format USD amount with proper formatting
 */
export function formatUSDAmount(amount: string | number): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(value)) return '$0.00'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 0.01 ? 6 : 2
  }).format(value)
}

/**
 * Calculate total fee in USD from fee costs array
 */
export function calculateTotalFeeUSD(feeCosts?: FeeCost[]): number | undefined {
  if (!feeCosts || feeCosts.length === 0) return undefined

  let total = 0
  let hasValidFees = false

  for (const fee of feeCosts) {
    if (fee.amountUSD) {
      const amount = parseFloat(fee.amountUSD)
      if (!isNaN(amount)) {
        total += amount
        hasValidFees = true
      }
    }
  }

  return hasValidFees ? total : undefined
}

/**
 * Estimate remaining time based on status and substatus
 */
export function estimateTimeRemaining(
  status: TransactionStatus, 
  substatus?: TransactionSubstatus
): string | undefined {
  if (status === TransactionStatus.DONE || status === TransactionStatus.FAILED) {
    return undefined
  }

  if (status === TransactionStatus.PENDING) {
    switch (substatus) {
      case TransactionSubstatus.WAIT_SOURCE_CONFIRMATIONS:
        return '1-3 minutes'
      case TransactionSubstatus.WAIT_DESTINATION_TRANSACTION:
        return '5-15 minutes'
      case TransactionSubstatus.BRIDGE_NOT_AVAILABLE:
      case TransactionSubstatus.CHAIN_NOT_AVAILABLE:
        return 'Unknown'
      case TransactionSubstatus.REFUND_IN_PROGRESS:
        return '10-30 minutes'
      default:
        return '5-15 minutes'
    }
  }

  return undefined
}

/**
 * Calculate progress percentage (0-100)
 */
export function calculateProgress(
  status: TransactionStatus,
  substatus?: TransactionSubstatus,
  sending?: ParsedTransactionInfo,
  receiving?: ParsedTransactionInfo
): number {
  if (status === TransactionStatus.DONE) return 100
  if (status === TransactionStatus.FAILED) return 0
  if (status === TransactionStatus.NOT_FOUND) return 0

  if (status === TransactionStatus.PENDING) {
    switch (substatus) {
      case TransactionSubstatus.WAIT_SOURCE_CONFIRMATIONS:
        return 25
      case TransactionSubstatus.WAIT_DESTINATION_TRANSACTION:
        return 75
      case TransactionSubstatus.REFUND_IN_PROGRESS:
        return 50
      default:
        return sending?.isCompleted ? 50 : 25
    }
  }

  return 0
}

/**
 * Get status color for UI components
 */
export function getStatusColor(status: TransactionStatus): 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case TransactionStatus.DONE:
      return 'success'
    case TransactionStatus.FAILED:
      return 'error'
    case TransactionStatus.PENDING:
      return 'warning'
    case TransactionStatus.NOT_FOUND:
      return 'info'
    default:
      return 'info'
  }
}

/**
 * Determine if transaction can be retried
 */
export function canRetryTransaction(
  status: TransactionStatus, 
  substatus?: TransactionSubstatus
): boolean {
  if (status === TransactionStatus.DONE) return false
  
  if (status === TransactionStatus.FAILED) {
    // Some failed states can be retried
    return substatus === TransactionSubstatus.OUT_OF_GAS ||
           substatus === TransactionSubstatus.SLIPPAGE_EXCEEDED ||
           substatus === TransactionSubstatus.EXPIRED
  }

  return false
}

/**
 * Generate explorer URL for transaction hash and chain ID
 */
export function generateExplorerUrl(txHash?: string, chainId?: number): string | undefined {
  if (!txHash || !chainId) return undefined

  const explorers: Record<number, string> = {
    1: 'https://etherscan.io/tx',
    137: 'https://polygonscan.com/tx',
    42161: 'https://arbiscan.io/tx',
    10: 'https://optimistic.etherscan.io/tx',
    56: 'https://bscscan.com/tx',
    43114: 'https://snowtrace.io/tx',
    250: 'https://ftmscan.com/tx',
    100: 'https://gnosisscan.io/tx',
    8453: 'https://basescan.org/tx',
    324: 'https://explorer.zksync.io/tx',
    167000: 'https://taikoscan.io/tx',
    59144: 'https://lineascan.build/tx'
  }

  const baseUrl = explorers[chainId]
  return baseUrl ? `${baseUrl}/${txHash}` : undefined
}

/**
 * Get chain name from chain ID
 */
export function getChainName(chainId?: number): string {
  if (!chainId) return 'Unknown'

  const chainNames: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    42161: 'Arbitrum',
    10: 'Optimism',
    56: 'BNB Smart Chain',
    43114: 'Avalanche',
    250: 'Fantom',
    100: 'Gnosis',
    8453: 'Base',
    324: 'zkSync Era',
    167000: 'Taiko',
    59144: 'Linea'
  }

  return chainNames[chainId] || `Chain ${chainId}`
}

/**
 * Format timestamp to readable date/time
 */
export function formatTimestamp(timestamp?: number): string | undefined {
  if (!timestamp) return undefined

  const date = new Date(timestamp * 1000) // Convert from Unix timestamp
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  }).format(date)
}

/**
 * Calculate time elapsed since timestamp
 */
export function getTimeElapsed(timestamp?: number): string | undefined {
  if (!timestamp) return undefined

  const now = Date.now() / 1000
  const elapsed = now - timestamp

  if (elapsed < 60) return `${Math.floor(elapsed)}s ago`
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ago`
  if (elapsed < 86400) return `${Math.floor(elapsed / 3600)}h ago`
  return `${Math.floor(elapsed / 86400)}d ago`
}

/**
 * Validate transaction hash format
 */
export function isValidTxHash(txHash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(txHash)
}

/**
 * Truncate address or hash for display
 */
export function truncateHash(hash?: string, startLength = 6, endLength = 4): string {
  if (!hash) return ''
  if (hash.length <= startLength + endLength) return hash
  
  return `${hash.slice(0, startLength)}...${hash.slice(-endLength)}`
}

/**
 * Format address for display (alias for truncateHash)
 */
export function formatAddress(address?: string): string {
  return truncateHash(address)
}

/**
 * Get status background color class for UI components
 */
export function getStatusBgColor(status: TransactionStatus): string {
  switch (status) {
    case TransactionStatus.DONE:
      return 'bg-green-100 dark:bg-green-900/20'
    case TransactionStatus.FAILED:
      return 'bg-red-100 dark:bg-red-900/20'
    case TransactionStatus.PENDING:
      return 'bg-yellow-100 dark:bg-yellow-900/20'
    case TransactionStatus.NOT_FOUND:
      return 'bg-gray-100 dark:bg-gray-900/20'
    default:
      return 'bg-gray-100 dark:bg-gray-900/20'
  }
}

/**
 * Get status text color class for UI components
 */
export function getStatusTextColor(status: TransactionStatus): string {
  switch (status) {
    case TransactionStatus.DONE:
      return 'text-green-600 dark:text-green-400'
    case TransactionStatus.FAILED:
      return 'text-red-600 dark:text-red-400'
    case TransactionStatus.PENDING:
      return 'text-yellow-600 dark:text-yellow-400'
    case TransactionStatus.NOT_FOUND:
      return 'text-gray-600 dark:text-gray-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

/**
 * Get transaction type description
 */
export function getTransactionType(
  fromChainId?: number, 
  toChainId?: number
): 'swap' | 'bridge' | 'unknown' {
  if (!fromChainId || !toChainId) return 'unknown'
  
  return fromChainId === toChainId ? 'swap' : 'bridge'
}

/**
 * Check if response has receiving transaction
 */
export function hasReceivingTransaction(response: StatusResponse): boolean {
  return !!response.receiving?.txHash
}

/**
 * Get bridge tool display name
 */
export function getBridgeToolName(tool?: string): string {
  if (!tool) return 'Unknown'

  const toolNames: Record<string, string> = {
    hop: 'Hop Protocol',
    cbridge: 'Celer cBridge',
    stargate: 'Stargate',
    across: 'Across Protocol',
    anyswap: 'Multichain',
    polygon: 'Polygon Bridge',
    arbitrum: 'Arbitrum Bridge',
    optimism: 'Optimism Bridge',
    '1inch': '1inch',
    paraswap: 'ParaSwap',
    '0x': '0x Protocol'
  }

  return toolNames[tool] || tool
}
