export interface StatusRequest {
  txHash: string
  bridge?: string
  fromChain?: string
  toChain?: string
}

export interface StatusResponse {
  transactionId?: string
  sending: TransactionInfo
  receiving?: TransactionInfo
  feeCosts?: FeeCost[]
  status: TransactionStatus
  substatus?: TransactionSubstatus
  substatusMessage?: string
  tool?: string
  fromAddress?: string
  toAddress?: string
  lifiExplorerLink?: string
  bridgeExplorerLink?: string
  metadata?: Metadata
  error?: {
    code: string
    message: string
  }
}

export interface TransactionInfo {
  txHash: string
  txLink?: string
  amount?: string
  token?: TokenInfo
  chainId?: number
  gasToken?: TokenInfo
  gasAmount?: string
  gasAmountUSD?: string
  gasPrice?: string
  gasUsed?: string
  timestamp?: number
  value?: string
  amountUSD?: string
  includedSteps?: IncludedStep[]
}

export interface TokenInfo {
  address: string
  chainId: number
  symbol: string
  decimals: number
  name: string
  coinKey?: string
  logoURI?: string
  priceUSD?: string
}

export interface FeeCost {
  name: string
  description?: string
  percentage?: string
  token: TokenInfo
  amount?: string
  amountUSD?: string
  included?: boolean
}

export interface IncludedStep {
  tool: string
  toolDetails?: ToolDetails
  fromAmount?: string
  fromToken?: TokenInfo
  toAmount?: string
  toToken?: TokenInfo
  bridgedAmount?: string
}

export interface ToolDetails {
  key: string
  name: string
  logoURI?: string
}

export interface Metadata {
  integrator?: string
  [key: string]: any
}

export enum TransactionStatus {
  NOT_FOUND = 'NOT_FOUND',
  INVALID = 'INVALID', 
  PENDING = 'PENDING',
  DONE = 'DONE',
  FAILED = 'FAILED'
}

export enum TransactionSubstatus {
  // PENDING substatus
  WAIT_SOURCE_CONFIRMATIONS = 'WAIT_SOURCE_CONFIRMATIONS',
  WAIT_DESTINATION_TRANSACTION = 'WAIT_DESTINATION_TRANSACTION',
  BRIDGE_NOT_AVAILABLE = 'BRIDGE_NOT_AVAILABLE',
  CHAIN_NOT_AVAILABLE = 'CHAIN_NOT_AVAILABLE',
  REFUND_IN_PROGRESS = 'REFUND_IN_PROGRESS',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  
  // DONE substatus
  COMPLETED = 'COMPLETED',
  PARTIAL = 'PARTIAL',
  REFUNDED = 'REFUNDED',
  
  // FAILED substatus
  NOT_PROCESSABLE_REFUND_NEEDED = 'NOT_PROCESSABLE_REFUND_NEEDED',
  OUT_OF_GAS = 'OUT_OF_GAS',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',
  INSUFFICIENT_ALLOWANCE = 'INSUFFICIENT_ALLOWANCE',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  EXPIRED = 'EXPIRED'
}

// API Client interfaces
export interface ApiClientConfig {
  maxRetries?: number
  initialRetryDelay?: number
  maxRetryDelay?: number
  timeout?: number
  cacheEnabled?: boolean
  cacheTTL?: number
}

export interface ApiError {
  code: string
  message: string
  status?: number
  isRetryable: boolean
  isNetworkError: boolean
  retryAfter?: number
}

export interface BatchStatusRequest {
  txHashes: string[]
  fromChain?: string
  toChain?: string
  bridge?: string
}

export interface BatchStatusResponse {
  results: Array<{
    txHash: string
    data: StatusResponse | null
    error: ApiError | null
  }>
  totalProcessed: number
  totalSuccessful: number
  totalErrors: number
}

// Bridge types
export type BridgeType = 
  | 'hop' | 'cbridge' | 'celercircle' | 'optimism' | 'polygon'
  | 'arbitrum' | 'avalanche' | 'across' | 'gnosis' | 'omni'
  | 'relay' | 'celerim' | 'symbiosis' | 'thorswap' | 'squid'
  | 'allbridge' | 'mayan' | 'debridge' | 'chainflip'

export enum ErrorCode {
  DefaultError = 1000,
  FailedToBuildTransactionError = 1001,
  NoQuoteError = 1002,
  NotFoundError = 1003,
  NotProcessableError = 1004,
  RateLimitError = 1005,
  ServerError = 1006,
  SlippageError = 1007,
  ThirdPartyError = 1008,
  TimeoutError = 1009,
  UnauthorizedError = 1010,
  ValidationError = 1011,
  RpcFailure = 1012,
  MalformedSchema = 1013
}

export const ToolErrorMessages = {
  NO_POSSIBLE_ROUTE: "No route was found for this action",
  INSUFFICIENT_LIQUIDITY: "The tool's liquidity is insufficient",
  TOOL_TIMEOUT: "The third-party tool timed out",
  UNKNOWN_ERROR: "An unknown error occurred",
  RPC_ERROR: "Problem getting on-chain data",
  AMOUNT_TOO_LOW: "Initial amount is too low",
  AMOUNT_TOO_HIGH: "Initial amount is too high",
  FEES_HIGHER_THAN_AMOUNT: "Fees exceed transfer amount",
  DIFFERENT_RECIPIENT_NOT_SUPPORTED: "Tool doesn't support different recipient addresses",
  TOOL_SPECIFIC_ERROR: "Third-party tool returned an error",
  CANNOT_GUARANTEE_MIN_AMOUNT: "Tool can't guarantee minimum amount"
}

// Routes API Types
export interface RoutesRequest {
  fromChainId: number
  toChainId: number
  fromTokenAddress: string
  toTokenAddress: string
  fromAmount: string
  fromAddress?: string
  toAddress?: string
  fromAmountForGas?: string
  options?: RouteOptions
}

export interface RouteOptions {
  integrator?: string
  fee?: number
  maxPriceImpact?: number
  order?: 'CHEAPEST' | 'FASTEST'
  slippage?: number
  referrer?: string
  allowSwitchChain?: boolean
  allowDestinationCall?: boolean
  bridges?: AllowDenyPrefer
  exchanges?: AllowDenyPrefer
  timing?: Timing
}

export interface AllowDenyPrefer {
  allow?: string[]
  deny?: string[]
  prefer?: string[]
}

export interface Timing {
  swapStepTimingStrategies?: TimingStrategy[]
  routeTimingStrategies?: TimingStrategy[]
}

export interface TimingStrategy {
  strategy: string
  minWaitTimeMs: number
  startingExpectedResults: number
  reduceEveryMs: number
}

export interface Route {
  id: string
  fromChainId: number
  fromAmountUSD: string
  fromAmount: string
  fromToken: TokenInfo
  fromAddress?: string
  toChainId: number
  toAmountUSD: string
  toAmount: string
  toAmountMin: string
  toToken: TokenInfo
  toAddress?: string
  gasCostUSD?: string
  steps: RouteStep[]
  insurance?: {
    state: string
    feeAmountUsd?: string
  }
  tags?: string[]
}

export interface RouteStep {
  id: string
  type: 'lifi' | 'cross' | 'swap'
  tool: string
  toolDetails: {
    key: string
    name: string
    logoURI?: string
  }
  action: StepAction
  estimate: StepEstimate
  includedSteps?: RouteStep[]
}

export interface StepAction {
  fromChainId: number
  toChainId: number
  fromToken: TokenInfo
  toToken: TokenInfo
  fromAmount: string
  slippage?: number
  fromAddress?: string
  toAddress?: string
}

export interface StepEstimate {
  tool: string
  fromAmount: string
  toAmount: string
  toAmountMin: string
  approvalAddress?: string
  executionDuration: number
  feeCosts?: FeeCost[]
  gasCosts?: GasCost[]
}

export interface GasCost {
  type: 'SEND' | 'APPROVE' | 'CROSS'
  price?: string
  estimate?: string
  limit?: string
  amount: string
  amountUSD?: string
  token: TokenInfo
}

export interface QuoteRequest {
  fromChain: number
  toChain: number
  fromToken: string
  toToken: string
  fromAmount: string
  fromAddress: string
  toAddress?: string
  fromAmountForGas?: string
  integrator?: string
  fee?: number
  maxPriceImpact?: number
  order?: 'CHEAPEST' | 'FASTEST'
  slippage?: number
  referrer?: string
  allowBridges?: string[]
  denyBridges?: string[]
  preferBridges?: string[]
  allowExchanges?: string[]
  denyExchanges?: string[]
  preferExchanges?: string[]
  swapStepTimingStrategies?: string[]
}

export interface Quote extends Route {
  transactionRequest?: {
    data: string
    to: string
    value: string
    from?: string
    gasPrice?: string
    gasLimit?: string
  }
}

// Route Comparison Types
// Route Comparison Types
export interface RouteComparison {
  originalRoute?: Partial<Route>
  alternativeRoutes: AlternativeRoute[]
  failureReasons: string[]
  recommendations: RouteRecommendation[]
}

export interface AlternativeRoute {
  route: Route
  metrics: RouteMetrics
  recommendation: RouteRecommendationType
  successProbability: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  pros: string[]
  cons: string[]
}

export interface RouteMetrics {
  totalFeesUSD: number
  totalGasUSD: number
  estimatedTime: number // in seconds
  priceImpact: number // as decimal (0.01 = 1%)
  complexityScore: number
  gasEfficiency: number
  liquidityScore: number
  bridgeReliability: number
  slippageTolerance: number
}

export enum RouteRecommendationType {
  OPTIMAL = 'OPTIMAL',
  FASTEST = 'FASTEST', 
  CHEAPEST = 'CHEAPEST',
  SAFEST = 'SAFEST',
  ALTERNATIVE = 'ALTERNATIVE'
}

export interface RouteRecommendation {
  type: RouteRecommendationType
  reasons: string[]
  pros: string[]
  cons: string[]
  adjustments?: {
    slippage?: number
    amount?: string
    timing?: string
  }
}

// Utility types for error categorization
export const StatusMessages = {
  [TransactionStatus.NOT_FOUND]: "Transaction not found or not yet mined",
  [TransactionStatus.INVALID]: "Hash is not tied to the requested tool",
  [TransactionStatus.PENDING]: "Bridging is still in progress",
  [TransactionStatus.DONE]: "Transaction completed successfully",
  [TransactionStatus.FAILED]: "Bridging process failed"
} as const

export const SubstatusMessages = {
  // PENDING
  [TransactionSubstatus.WAIT_SOURCE_CONFIRMATIONS]: "Waiting for source chain confirmations",
  [TransactionSubstatus.WAIT_DESTINATION_TRANSACTION]: "Waiting for destination transaction",
  [TransactionSubstatus.BRIDGE_NOT_AVAILABLE]: "Bridge API is unavailable",
  [TransactionSubstatus.CHAIN_NOT_AVAILABLE]: "Source/destination chain RPC unavailable",
  [TransactionSubstatus.REFUND_IN_PROGRESS]: "Refund in progress",
  [TransactionSubstatus.UNKNOWN_ERROR]: "Status is indeterminate",
  
  // DONE
  [TransactionSubstatus.COMPLETED]: "Transfer was successful",
  [TransactionSubstatus.PARTIAL]: "Only partial transfer completed",
  [TransactionSubstatus.REFUNDED]: "Tokens were refunded",
  
  // FAILED  
  [TransactionSubstatus.NOT_PROCESSABLE_REFUND_NEEDED]: "Cannot complete, refund needed",
  [TransactionSubstatus.OUT_OF_GAS]: "Transaction ran out of gas",
  [TransactionSubstatus.SLIPPAGE_EXCEEDED]: "Received amount too low",
  [TransactionSubstatus.INSUFFICIENT_ALLOWANCE]: "Not enough allowance",
  [TransactionSubstatus.INSUFFICIENT_BALANCE]: "Not enough balance",
  [TransactionSubstatus.EXPIRED]: "Transaction expired"
} as const
