"use client"

import {
  AlertTriangle,
  AlertCircle,
  Info,
  ExternalLink,
  Copy,
  RefreshCw,
  Clock,
  DollarSign,
  Network,
  Zap,
  Shield,
  Settings,
  TrendingUp,
  FileText,
  CheckCircle2
} from 'lucide-react'
import { useState } from 'react'
import { StatusResponse, TransactionSubstatus, ErrorCode } from '@/types/lifi'
import { RouteComparison } from './RouteComparison'

interface ToolError {
  errorType: string
  code: string
  action: any
  tool: string
  message: string
}

interface ErrorAnalysisProps {
  error?: {
    code: string
    message: string
  }
  toolErrors?: ToolError[]
  substatus?: TransactionSubstatus
  substatusMessage?: string
  transactionData?: StatusResponse
  className?: string
}

interface ErrorInfo {
  category: 'critical' | 'warning' | 'info'
  title: string
  description: string
  suggestions: string[]
  codeExamples?: string[]
  documentationLinks?: Array<{
    text: string
    url: string
  }>
  icon: typeof AlertTriangle
  retryable: boolean
  estimatedFixTime?: string
}

interface ErrorPattern {
  codes: string[]
  pattern: string
  commonCause: string
  solution: string
}

export function ErrorAnalysis({
  error,
  toolErrors,
  substatus,
  substatusMessage,
  transactionData,
  className = ""
}: ErrorAnalysisProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  // Comprehensive error mappings
  const getApiErrorInfo = (code: string): ErrorInfo => {
    const errorCode = parseInt(code)

    switch (errorCode) {
      case ErrorCode.DefaultError:
        return {
          category: 'critical',
          title: 'General System Error',
          description: 'An unexpected system error occurred that prevented processing your request.',
          suggestions: [
            'Retry the request after a brief delay',
            'Verify all request parameters are valid',
            'Check the LI.FI API status page for known issues',
            'Contact support if the issue persists'
          ],
          icon: AlertTriangle,
          retryable: true,
          estimatedFixTime: '1-5 minutes'
        }

      case ErrorCode.FailedToBuildTransactionError:
        return {
          category: 'critical',
          title: 'Transaction Construction Failed',
          description: 'The system could not construct a valid transaction with the provided parameters.',
          suggestions: [
            'Verify token addresses are correct and exist on the specified chains',
            'Check that the amount is within acceptable limits',
            'Ensure the recipient address is valid',
            'Verify chain IDs are supported',
            'Try with different slippage tolerance'
          ],
          codeExamples: [
            `// Verify token addresses
const tokenExists = await provider.getCode(tokenAddress)
if (tokenExists === '0x') throw new Error('Token not found')`,
            `// Check amount limits
const minAmount = await bridge.getMinAmount(fromToken, toToken)
if (amount < minAmount) throw new Error('Amount too low')`
          ],
          documentationLinks: [
            { text: 'Supported Tokens', url: 'https://li.fi/tokens' },
            { text: 'Chain Support', url: 'https://li.fi/chains' }
          ],
          icon: Settings,
          retryable: true,
          estimatedFixTime: 'Immediate with fixes'
        }

      case ErrorCode.NoQuoteError:
        return {
          category: 'warning',
          title: 'No Quote Available',
          description: 'No bridge or DEX could provide a quote for your requested swap/bridge.',
          suggestions: [
            'Try a different amount (higher or lower)',
            'Increase slippage tolerance',
            'Check if the token pair is supported',
            'Try different source/destination chains',
            'Wait for better liquidity conditions'
          ],
          codeExamples: [
            `// Try with higher slippage
const quote = await lifi.getQuote({
  ...params,
  slippage: 0.05 // 5% instead of 3%
})`,
            `// Check supported tokens
const tokens = await lifi.getTokens(fromChainId)
const isSupported = tokens.some(t => t.address === tokenAddress)`
          ],
          documentationLinks: [
            { text: 'Slippage Guide', url: 'https://docs.li.fi/integrate-li.fi-js-sdk/request-a-quote#slippage' }
          ],
          icon: TrendingUp,
          retryable: true,
          estimatedFixTime: '5-30 minutes'
        }

      case ErrorCode.NotFoundError:
        return {
          category: 'warning',
          title: 'Resource Not Found',
          description: 'The requested transaction, route, or resource could not be found.',
          suggestions: [
            'Verify the transaction hash is correct',
            'Check if the transaction has been mined',
            'Ensure you\'re querying the correct chain',
            'The transaction might be too old (>30 days)'
          ],
          icon: AlertCircle,
          retryable: false
        }

      case ErrorCode.NotProcessableError:
        return {
          category: 'critical',
          title: 'Request Not Processable',
          description: 'The request contains invalid data that cannot be processed.',
          suggestions: [
            'Validate all required parameters are provided',
            'Check parameter formats (addresses, amounts, chain IDs)',
            'Ensure numeric values are within valid ranges',
            'Verify enum values match expected options'
          ],
          codeExamples: [
            `// Validate addresses
import { isAddress } from 'viem'
if (!isAddress(fromAddress)) throw new Error('Invalid address')`,
            `// Validate amounts
const amount = BigInt(amountString)
if (amount <= 0n) throw new Error('Amount must be positive')`
          ],
          icon: AlertTriangle,
          retryable: false
        }

      case ErrorCode.RateLimitError:
        return {
          category: 'warning',
          title: 'Rate Limit Exceeded',
          description: 'You have exceeded the API rate limit. Please slow down your requests.',
          suggestions: [
            'Implement exponential backoff for retries',
            'Reduce request frequency',
            'Use batch requests when possible',
            'Consider upgrading to a higher tier plan'
          ],
          codeExamples: [
            `// Exponential backoff
const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
await new Promise(resolve => setTimeout(resolve, delay))`
          ],
          documentationLinks: [
            { text: 'Rate Limits', url: 'https://docs.li.fi/list-lifi-api/api-limits' }
          ],
          icon: Clock,
          retryable: true,
          estimatedFixTime: '1-60 minutes'
        }

      case ErrorCode.ServerError:
        return {
          category: 'critical',
          title: 'Server Error',
          description: 'An internal server error occurred. This is usually temporary.',
          suggestions: [
            'Retry the request after a short delay',
            'Check the LI.FI status page for incidents',
            'Try alternative endpoints if available',
            'Contact support if the error persists'
          ],
          documentationLinks: [
            { text: 'Status Page', url: 'https://status.li.fi' }
          ],
          icon: AlertTriangle,
          retryable: true,
          estimatedFixTime: '5-30 minutes'
        }

      case ErrorCode.SlippageError:
        return {
          category: 'warning',
          title: 'Slippage Tolerance Exceeded',
          description: 'The price moved too much during execution, exceeding your slippage tolerance.',
          suggestions: [
            'Increase slippage tolerance (e.g., from 1% to 3%)',
            'Try the transaction again immediately',
            'Use a smaller trade size to reduce price impact',
            'Wait for less volatile market conditions'
          ],
          codeExamples: [
            `// Increase slippage tolerance
const route = await lifi.getQuote({
  ...params,
  slippage: 0.03 // 3% slippage tolerance
})`
          ],
          icon: TrendingUp,
          retryable: true,
          estimatedFixTime: 'Immediate'
        }

      case ErrorCode.ThirdPartyError:
        return {
          category: 'warning',
          title: 'Third-Party Service Error',
          description: 'An external service (bridge, DEX, RPC) is experiencing issues.',
          suggestions: [
            'Retry with a different bridge/DEX',
            'Wait for the service to recover',
            'Check the specific tool\'s status page',
            'Try using a different RPC endpoint'
          ],
          icon: Network,
          retryable: true,
          estimatedFixTime: '10-60 minutes'
        }

      case ErrorCode.TimeoutError:
        return {
          category: 'warning',
          title: 'Request Timeout',
          description: 'The request took too long to complete and timed out.',
          suggestions: [
            'Retry the request',
            'Check your network connection',
            'Try during off-peak hours',
            'Use a more reliable network connection'
          ],
          icon: Clock,
          retryable: true,
          estimatedFixTime: 'Immediate'
        }

      case ErrorCode.UnauthorizedError:
        return {
          category: 'critical',
          title: 'Unauthorized Access',
          description: 'Invalid or missing API credentials.',
          suggestions: [
            'Check your API key is correct',
            'Verify API key permissions',
            'Ensure API key is not expired',
            'Contact support if credentials are correct'
          ],
          icon: Shield,
          retryable: false
        }

      case ErrorCode.ValidationError:
        return {
          category: 'critical',
          title: 'Request Validation Failed',
          description: 'The request parameters failed validation checks.',
          suggestions: [
            'Review all parameter formats and values',
            'Check required vs optional parameters',
            'Validate addresses, amounts, and IDs',
            'Ensure proper data types are used'
          ],
          icon: AlertCircle,
          retryable: false
        }

      case ErrorCode.RpcFailure:
        return {
          category: 'warning',
          title: 'RPC Connection Failed',
          description: 'Unable to connect to blockchain RPC endpoints.',
          suggestions: [
            'Check blockchain network status',
            'Try a different RPC endpoint',
            'Wait for network congestion to clear',
            'Verify the chain is operational'
          ],
          documentationLinks: [
            { text: 'Chain Status', url: 'https://chainlist.org/' }
          ],
          icon: Network,
          retryable: true,
          estimatedFixTime: '5-30 minutes'
        }

      case ErrorCode.MalformedSchema:
        return {
          category: 'critical',
          title: 'Invalid Request Format',
          description: 'The request does not match the expected schema.',
          suggestions: [
            'Check the API documentation for correct format',
            'Validate JSON structure',
            'Ensure all required fields are present',
            'Check field types match the schema'
          ],
          documentationLinks: [
            { text: 'API Documentation', url: 'https://docs.li.fi/' }
          ],
          icon: FileText,
          retryable: false
        }

      default:
        return {
          category: 'warning',
          title: 'Unknown Error',
          description: 'An unknown error occurred.',
          suggestions: ['Contact support with error details'],
          icon: AlertCircle,
          retryable: true
        }
    }
  }

  const getToolErrorInfo = (code: string): ErrorInfo => {
    switch (code) {
      case 'NO_POSSIBLE_ROUTE':
        return {
          category: 'warning',
          title: 'No Route Available',
          description: 'This bridge/DEX cannot find a valid path for your trade.',
          suggestions: [
            'Try a different token pair',
            'Check if both tokens exist on the specified chains',
            'Try with different amount values',
            'Use alternative bridges or DEXs'
          ],
          icon: TrendingUp,
          retryable: true,
          estimatedFixTime: 'Try alternatives'
        }

      case 'INSUFFICIENT_LIQUIDITY':
        return {
          category: 'warning',
          title: 'Insufficient Liquidity',
          description: 'The DEX/bridge doesn\'t have enough liquidity for your trade size.',
          suggestions: [
            'Reduce the trade amount',
            'Split large trades into smaller chunks',
            'Wait for better liquidity conditions',
            'Try a different DEX or bridge',
            'Check if it\'s a popular trading pair'
          ],
          codeExamples: [
            `// Split large trades
const chunkSize = totalAmount / 3n
const trades = [chunkSize, chunkSize, totalAmount - (chunkSize * 2n)]`
          ],
          icon: DollarSign,
          retryable: true,
          estimatedFixTime: '1-24 hours'
        }

      case 'TOOL_TIMEOUT':
        return {
          category: 'warning',
          title: 'Bridge/DEX Timeout',
          description: 'The external service took too long to respond.',
          suggestions: [
            'Retry the request',
            'Try a different bridge or DEX',
            'Check the service status',
            'Wait and try during off-peak hours'
          ],
          icon: Clock,
          retryable: true,
          estimatedFixTime: '5-30 minutes'
        }

      case 'RPC_ERROR':
        return {
          category: 'warning',
          title: 'Blockchain RPC Error',
          description: 'Unable to fetch on-chain data from the blockchain.',
          suggestions: [
            'Check blockchain network status',
            'Try again in a few minutes',
            'Switch to a different RPC provider',
            'Verify the chain is not experiencing issues'
          ],
          documentationLinks: [
            { text: 'Network Status', url: 'https://status.ethereum.org/' }
          ],
          icon: Network,
          retryable: true,
          estimatedFixTime: '5-30 minutes'
        }

      case 'AMOUNT_TOO_LOW':
        return {
          category: 'info',
          title: 'Amount Below Minimum',
          description: 'The transfer amount is below the minimum required by this bridge.',
          suggestions: [
            'Increase the transfer amount',
            'Check the minimum amount requirements',
            'Try a different bridge with lower minimums',
            'Combine with other pending transfers'
          ],
          codeExamples: [
            `// Check minimum amounts
const minAmount = await bridge.getMinTransferAmount(token)
if (amount < minAmount) {
  console.log(\`Minimum required: \${minAmount}\`)
}`
          ],
          icon: DollarSign,
          retryable: false
        }

      case 'AMOUNT_TOO_HIGH':
        return {
          category: 'warning',
          title: 'Amount Exceeds Maximum',
          description: 'The transfer amount exceeds the maximum allowed by this bridge.',
          suggestions: [
            'Reduce the transfer amount',
            'Split into multiple smaller transfers',
            'Try a different bridge with higher limits',
            'Check daily/monthly limits'
          ],
          icon: DollarSign,
          retryable: false
        }

      case 'FEES_HIGHER_THAN_AMOUNT':
        return {
          category: 'critical',
          title: 'Fees Exceed Transfer Amount',
          description: 'The transaction fees are higher than the amount you\'re trying to transfer.',
          suggestions: [
            'Increase the transfer amount significantly',
            'Wait for lower gas prices',
            'Try a different bridge with lower fees',
            'Consider if the transfer is economically viable'
          ],
          codeExamples: [
            `// Check fee vs amount ratio
const feeRatio = fees / amount
if (feeRatio > 0.5) {
  console.warn('Fees are >50% of transfer amount')
}`
          ],
          icon: DollarSign,
          retryable: false
        }

      case 'DIFFERENT_RECIPIENT_NOT_SUPPORTED':
        return {
          category: 'info',
          title: 'Different Recipient Not Allowed',
          description: 'This bridge only supports transfers to the same address that initiated the transfer.',
          suggestions: [
            'Use the same address for from and to',
            'Try a different bridge that supports different recipients',
            'Transfer to yourself first, then send to the intended recipient'
          ],
          icon: Shield,
          retryable: false
        }

      case 'TOOL_SPECIFIC_ERROR':
        return {
          category: 'warning',
          title: 'Bridge-Specific Error',
          description: 'The bridge returned a specific error that requires attention.',
          suggestions: [
            'Check the specific error message for details',
            'Try a different bridge',
            'Check the bridge\'s documentation',
            'Contact the bridge support team'
          ],
          icon: AlertTriangle,
          retryable: true,
          estimatedFixTime: 'Variable'
        }

      case 'CANNOT_GUARANTEE_MIN_AMOUNT':
        return {
          category: 'warning',
          title: 'Minimum Amount Not Guaranteed',
          description: 'Due to volatility, the bridge cannot guarantee you\'ll receive the minimum expected amount.',
          suggestions: [
            'Increase slippage tolerance',
            'Accept the risk of receiving less',
            'Try during less volatile market conditions',
            'Use a smaller amount for testing'
          ],
          icon: TrendingUp,
          retryable: true,
          estimatedFixTime: 'Market dependent'
        }

      default:
        return {
          category: 'warning',
          title: 'Unknown Tool Error',
          description: 'The bridge/DEX returned an unknown error.',
          suggestions: [
            'Try a different bridge or DEX',
            'Check for service updates',
            'Contact support with error details'
          ],
          icon: AlertCircle,
          retryable: true
        }
    }
  }

  const getSubstatusErrorInfo = (substatus: TransactionSubstatus): ErrorInfo => {
    switch (substatus) {
      case TransactionSubstatus.SLIPPAGE_EXCEEDED:
        return {
          category: 'warning',
          title: 'Slippage Tolerance Exceeded',
          description: 'The price moved too much during execution, resulting in less tokens than expected.',
          suggestions: [
            'This is expected behavior - your slippage protection worked',
            'Increase slippage tolerance for future trades',
            'Try smaller trade sizes to reduce price impact',
            'Trade during less volatile periods'
          ],
          icon: TrendingUp,
          retryable: true
        }

      case TransactionSubstatus.INSUFFICIENT_BALANCE:
        return {
          category: 'critical',
          title: 'Insufficient Balance',
          description: 'Your wallet doesn\'t have enough tokens to complete the transaction.',
          suggestions: [
            'Check your wallet balance',
            'Reduce the transfer amount',
            'Ensure you have enough for gas fees',
            'Add more tokens to your wallet'
          ],
          codeExamples: [
            `// Check balance before transaction
const balance = await provider.getBalance(address)
const requiredAmount = amount + estimatedGas * gasPrice
if (balance < requiredAmount) throw new Error('Insufficient balance')`
          ],
          icon: DollarSign,
          retryable: false
        }

      case TransactionSubstatus.INSUFFICIENT_ALLOWANCE:
        return {
          category: 'critical',
          title: 'Insufficient Token Allowance',
          description: 'You need to approve the bridge to spend your tokens.',
          suggestions: [
            'Approve token spending for the bridge contract',
            'Set allowance to cover the transfer amount',
            'Check if approval transaction was successful',
            'Try the bridge transaction again after approval'
          ],
          codeExamples: [
            `// Approve tokens for bridge
const tx = await tokenContract.approve(bridgeAddress, amount)
await tx.wait() // Wait for confirmation`
          ],
          icon: Shield,
          retryable: false
        }

      case TransactionSubstatus.OUT_OF_GAS:
        return {
          category: 'critical',
          title: 'Transaction Ran Out of Gas',
          description: 'The transaction didn\'t have enough gas to complete execution.',
          suggestions: [
            'Increase the gas limit for the transaction',
            'Check current network gas prices',
            'Ensure your wallet has enough ETH for gas',
            'Try during periods of lower network congestion'
          ],
          codeExamples: [
            `// Set higher gas limit
const tx = await contract.method({
  gasLimit: 500000, // Increase from default
  gasPrice: await provider.getGasPrice()
})`
          ],
          icon: Zap,
          retryable: true
        }

      case TransactionSubstatus.EXPIRED:
        return {
          category: 'warning',
          title: 'Transaction Expired',
          description: 'The transaction took too long and exceeded its deadline.',
          suggestions: [
            'Submit a new transaction',
            'Increase the deadline/timeout',
            'Check for network congestion',
            'Use higher gas prices for faster execution'
          ],
          icon: Clock,
          retryable: true
        }

      default:
        return {
          category: 'warning',
          title: 'Transaction Issue',
          description: 'The transaction encountered an issue during processing.',
          suggestions: ['Check transaction details and try again'],
          icon: AlertCircle,
          retryable: true
        }
    }
  }

  // Error pattern detection
  const detectErrorPatterns = (errors: ToolError[]): ErrorPattern[] => {
    const patterns: ErrorPattern[] = []

    const errorCodes = errors.map(e => e.code)

    // Common patterns
    if (errorCodes.includes('INSUFFICIENT_LIQUIDITY') && errorCodes.includes('NO_POSSIBLE_ROUTE')) {
      patterns.push({
        codes: ['INSUFFICIENT_LIQUIDITY', 'NO_POSSIBLE_ROUTE'],
        pattern: 'Liquidity Crisis',
        commonCause: 'Multiple DEXs/bridges lack liquidity for this trade',
        solution: 'Try smaller amounts, different tokens, or wait for better market conditions'
      })
    }

    if (errorCodes.includes('TOOL_TIMEOUT') && errorCodes.length > 1) {
      patterns.push({
        codes: ['TOOL_TIMEOUT'],
        pattern: 'Network Congestion',
        commonCause: 'Multiple services are experiencing delays',
        solution: 'Try again during off-peak hours or use alternative services'
      })
    }

    if (errorCodes.includes('RPC_ERROR')) {
      patterns.push({
        codes: ['RPC_ERROR'],
        pattern: 'Blockchain Connectivity Issues',
        commonCause: 'Problems connecting to blockchain networks',
        solution: 'Check network status and try alternative RPC endpoints'
      })
    }

    return patterns
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const toggleExpanded = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const getSeverityColor = (category: 'critical' | 'warning' | 'info') => {
    switch (category) {
      case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-900/10'
      case 'warning': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
      case 'info': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
    }
  }

  const getSeverityTextColor = (category: 'critical' | 'warning' | 'info') => {
    switch (category) {
      case 'critical': return 'text-red-700 dark:text-red-300'
      case 'warning': return 'text-yellow-700 dark:text-yellow-300'
      case 'info': return 'text-blue-700 dark:text-blue-300'
    }
  }

  const getSeverityIconColor = (category: 'critical' | 'warning' | 'info') => {
    switch (category) {
      case 'critical': return 'text-red-600 dark:text-red-400'
      case 'warning': return 'text-yellow-600 dark:text-yellow-400'
      case 'info': return 'text-blue-600 dark:text-blue-400'
    }
  }

  // Collect all errors to analyze
  const allErrors: Array<{ type: 'api' | 'tool' | 'substatus', data: any, info: ErrorInfo }> = []

  if (error) {
    const info = getApiErrorInfo(error.code)
    allErrors.push({ type: 'api', data: error, info })
  }

  if (toolErrors) {
    toolErrors.forEach(toolError => {
      const info = getToolErrorInfo(toolError.code)
      allErrors.push({ type: 'tool', data: toolError, info })
    })
  }

  if (substatus && [
    TransactionSubstatus.SLIPPAGE_EXCEEDED,
    TransactionSubstatus.INSUFFICIENT_BALANCE,
    TransactionSubstatus.INSUFFICIENT_ALLOWANCE,
    TransactionSubstatus.OUT_OF_GAS,
    TransactionSubstatus.EXPIRED
  ].includes(substatus)) {
    const info = getSubstatusErrorInfo(substatus)
    allErrors.push({ type: 'substatus', data: { substatus, message: substatusMessage }, info })
  }

  // Detect patterns in tool errors
  const errorPatterns = toolErrors ? detectErrorPatterns(toolErrors) : []

  if (allErrors.length === 0) {
    return null
  }

  const mostCriticalError = allErrors.find(e => e.info.category === 'critical') || allErrors[0]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Error Patterns */}
      {errorPatterns.length > 0 && (
        <div className="border border-purple-500 bg-purple-50 dark:bg-purple-900/10 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Error Pattern Detected
              </h3>
              {errorPatterns.map((pattern, index) => (
                <div key={index} className="mb-3 last:mb-0">
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    {pattern.pattern}
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                    <span className="font-medium">Common cause:</span> {pattern.commonCause}
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                    <span className="font-medium">Solution:</span> {pattern.solution}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Individual Errors */}
      {allErrors.map((errorItem, index) => {
        const { info, data, type } = errorItem
        const Icon = info.icon

        return (
          <div
            key={`${type}-${index}`}
            className={`border rounded-lg p-6 ${getSeverityColor(info.category)}`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${info.category === 'critical' ? 'bg-red-100 dark:bg-red-900/20' :
                  info.category === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                    'bg-blue-100 dark:bg-blue-900/20'
                }`}>
                <Icon className={`h-5 w-5 ${getSeverityIconColor(info.category)}`} />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className={`font-semibold ${getSeverityTextColor(info.category)}`}>
                    {info.title}
                  </h3>
                  <div className="flex gap-2">
                    {info.retryable && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 rounded text-xs">
                        <RefreshCw className="h-3 w-3 text-green-600 dark:text-green-400" />
                        <span className="text-green-700 dark:text-green-300">Retryable</span>
                      </div>
                    )}
                    {info.estimatedFixTime && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                        <Clock className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{info.estimatedFixTime}</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className={`text-sm mb-4 ${getSeverityTextColor(info.category)}`}>
                  {info.description}
                </p>

                {/* Technical Details */}
                <div className="mb-4 p-3 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Technical Details
                    </p>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(data, null, 2), `${type}-${index}`)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {copiedText === `${type}-${index}` ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {type === 'api' && (
                      <>
                        <p><span className="font-medium">Code:</span> {data.code}</p>
                        <p><span className="font-medium">Message:</span> {data.message}</p>
                      </>
                    )}
                    {type === 'tool' && (
                      <>
                        <p><span className="font-medium">Tool:</span> {data.tool}</p>
                        <p><span className="font-medium">Code:</span> {data.code}</p>
                        <p><span className="font-medium">Message:</span> {data.message}</p>
                      </>
                    )}
                    {type === 'substatus' && (
                      <>
                        <p><span className="font-medium">Status:</span> {data.substatus}</p>
                        {data.message && <p><span className="font-medium">Message:</span> {data.message}</p>}
                      </>
                    )}
                  </div>
                </div>

                {/* Suggestions */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Suggested Actions
                  </h4>
                  <ul className="space-y-2">
                    {info.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Code Examples */}
                {info.codeExamples && info.codeExamples.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => toggleExpanded(`code-${type}-${index}`)}
                      className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <FileText className="h-4 w-4" />
                      Code Examples
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        {expandedSections.has(`code-${type}-${index}`) ? 'Hide' : 'Show'}
                      </span>
                    </button>
                    {expandedSections.has(`code-${type}-${index}`) && (
                      <div className="space-y-2">
                        {info.codeExamples.map((code, idx) => (
                          <div key={idx} className="relative">
                            <pre className="text-xs bg-gray-900 dark:bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto">
                              <code>{code}</code>
                            </pre>
                            <button
                              onClick={() => copyToClipboard(code, `code-${type}-${index}-${idx}`)}
                              className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
                            >
                              {copiedText === `code-${type}-${index}-${idx}` ? (
                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Documentation Links */}
                {info.documentationLinks && info.documentationLinks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Helpful Resources
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {info.documentationLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {link.text}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Alternative Routes - Show when transaction failed and we have transaction data */}
      {transactionData && allErrors.length > 0 && (
        <div className="mt-8">
          <RouteComparison 
            transactionData={transactionData}
            onRouteSelect={(route) => {
              // Handle route selection - could emit event or call callback
              console.log('Selected alternative route:', route)
            }}
          />
        </div>
      )}
    </div>
  )
}
