"use client"

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Info,
  RefreshCw,
  Route as RouteIcon,
  TrendingUp,
  Zap,
  Shield,
  ArrowRight,
  Copy,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  Network,
  Target
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { StatusResponse, Route, RouteRecommendationType, RouteComparison as RouteComparisonData } from '@/types/lifi'
import { AlternativeRoute, RouteMetrics } from '@/types/lifi'
import { fetchAlternativeRoutes } from '@/lib/route-analysis'

interface RouteComparisonProps {
  transactionData: StatusResponse
  className?: string
  onRouteSelect?: (route: Route) => void
}

interface RouteComparisonState {
  loading: boolean
  alternatives: RouteComparisonData | null
  error: string | null
  expandedRoutes: Set<string>
  copiedText: string | null
}

export function RouteComparison({ 
  transactionData, 
  className = "",
  onRouteSelect
}: RouteComparisonProps) {
  const [state, setState] = useState<RouteComparisonState>({
    loading: true,
    alternatives: null,
    error: null,
    expandedRoutes: new Set(),
    copiedText: null
  })

  useEffect(() => {
    const loadAlternatives = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))
        const alternatives = await fetchAlternativeRoutes(transactionData)
        setState(prev => ({ ...prev, alternatives, loading: false }))
      } catch (error) {
        console.error('Failed to fetch alternative routes:', error)
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Failed to fetch alternatives',
          loading: false 
        }))
      }
    }

    loadAlternatives()
  }, [transactionData])

  const toggleExpanded = (routeId: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedRoutes)
      if (newExpanded.has(routeId)) {
        newExpanded.delete(routeId)
      } else {
        newExpanded.add(routeId)
      }
      return { ...prev, expandedRoutes: newExpanded }
    })
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setState(prev => ({ ...prev, copiedText: label }))
      setTimeout(() => setState(prev => ({ ...prev, copiedText: null })), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleTryRoute = (route: Route) => {
    if (onRouteSelect) {
      onRouteSelect(route)
    }
  }

  const getRecommendationColor = (recommendation: RouteRecommendationType) => {
    switch (recommendation) {
      case RouteRecommendationType.OPTIMAL:
        return 'border-green-500 bg-green-50 dark:bg-green-900/10'
      case RouteRecommendationType.FASTEST:
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
      case RouteRecommendationType.CHEAPEST:
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
      case RouteRecommendationType.SAFEST:
        return 'border-purple-500 bg-purple-50 dark:bg-purple-900/10'
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/10'
    }
  }

  const getRecommendationIcon = (recommendation: RouteRecommendationType) => {
    switch (recommendation) {
      case RouteRecommendationType.OPTIMAL:
        return <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
      case RouteRecommendationType.FASTEST:
        return <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      case RouteRecommendationType.CHEAPEST:
        return <DollarSign className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      case RouteRecommendationType.SAFEST:
        return <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      default:
        return <RouteIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getRiskLevelColor = (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (riskLevel) {
      case 'LOW':
        return 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/20'
      case 'MEDIUM':
        return 'text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/20'
      case 'HIGH':
        return 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/20'
    }
  }

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  const formatAmount = (amount: string, decimals: number, symbol: string): string => {
    const value = parseFloat(amount) / Math.pow(10, decimals)
    return `${value.toFixed(4)} ${symbol}`
  }

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`
  }

  if (state.loading) {
    return (
      <div className={`border border-gray-300 dark:border-gray-600 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600 dark:text-gray-300">
              Analyzing alternative routes...
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
              Unable to Load Alternative Routes
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              {state.error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!state.alternatives || state.alternatives.alternativeRoutes.length === 0) {
    return (
      <div className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/10 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              No Alternative Routes Available
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              We could not find any better alternative routes for this transaction at the moment.
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• The original route may have been the best available option</li>
              <li>• Market conditions might have limited alternatives</li>
              <li>• Try again later when liquidity conditions may improve</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <RouteIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Alternative Routes
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {state.alternatives.alternativeRoutes.length} alternative{state.alternatives.alternativeRoutes.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {state.alternatives.alternativeRoutes.map((alternative: AlternativeRoute, index: number) => {
        const isExpanded = state.expandedRoutes.has(alternative.route.id)
        const routeId = alternative.route.id

        return (
          <div 
            key={routeId}
            className={`border rounded-lg overflow-hidden transition-all duration-200 ${getRecommendationColor(alternative.recommendation)}`}
          >
            {/* Route Header */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getRecommendationIcon(alternative.recommendation)}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {alternative.recommendation} Route
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {alternative.route.steps.length} step{alternative.route.steps.length !== 1 ? 's' : ''} • 
                      {alternative.route.steps.map(step => step.tool).join(' → ')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(alternative.riskLevel)}`}>
                    {alternative.riskLevel} Risk
                  </div>
                  <button
                    onClick={() => handleTryRoute(alternative.route)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Try This Route
                  </button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-md">
                  <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Total Fees
                  </p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    ${alternative.metrics.totalFeesUSD.toFixed(2)}
                  </p>
                </div>

                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-md">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Est. Time
                  </p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {formatDuration(alternative.metrics.estimatedTime)}
                  </p>
                </div>

                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-md">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-purple-600 dark:text-purple-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Success Rate
                  </p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {formatPercentage(alternative.successProbability)}
                  </p>
                </div>

                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-md">
                  <Network className="h-5 w-5 mx-auto mb-1 text-orange-600 dark:text-orange-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Complexity
                  </p>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {alternative.metrics.complexityScore}/10
                  </p>
                </div>
              </div>

              {/* Pros and Cons */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                    ✓ Advantages
                  </h4>
                  <ul className="text-sm space-y-1">
                    {alternative.pros.map((pro, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                    ⚠ Considerations
                  </h4>
                  <ul className="text-sm space-y-1">
                    {alternative.cons.map((con, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Expand/Collapse Button */}
              <button
                onClick={() => toggleExpanded(routeId)}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {isExpanded ? 'Hide' : 'Show'} technical details
              </button>
            </div>

            {/* Expanded Technical Details */}
            {isExpanded && (
              <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className="space-y-4">
                  {/* Route Steps */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Route Steps
                    </h4>
                    <div className="space-y-3">
                      {alternative.route.steps.map((step, stepIdx) => (
                        <div key={stepIdx} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                            {stepIdx + 1}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {step.tool}
                              </span>
                              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                {step.type}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {step.action.fromToken.symbol} → {step.action.toToken.symbol}
                              <span className="mx-2">•</span>
                              Fee: ${(step.estimate.feeCosts || []).reduce((sum, fee) => sum + parseFloat(fee.amountUSD || '0'), 0).toFixed(2)}
                              <span className="mx-2">•</span>
                              ~{formatDuration(step.estimate.executionDuration)}
                            </div>
                          </div>
                          
                          {stepIdx < alternative.route.steps.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Metrics */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Detailed Analysis
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Gas Efficiency:</span>
                          <span className="font-medium">{alternative.metrics.gasEfficiency.toFixed(1)}/10</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Price Impact:</span>
                          <span className="font-medium">{formatPercentage(alternative.metrics.priceImpact)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Bridge Reliability:</span>
                          <span className="font-medium">{alternative.metrics.bridgeReliability.toFixed(1)}/10</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Liquidity Score:</span>
                          <span className="font-medium">{alternative.metrics.liquidityScore.toFixed(1)}/10</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Total Gas (USD):</span>
                          <span className="font-medium">${alternative.metrics.totalGasUSD.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Expected Output:</span>
                          <span className="font-medium">
                            {formatAmount(
                              alternative.route.toAmount,
                              alternative.route.toToken.decimals,
                              alternative.route.toToken.symbol
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Raw Route Data */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Raw Route Data
                      </h4>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(alternative.route, null, 2), `route-${index}`)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {state.copiedText === `route-${index}` ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <pre className="text-xs bg-gray-900 dark:bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto max-h-40 overflow-y-auto">
                      <code>{JSON.stringify(alternative.route, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Help Text */}
      <div className="text-sm text-gray-500 dark:text-gray-400 text-center pt-4 border-t border-gray-200 dark:border-gray-700">
        Routes are ranked by overall optimization considering fees, speed, reliability, and success probability.
      </div>
    </div>
  )
}
