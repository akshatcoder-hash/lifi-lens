import {
  Route,
  RoutesRequest,
  RouteMetrics,
  RouteRecommendation,
  RouteRecommendationType,
  AlternativeRoute,
  RouteComparison,
  StatusResponse,
  TransactionInfo,
  TokenInfo,
} from "@/types/lifi";
import { lifiClient } from "./lifi-client";

/**
 * Extract transaction parameters from a failed transaction for route comparison
 */
export function extractRouteParameters(
  transactionData: StatusResponse
): Partial<RoutesRequest> | null {
  const { sending, receiving } = transactionData;

  if (!sending?.token || !sending?.chainId) {
    return null;
  }

  const baseParams: Partial<RoutesRequest> = {
    fromChainId: sending.chainId,
    fromTokenAddress: sending.token.address,
    fromAmount: sending.amount || "0",
    fromAddress: transactionData.fromAddress,
    toAddress: transactionData.toAddress,
  };

  // If we have receiving info, use it; otherwise make reasonable assumptions
  if (receiving?.token && receiving?.chainId) {
    baseParams.toChainId = receiving.chainId;
    baseParams.toTokenAddress = receiving.token.address;
  } else {
    // Try to infer from included steps or use same chain
    const steps = sending.includedSteps;
    if (steps && steps.length > 0) {
      const lastStep = steps[steps.length - 1];
      if (lastStep.toToken) {
        baseParams.toChainId = lastStep.toToken.chainId;
        baseParams.toTokenAddress = lastStep.toToken.address;
      }
    }
  }

  return baseParams;
}

/**
 * Generate alternative route configurations with different parameters
 */
export function generateAlternativeConfigs(
  baseParams: RoutesRequest
): RoutesRequest[] {
  const alternatives: RoutesRequest[] = [];

  // Base configuration
  alternatives.push(baseParams);

  // Higher slippage tolerance
  alternatives.push({
    ...baseParams,
    options: {
      ...baseParams.options,
      slippage: 0.03, // 3%
      order: "CHEAPEST",
    },
  });

  alternatives.push({
    ...baseParams,
    options: {
      ...baseParams.options,
      slippage: 0.05, // 5%
      order: "FASTEST",
    },
  });

  // Different bridge preferences
  alternatives.push({
    ...baseParams,
    options: {
      ...baseParams.options,
      slippage: 0.02,
      bridges: {
        prefer: ["hop", "across", "cbridge"],
      },
    },
  });

  // Different exchange preferences
  alternatives.push({
    ...baseParams,
    options: {
      ...baseParams.options,
      slippage: 0.02,
      exchanges: {
        prefer: ["1inch", "paraswap", "0x"],
      },
    },
  });

  // Allow switch chain (2-step routes)
  alternatives.push({
    ...baseParams,
    options: {
      ...baseParams.options,
      slippage: 0.025,
      allowSwitchChain: true,
    },
  });

  // Conservative approach - lower slippage, reliable bridges
  alternatives.push({
    ...baseParams,
    options: {
      ...baseParams.options,
      slippage: 0.01, // 1%
      bridges: {
        prefer: ["hop", "arbitrum", "optimism", "polygon"],
      },
      order: "CHEAPEST",
    },
  });

  return alternatives;
}

/**
 * Calculate route metrics for comparison
 */
export function calculateRouteMetrics(route: Route): RouteMetrics {
  // Calculate total fees in USD
  const totalFeesUSD = route.steps.reduce((total, step) => {
    const stepFees = step.estimate.feeCosts?.reduce((stepTotal, fee) => {
      return stepTotal + parseFloat(fee.amountUSD || "0");
    }, 0) || 0;
    
    const gasFees = step.estimate.gasCosts?.reduce((gasTotal, gas) => {
      return gasTotal + parseFloat(gas.amountUSD || "0");
    }, 0) || 0;
    
    return total + stepFees + gasFees;
  }, 0);

  // Calculate execution time (sum of all steps)
  const executionTimeMinutes = route.steps.reduce((total, step) => {
    return total + (step.estimate.executionDuration / 60); // Convert seconds to minutes
  }, 0);

  // Calculate price impact
  const fromAmountUSD = parseFloat(route.fromAmountUSD || "0");
  const toAmountUSD = parseFloat(route.toAmountUSD || "0");
  const priceImpactPercent = fromAmountUSD > 0 
    ? Math.abs((fromAmountUSD - toAmountUSD - totalFeesUSD) / fromAmountUSD) * 100 
    : 0;

  // Complexity score based on number of steps and types
  const complexityScore = route.steps.length + 
    (route.steps.some(s => s.type === 'cross') ? 2 : 0) + // Cross-chain adds complexity
    (route.steps.filter(s => s.type === 'swap').length * 0.5); // Each swap adds some complexity

  // Gas efficiency (lower is better)
  const totalGasUSD = route.steps.reduce((total, step) => {
    return total + (step.estimate.gasCosts?.reduce((gasTotal, gas) => {
      return gasTotal + parseFloat(gas.amountUSD || "0");
    }, 0) || 0);
  }, 0);
  
  const gasEfficiency = fromAmountUSD > 0 ? (totalGasUSD / fromAmountUSD) * 100 : 100;

  // Liquidity depth estimation based on route and tools used
  const liquidityDepth = estimateLiquidityDepth(route);

  // Bridge reliability based on known reliable bridges
  const bridgeReliability = calculateBridgeReliability(route);

  // Slippage tolerance from route options or default
  const slippageTolerance = extractSlippageTolerance(route) || 2; // Default 2%

  return {
    totalFeesUSD,
    totalGasUSD,
    estimatedTime: executionTimeMinutes * 60, // Convert back to seconds
    priceImpact: priceImpactPercent / 100, // Convert to decimal
    complexityScore,
    gasEfficiency,
    liquidityScore: liquidityDepth === 'HIGH' ? 9 : liquidityDepth === 'MEDIUM' ? 6 : 3,
    bridgeReliability,
    slippageTolerance,
  };
}

/**
 * Generate recommendations for routes
 */
export function generateRouteRecommendation(
  route: Route,
  metrics: RouteMetrics,
  allRoutes: Route[]
): RouteRecommendation {
  // Sort all routes by different criteria to determine rankings
  const byFees = [...allRoutes].sort((a, b) => 
    calculateRouteMetrics(a).totalFeesUSD - calculateRouteMetrics(b).totalFeesUSD
  );
  const byTime = [...allRoutes].sort((a, b) => 
    calculateRouteMetrics(a).estimatedTime - calculateRouteMetrics(b).estimatedTime
  );
  const byReliability = [...allRoutes].sort((a, b) => 
    calculateRouteMetrics(b).bridgeReliability - calculateRouteMetrics(a).bridgeReliability
  );

  let type: RouteRecommendationType = RouteRecommendationType.ALTERNATIVE;
  const reasons: string[] = [];
  const pros: string[] = [];
  const cons: string[] = [];

  // Determine recommendation type
  if (byFees[0]?.id === route.id) {
    type = RouteRecommendationType.CHEAPEST;
    reasons.push('Lowest total fees among all options');
  } else if (byTime[0]?.id === route.id) {
    type = RouteRecommendationType.FASTEST;
    reasons.push('Shortest estimated execution time');
  } else if (byReliability[0]?.id === route.id) {
    type = RouteRecommendationType.SAFEST;
    reasons.push('Uses most reliable bridges and exchanges');
  }

  // Determine if this is the optimal route (balanced score)
  const optimalScore = calculateOptimalScore(metrics);
  const isOptimal = allRoutes.every(r => {
    const otherMetrics = calculateRouteMetrics(r);
    const otherScore = calculateOptimalScore(otherMetrics);
    return optimalScore >= otherScore || r.id === route.id;
  });

  if (isOptimal && type === RouteRecommendationType.ALTERNATIVE) {
    type = RouteRecommendationType.OPTIMAL;
    reasons.push('Best balance of cost, time, and reliability');
  }

  // Generate pros
  if (metrics.totalFeesUSD < 10) {
    pros.push('Low transaction fees');
  }
  if (metrics.estimatedTime < 300) { // 5 minutes in seconds
    pros.push('Fast execution time');
  }
  if (metrics.bridgeReliability > 8) {
    pros.push('Uses reliable, battle-tested bridges');
  }
  if (metrics.complexityScore < 3) {
    pros.push('Simple, straightforward route');
  }
  if (metrics.gasEfficiency < 2) {
    pros.push('Gas efficient');
  }
  if (metrics.liquidityScore > 7) {
    pros.push('High liquidity depth');
  }

  // Generate cons
  if (metrics.totalFeesUSD > 50) {
    cons.push('Higher transaction fees');
  }
  if (metrics.estimatedTime > 900) { // 15 minutes in seconds
    cons.push('Longer execution time');
  }
  if (metrics.bridgeReliability < 6) {
    cons.push('Uses less proven bridges');
  }
  if (metrics.complexityScore > 5) {
    cons.push('Complex multi-step route');
  }
  if (metrics.gasEfficiency > 5) {
    cons.push('Higher gas costs');
  }
  if (metrics.priceImpact > 0.01) { // 1% as decimal
    cons.push('Higher price impact');
  }

  // Suggest adjustments
  const adjustments: RouteRecommendation['adjustments'] = {};
  if (metrics.slippageTolerance < 2 && metrics.priceImpact > 0.005) { // 0.5% as decimal
    adjustments.slippage = 3; // Suggest 3%
  }

  return {
    type,
    reasons,
    pros,
    cons,
    ...(Object.keys(adjustments).length > 0 && { adjustments }),
  };
}

/**
 * Calculate success probability for a route
 */
export function calculateSuccessProbability(
  route: Route,
  metrics: RouteMetrics
): number {
  let probability = 95; // Start with high base probability

  // Reduce based on complexity
  probability -= metrics.complexityScore * 2;

  // Reduce based on bridge reliability
  probability -= (10 - metrics.bridgeReliability) * 3;

  // Reduce based on liquidity score
  if (metrics.liquidityScore < 4) probability -= 15;
  else if (metrics.liquidityScore < 7) probability -= 5;

  // Reduce based on price impact
  if (metrics.priceImpact > 0.02) probability -= 10; // 2% as decimal
  else if (metrics.priceImpact > 0.01) probability -= 5; // 1% as decimal

  // Reduce based on gas efficiency
  if (metrics.gasEfficiency > 10) probability -= 10;
  else if (metrics.gasEfficiency > 5) probability -= 5;

  // Apply route-specific factors
  const hasUnknownBridges = route.steps.some(step => 
    !isWellKnownBridge(step.tool)
  );
  if (hasUnknownBridges) probability -= 10;

  // Ensure probability is within reasonable bounds
  return Math.max(50, Math.min(98, probability));
}

/**
 * Determine risk level for a route
 */
export function calculateRiskLevel(
  metrics: RouteMetrics,
  successProbability: number
): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (successProbability < 70 || metrics.complexityScore > 6 || metrics.bridgeReliability < 6) {
    return 'HIGH';
  } else if (successProbability < 85 || metrics.complexityScore > 3 || metrics.bridgeReliability < 8) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

/**
 * Fetch alternative routes for comparison
 */
export async function fetchAlternativeRoutes(
  transactionData: StatusResponse
): Promise<RouteComparison | null> {
  const baseParams = extractRouteParameters(transactionData);
  if (!baseParams || !baseParams.fromChainId || !baseParams.toChainId) {
    return null;
  }

  try {
    const alternatives = generateAlternativeConfigs(baseParams as RoutesRequest);
    const routePromises = alternatives.map(async (config) => {
      try {
        const response = await lifiClient.getRoutes(config);
        return response.routes;
      } catch (error) {
        console.error('Failed to fetch routes for config:', config, error);
        return [];
      }
    });

    const allRoutesArrays = await Promise.all(routePromises);
    const allRoutes = allRoutesArrays.flat();

    if (allRoutes.length === 0) {
      return {
        originalRoute: undefined,
        alternativeRoutes: [],
        failureReasons: ['No alternative routes found'],
        recommendations: [],
      };
    }

    // Remove duplicates and process routes
    const uniqueRoutes = removeDuplicateRoutes(allRoutes);
    const alternativeRoutes: AlternativeRoute[] = uniqueRoutes.map(route => {
      const metrics = calculateRouteMetrics(route);
      const successProbability = calculateSuccessProbability(route, metrics);
      const riskLevel = calculateRiskLevel(metrics, successProbability);
      const recommendation = generateRouteRecommendation(route, metrics, uniqueRoutes);

      return {
        route,
        metrics,
        recommendation: recommendation.type,
        successProbability,
        riskLevel,
        pros: recommendation.pros,
        cons: recommendation.cons,
      };
    });

    // Sort by optimal score (best routes first)
    alternativeRoutes.sort((a, b) => {
      const scoreA = calculateOptimalScore(a.metrics);
      const scoreB = calculateOptimalScore(b.metrics);
      return scoreB - scoreA;
    });

    const failureReasons = analyzeFailureReasons(transactionData);

    // Generate full recommendation objects for the return value
    const recommendations = alternativeRoutes.map(r => {
      const fullRecommendation = generateRouteRecommendation(r.route, r.metrics, uniqueRoutes);
      return fullRecommendation;
    });

    return {
      originalRoute: extractOriginalRoute(transactionData),
      alternativeRoutes,
      failureReasons,
      recommendations,
    };
  } catch (error) {
    console.error('Error fetching alternative routes:', error);
    return null;
  }
}

// Helper functions

function estimateLiquidityDepth(route: Route): 'HIGH' | 'MEDIUM' | 'LOW' {
  // Simple heuristic based on known high-liquidity tools
  const highLiquidityTools = ['1inch', 'paraswap', '0x', 'uniswap', 'sushiswap'];
  const mediumLiquidityTools = ['dodo', 'kyber', 'balancer'];
  
  const hasHighLiquidity = route.steps.some(step => 
    highLiquidityTools.includes(step.tool.toLowerCase())
  );
  const hasMediumLiquidity = route.steps.some(step => 
    mediumLiquidityTools.includes(step.tool.toLowerCase())
  );

  if (hasHighLiquidity) return 'HIGH';
  if (hasMediumLiquidity) return 'MEDIUM';
  return 'LOW';
}

function calculateBridgeReliability(route: Route): number {
  const reliabilityScores: Record<string, number> = {
    'hop': 9,
    'across': 8.5,
    'cbridge': 8,
    'arbitrum': 9.5,
    'optimism': 9.5,
    'polygon': 9,
    'avalanche': 8.5,
    'gnosis': 7.5,
    'relay': 7,
    'symbiosis': 6.5,
    'thorswap': 6,
    'squid': 7,
    'allbridge': 6,
    'mayan': 6,
    'debridge': 6.5,
    'chainflip': 5.5,
  };

  const bridgeSteps = route.steps.filter(step => step.type === 'cross');
  if (bridgeSteps.length === 0) return 9; // No bridges needed

  const totalScore = bridgeSteps.reduce((sum, step) => {
    return sum + (reliabilityScores[step.tool.toLowerCase()] || 5);
  }, 0);

  return totalScore / bridgeSteps.length;
}

function extractSlippageTolerance(route: Route): number | null {
  // Try to extract slippage from route steps
  const swapSteps = route.steps.filter(step => step.action.slippage);
  if (swapSteps.length > 0) {
    return (swapSteps[0].action.slippage || 0) * 100; // Convert to percentage
  }
  return null;
}

function calculateOptimalScore(metrics: RouteMetrics): number {
  // Weighted score calculation (higher is better)
  const feeScore = Math.max(0, 100 - metrics.totalFeesUSD); // Lower fees = higher score
  const timeScore = Math.max(0, 100 - (metrics.estimatedTime / 60) * 2); // Faster = higher score (convert seconds to minutes)
  const reliabilityScore = metrics.bridgeReliability * 10; // Higher reliability = higher score
  const complexityScore = Math.max(0, 100 - metrics.complexityScore * 10); // Lower complexity = higher score
  
  return (feeScore * 0.3) + (timeScore * 0.2) + (reliabilityScore * 0.3) + (complexityScore * 0.2);
}

function isWellKnownBridge(tool: string): boolean {
  const wellKnownBridges = [
    'hop', 'across', 'cbridge', 'arbitrum', 'optimism', 'polygon', 
    'avalanche', 'gnosis', 'relay'
  ];
  return wellKnownBridges.includes(tool.toLowerCase());
}

function removeDuplicateRoutes(routes: Route[]): Route[] {
  const seen = new Set<string>();
  return routes.filter(route => {
    // Create a signature based on route characteristics
    const signature = `${route.fromChainId}-${route.toChainId}-${route.fromToken.address}-${route.toToken.address}-${route.steps.map(s => s.tool).join('-')}`;
    if (seen.has(signature)) {
      return false;
    }
    seen.add(signature);
    return true;
  });
}

function analyzeFailureReasons(transactionData: StatusResponse): string[] {
  const reasons: string[] = [];

  if (transactionData.substatus) {
    switch (transactionData.substatus) {
      case 'SLIPPAGE_EXCEEDED':
        reasons.push('Price moved beyond slippage tolerance during execution');
        break;
      case 'INSUFFICIENT_BALANCE':
        reasons.push('Insufficient balance to complete the transaction');
        break;
      case 'INSUFFICIENT_ALLOWANCE':
        reasons.push('Token allowance was insufficient');
        break;
      case 'OUT_OF_GAS':
        reasons.push('Transaction ran out of gas');
        break;
      case 'BRIDGE_NOT_AVAILABLE':
        reasons.push('Bridge service was unavailable');
        break;
      default:
        reasons.push('Transaction failed due to unknown reasons');
    }
  }

  if (transactionData.substatusMessage) {
    reasons.push(transactionData.substatusMessage);
  }

  return reasons.length > 0 ? reasons : ['Transaction failed'];
}

function extractOriginalRoute(transactionData: StatusResponse): Partial<Route> | undefined {
  const { sending, receiving } = transactionData;
  
  if (!sending?.token) return undefined;

  return {
    id: 'original',
    fromChainId: sending.chainId || 0,
    fromAmount: sending.amount || '0',
    fromAmountUSD: sending.amountUSD || '0',
    fromToken: sending.token,
    toChainId: receiving?.chainId || sending.chainId || 0,
    toAmount: receiving?.amount || '0',
    toAmountUSD: receiving?.amountUSD || '0',
    toAmountMin: receiving?.amount || '0',
    toToken: receiving?.token || sending.token,
    gasCostUSD: sending.gasAmountUSD,
    steps: [],
    fromAddress: transactionData.fromAddress,
    toAddress: transactionData.toAddress,
  };
}
