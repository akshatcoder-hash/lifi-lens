import { NextRequest, NextResponse } from 'next/server'
import axios, { AxiosError } from 'axios'
import { BridgeType } from '@/types/lifi'

const LIFI_BASE_URL = 'https://li.quest/v1'

// Rate limiting tracking
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX = 100 // requests per window

// Create axios instance lazily to avoid build-time errors
let api: ReturnType<typeof axios.create> | null = null

function getApiClient() {
  if (!api) {
    const apiKey = process.env.LIFI_API_KEY
    if (!apiKey) {
      throw new Error('LIFI_API_KEY environment variable is required')
    }
    
    api = axios.create({
      baseURL: LIFI_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-lifi-api-key': apiKey
      }
    })
  }
  return api
}

// Valid bridge types for validation
const validBridges: BridgeType[] = [
  'hop', 'cbridge', 'celercircle', 'optimism', 'polygon',
  'arbitrum', 'avalanche', 'across', 'gnosis', 'omni',
  'relay', 'celerim', 'symbiosis', 'thorswap', 'squid',
  'allbridge', 'mayan', 'debridge', 'chainflip'
]

function validateTxHash(txHash: string): boolean {
  // Basic validation for transaction hash (64 character hex string)
  const txHashRegex = /^0x[a-fA-F0-9]{64}$/
  return txHashRegex.test(txHash) || txHash.length >= 32 // Allow other formats too
}

function validateChainId(chainId: string): boolean {
  const parsed = parseInt(chainId, 10)
  return !isNaN(parsed) && parsed > 0
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now()
  const current = requestCounts.get(clientId)
  
  if (!current || now > current.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (current.count >= RATE_LIMIT_MAX) {
    return false
  }
  
  current.count++
  return true
}

function getClientId(request: NextRequest): string {
  // Use IP address or fallback to a default identifier
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] || request.ip || 'unknown'
  return ip
}

function createErrorResponse(error: any, txHash?: string) {
  let status = 500
  let code = 'UNKNOWN_ERROR'
  let message = 'An unexpected error occurred'
  let isRetryable = false

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError
    status = axiosError.response?.status || 500
    
    // Handle specific LI.FI API errors
    const responseData = axiosError.response?.data as any
    if (responseData?.message) {
      message = responseData.message
    } else if (responseData?.error) {
      message = responseData.error
    } else {
      message = axiosError.message
    }

    switch (status) {
      case 400:
        code = 'VALIDATION_ERROR'
        message = responseData?.message || 'Invalid request parameters'
        break
      case 401:
        code = 'UNAUTHORIZED'
        message = 'API key is invalid or missing'
        break
      case 404:
        code = 'NOT_FOUND'
        message = txHash ? `Transaction ${txHash} not found` : 'Resource not found'
        break
      case 429:
        code = 'RATE_LIMITED'
        message = 'Too many requests. Please try again later'
        isRetryable = true
        break
      case 500:
      case 502:
      case 503:
      case 504:
        code = 'SERVER_ERROR'
        message = 'LI.FI service is temporarily unavailable'
        isRetryable = true
        break
      default:
        isRetryable = status >= 500
    }
  } else if (error.code === 'ECONNABORTED') {
    code = 'TIMEOUT'
    message = 'Request timeout'
    status = 408
    isRetryable = true
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    code = 'NETWORK_ERROR'
    message = 'Network connection failed'
    status = 503
    isRetryable = true
  }

  const retryAfter = error.response?.headers?.['retry-after']

  return {
    error: {
      code,
      message,
      isRetryable,
      ...(retryAfter && { retryAfter: parseInt(retryAfter, 10) })
    },
    status
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const searchParams = request.nextUrl.searchParams
    const txHash = searchParams.get('txHash')
    const fromChain = searchParams.get('fromChain')
    const toChain = searchParams.get('toChain')
    const bridge = searchParams.get('bridge')

    // Validate required parameters
    if (!txHash) {
      return NextResponse.json(
        { 
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Transaction hash is required',
            isRetryable: false
          }
        },
        { status: 400 }
      )
    }

    // Validate transaction hash format
    if (!validateTxHash(txHash)) {
      return NextResponse.json(
        { 
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid transaction hash format',
            isRetryable: false
          }
        },
        { status: 400 }
      )
    }

    // Validate optional parameters
    if (fromChain && !validateChainId(fromChain)) {
      return NextResponse.json(
        { 
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid fromChain parameter',
            isRetryable: false
          }
        },
        { status: 400 }
      )
    }

    if (toChain && !validateChainId(toChain)) {
      return NextResponse.json(
        { 
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid toChain parameter',
            isRetryable: false
          }
        },
        { status: 400 }
      )
    }

    if (bridge && !validBridges.includes(bridge as BridgeType)) {
      return NextResponse.json(
        { 
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid bridge parameter. Must be one of: ${validBridges.join(', ')}`,
            isRetryable: false
          }
        },
        { status: 400 }
      )
    }

    // Check rate limiting
    const clientId = getClientId(request)
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { 
          error: {
            code: 'RATE_LIMITED',
            message: 'Rate limit exceeded. Please try again later',
            isRetryable: true,
            retryAfter: 60
          }
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60'
          }
        }
      )
    }

    // Build request parameters
    const params: any = { txHash }
    if (fromChain) params.fromChain = fromChain
    if (toChain) params.toChain = toChain
    if (bridge) params.bridge = bridge

    // Make API request
    const response = await getApiClient().get('/status', { params })
    const duration = Date.now() - startTime

    // Log successful requests for monitoring
    console.log(`LI.FI status request completed in ${duration}ms for txHash: ${txHash}`)

    return NextResponse.json(response.data)

  } catch (error: any) {
    const duration = Date.now() - startTime
    const txHash = request.nextUrl.searchParams.get('txHash')
    
    console.error(`LI.FI status request failed after ${duration}ms:`, {
      txHash,
      error: error.message,
      status: error.response?.status,
      code: error.code
    })
    
    const { error: errorResponse, status } = createErrorResponse(error, txHash || undefined)
    
    return NextResponse.json(
      errorResponse,
      { 
        status,
        headers: error.response?.headers?.['retry-after'] 
          ? { 'Retry-After': error.response.headers['retry-after'] }
          : {}
      }
    )
  }
}
