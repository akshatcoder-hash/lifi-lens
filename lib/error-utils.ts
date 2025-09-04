import { StatusResponse, TransactionSubstatus, ErrorCode } from '@/types/lifi'

export interface ToolError {
  errorType: string
  code: string
  action: any
  tool: string
  message: string
}

export interface ErrorContext {
  transactionHash?: string
  fromChain?: string
  toChain?: string
  fromToken?: string
  toToken?: string
  amount?: string
  bridge?: string
  timestamp?: number
}

export interface ErrorSummary {
  severity: 'critical' | 'warning' | 'info'
  category: 'network' | 'liquidity' | 'configuration' | 'validation' | 'system'
  isRetryable: boolean
  estimatedResolutionTime?: string
  primarySuggestion: string
  errorCount: number
  affectedServices: string[]
}

/**
 * Analyzes multiple errors and provides a comprehensive summary
 */
export function analyzeErrors(
  apiError?: { code: string; message: string },
  toolErrors?: ToolError[],
  substatus?: TransactionSubstatus,
  context?: ErrorContext
): ErrorSummary {
  const errors = []
  const affectedServices = new Set<string>()
  
  if (apiError) {
    errors.push({ type: 'api', code: apiError.code })
  }
  
  if (toolErrors) {
    toolErrors.forEach(error => {
      errors.push({ type: 'tool', code: error.code })
      affectedServices.add(error.tool)
    })
  }
  
  if (substatus) {
    errors.push({ type: 'substatus', code: substatus })
  }

  // Determine overall severity
  const severity = determineSeverity(errors)
  
  // Categorize the primary issue
  const category = categorizeError(errors)
  
  // Check if any error is retryable
  const isRetryable = isAnyRetryable(errors)
  
  // Get primary suggestion
  const primarySuggestion = getPrimarySuggestion(errors, context)
  
  // Estimate resolution time
  const estimatedResolutionTime = estimateResolutionTime(errors)

  return {
    severity,
    category,
    isRetryable,
    estimatedResolutionTime,
    primarySuggestion,
    errorCount: errors.length,
    affectedServices: Array.from(affectedServices)
  }
}

/**
 * Extracts errors from a LiFi status response
 */
export function extractErrors(statusResponse: StatusResponse): {
  apiError?: { code: string; message: string }
  toolErrors?: ToolError[]
  substatus?: TransactionSubstatus
  substatusMessage?: string
} {
  return {
    apiError: statusResponse.error,
    toolErrors: (statusResponse as any).errors, // Tool errors might be in different format
    substatus: statusResponse.substatus,
    substatusMessage: statusResponse.substatusMessage
  }
}

/**
 * Checks if an error is likely to be temporary
 */
export function isTemporaryError(
  apiError?: { code: string; message: string },
  toolErrors?: ToolError[]
): boolean {
  const temporaryCodes = [
    'TOOL_TIMEOUT',
    'RPC_ERROR',
    'INSUFFICIENT_LIQUIDITY',
    ErrorCode.TimeoutError.toString(),
    ErrorCode.ThirdPartyError.toString(),
    ErrorCode.RateLimitError.toString(),
    ErrorCode.ServerError.toString()
  ]

  if (apiError && temporaryCodes.includes(apiError.code)) {
    return true
  }

  if (toolErrors) {
    return toolErrors.some(error => temporaryCodes.includes(error.code))
  }

  return false
}

/**
 * Suggests alternative actions based on error patterns
 */
export function suggestAlternatives(
  toolErrors?: ToolError[],
  context?: ErrorContext
): string[] {
  if (!toolErrors) return []

  const suggestions = []
  const errorCodes = toolErrors.map(e => e.code)

  // Liquidity issues
  if (errorCodes.includes('INSUFFICIENT_LIQUIDITY') || errorCodes.includes('NO_POSSIBLE_ROUTE')) {
    suggestions.push('Try splitting large trades into smaller amounts')
    suggestions.push('Consider using different token pairs with better liquidity')
    
    if (context?.fromChain && context?.toChain) {
      suggestions.push(`Try alternative bridges for ${context.fromChain} → ${context.toChain}`)
    }
  }

  // Timeout issues
  if (errorCodes.includes('TOOL_TIMEOUT') || errorCodes.includes('RPC_ERROR')) {
    suggestions.push('Retry during off-peak hours (early morning UTC)')
    suggestions.push('Use alternative RPC endpoints if available')
  }

  // Amount issues
  if (errorCodes.includes('AMOUNT_TOO_LOW')) {
    suggestions.push('Check minimum transfer amounts for each bridge')
    suggestions.push('Combine multiple small transfers into one larger transfer')
  }

  if (errorCodes.includes('AMOUNT_TOO_HIGH')) {
    suggestions.push('Split into multiple smaller transactions')
    suggestions.push('Check daily/weekly limits for the bridge')
  }

  // Fee issues
  if (errorCodes.includes('FEES_HIGHER_THAN_AMOUNT')) {
    suggestions.push('Wait for lower gas prices on the network')
    suggestions.push('Consider if the transfer is economically viable')
    suggestions.push('Try bridges with lower fee structures')
  }

  return suggestions
}

/**
 * Gets relevant documentation links based on error types
 */
export function getRelevantDocs(
  apiError?: { code: string; message: string },
  toolErrors?: ToolError[]
): Array<{ text: string; url: string }> {
  const docs = []

  if (apiError) {
    const code = parseInt(apiError.code)
    
    switch (code) {
      case ErrorCode.NoQuoteError:
        docs.push({ text: 'Quote Request Guide', url: 'https://docs.li.fi/integrate-li.fi-js-sdk/request-a-quote' })
        break
      case ErrorCode.SlippageError:
        docs.push({ text: 'Slippage Settings', url: 'https://docs.li.fi/integrate-li.fi-js-sdk/request-a-quote#slippage' })
        break
      case ErrorCode.RateLimitError:
        docs.push({ text: 'API Rate Limits', url: 'https://docs.li.fi/list-lifi-api/api-limits' })
        break
      case ErrorCode.ValidationError:
      case ErrorCode.MalformedSchema:
        docs.push({ text: 'API Reference', url: 'https://docs.li.fi/list-lifi-api' })
        break
    }
  }

  if (toolErrors) {
    const hasLiquidityIssues = toolErrors.some(e => 
      ['INSUFFICIENT_LIQUIDITY', 'NO_POSSIBLE_ROUTE'].includes(e.code)
    )
    
    if (hasLiquidityIssues) {
      docs.push({ text: 'Supported Tokens', url: 'https://li.fi/tokens' })
      docs.push({ text: 'Bridge Comparison', url: 'https://li.fi/bridges' })
    }

    const hasNetworkIssues = toolErrors.some(e => 
      ['RPC_ERROR', 'TOOL_TIMEOUT'].includes(e.code)
    )
    
    if (hasNetworkIssues) {
      docs.push({ text: 'Network Status', url: 'https://status.li.fi' })
      docs.push({ text: 'Chain Status', url: 'https://chainlist.org' })
    }
  }

  return docs
}

/**
 * Formats error for logging/debugging
 */
export function formatErrorForLogging(
  apiError?: { code: string; message: string },
  toolErrors?: ToolError[],
  context?: ErrorContext
): string {
  const errorData = {
    timestamp: new Date().toISOString(),
    apiError,
    toolErrors: toolErrors?.map(e => ({
      tool: e.tool,
      code: e.code,
      message: e.message
    })),
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  }

  return JSON.stringify(errorData, null, 2)
}

// Private helper functions

function determineSeverity(errors: Array<{ type: string; code: string }>): 'critical' | 'warning' | 'info' {
  const criticalCodes = [
    ErrorCode.FailedToBuildTransactionError.toString(),
    ErrorCode.NotProcessableError.toString(),
    ErrorCode.UnauthorizedError.toString(),
    ErrorCode.ValidationError.toString(),
    ErrorCode.MalformedSchema.toString(),
    'FEES_HIGHER_THAN_AMOUNT',
    TransactionSubstatus.INSUFFICIENT_BALANCE,
    TransactionSubstatus.INSUFFICIENT_ALLOWANCE,
    TransactionSubstatus.OUT_OF_GAS
  ]

  const hasCritical = errors.some(e => criticalCodes.includes(e.code))
  if (hasCritical) return 'critical'

  const infoCodes = [
    'AMOUNT_TOO_LOW',
    'DIFFERENT_RECIPIENT_NOT_SUPPORTED'
  ]

  const hasOnlyInfo = errors.every(e => infoCodes.includes(e.code))
  if (hasOnlyInfo) return 'info'

  return 'warning'
}

function categorizeError(errors: Array<{ type: string; code: string }>): 'network' | 'liquidity' | 'configuration' | 'validation' | 'system' {
  const networkCodes = ['TOOL_TIMEOUT', 'RPC_ERROR', ErrorCode.TimeoutError.toString(), ErrorCode.RpcFailure.toString()]
  const liquidityCodes = ['INSUFFICIENT_LIQUIDITY', 'NO_POSSIBLE_ROUTE', ErrorCode.NoQuoteError.toString()]
  const configCodes = ['AMOUNT_TOO_LOW', 'AMOUNT_TOO_HIGH', 'DIFFERENT_RECIPIENT_NOT_SUPPORTED']
  const validationCodes = [ErrorCode.ValidationError.toString(), ErrorCode.MalformedSchema.toString(), ErrorCode.NotProcessableError.toString()]

  if (errors.some(e => networkCodes.includes(e.code))) return 'network'
  if (errors.some(e => liquidityCodes.includes(e.code))) return 'liquidity'
  if (errors.some(e => configCodes.includes(e.code))) return 'configuration'
  if (errors.some(e => validationCodes.includes(e.code))) return 'validation'

  return 'system'
}

function isAnyRetryable(errors: Array<{ type: string; code: string }>): boolean {
  const nonRetryableCodes = [
    ErrorCode.NotFoundError.toString(),
    ErrorCode.NotProcessableError.toString(),
    ErrorCode.UnauthorizedError.toString(),
    ErrorCode.ValidationError.toString(),
    ErrorCode.MalformedSchema.toString(),
    'AMOUNT_TOO_LOW',
    'AMOUNT_TOO_HIGH',
    'FEES_HIGHER_THAN_AMOUNT',
    'DIFFERENT_RECIPIENT_NOT_SUPPORTED',
    TransactionSubstatus.INSUFFICIENT_BALANCE,
    TransactionSubstatus.INSUFFICIENT_ALLOWANCE
  ]

  return !errors.every(e => nonRetryableCodes.includes(e.code))
}

function getPrimarySuggestion(errors: Array<{ type: string; code: string }>, context?: ErrorContext): string {
  // Prioritize by severity
  if (errors.some(e => e.code === 'FEES_HIGHER_THAN_AMOUNT')) {
    return 'Increase transfer amount or wait for lower gas fees'
  }

  if (errors.some(e => e.code === TransactionSubstatus.INSUFFICIENT_BALANCE)) {
    return 'Add more funds to your wallet to cover the transfer and gas fees'
  }

  if (errors.some(e => e.code === TransactionSubstatus.INSUFFICIENT_ALLOWANCE)) {
    return 'Approve token spending for the bridge contract'
  }

  if (errors.some(e => ['INSUFFICIENT_LIQUIDITY', 'NO_POSSIBLE_ROUTE'].includes(e.code))) {
    return 'Try reducing the amount or using different tokens with better liquidity'
  }

  if (errors.some(e => ['TOOL_TIMEOUT', 'RPC_ERROR'].includes(e.code))) {
    return 'Retry the request or try during off-peak hours'
  }

  if (errors.some(e => e.code === ErrorCode.RateLimitError.toString())) {
    return 'Reduce request frequency and implement exponential backoff'
  }

  return 'Review error details and follow the suggested actions'
}

function estimateResolutionTime(errors: Array<{ type: string; code: string }>): string | undefined {
  if (errors.some(e => e.code === ErrorCode.RateLimitError.toString())) {
    return '1-60 minutes'
  }

  if (errors.some(e => ['TOOL_TIMEOUT', 'RPC_ERROR'].includes(e.code))) {
    return '5-30 minutes'
  }

  if (errors.some(e => e.code === 'INSUFFICIENT_LIQUIDITY')) {
    return '1-24 hours'
  }

  if (errors.some(e => [
    'AMOUNT_TOO_LOW', 
    'AMOUNT_TOO_HIGH', 
    'FEES_HIGHER_THAN_AMOUNT',
    TransactionSubstatus.INSUFFICIENT_BALANCE,
    TransactionSubstatus.INSUFFICIENT_ALLOWANCE
  ].includes(e.code))) {
    return 'Immediate with fixes'
  }

  return undefined
}
