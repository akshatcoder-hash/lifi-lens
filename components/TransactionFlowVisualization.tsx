"use client"

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ParsedStatusResponse } from '@/lib/lifi-utils'
import { TransactionStatus, TransactionSubstatus } from '@/types/lifi'
import { FlowStage } from './flow/FlowStage'
import { FlowConnector } from './flow/FlowConnector'
import { ProgressTimer } from './flow/ProgressTimer'
import { StageDetails } from './flow/StageDetails'
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransactionFlowVisualizationProps {
  status: ParsedStatusResponse
  onRefresh?: () => void
  isRefreshing?: boolean
}

export interface FlowStageData {
  id: string
  title: string
  subtitle: string
  status: 'pending' | 'processing' | 'success' | 'failed' | 'waiting'
  progress: number
  details: {
    chain?: string
    amount?: string
    usdValue?: string
    gasUsed?: string
    gasPrice?: string
    txHash?: string
    txLink?: string
    timestamp?: number
    error?: string
  }
  estimatedTime?: string
  completedTime?: string
}

export function TransactionFlowVisualization({
  status,
  onRefresh,
  isRefreshing = false
}: TransactionFlowVisualizationProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [lastStatus, setLastStatus] = useState<TransactionStatus | null>(null)

  // Create flow stages from status data
  const flowStages = useMemo(() => {
    const stages: FlowStageData[] = []

    // Source Chain Stage
    stages.push({
      id: 'source',
      title: 'Source Chain',
      subtitle: status.sending.chainId ? `Chain ${status.sending.chainId}` : 'Initiating',
      status: status.sending.isCompleted ? 'success' :
        status.sending.isPending ? 'processing' :
          status.isFailed ? 'failed' : 'pending',
      progress: status.sending.isCompleted ? 100 :
        status.sending.isPending ? 75 :
          status.status === TransactionStatus.PENDING ? 50 : 0,
      details: {
        chain: status.sending.chainId?.toString(),
        amount: status.sending.formattedAmount,
        usdValue: status.sending.amountUSD,
        gasUsed: status.sending.gasUsed,
        gasPrice: status.sending.gasPrice,
        txHash: status.sending.txHash,
        txLink: status.sending.txLink,
        timestamp: status.sending.timestamp
      },
      estimatedTime: !status.sending.isCompleted ? '1-3 min' : undefined,
      completedTime: status.sending.timestamp ?
        new Date(status.sending.timestamp * 1000).toLocaleTimeString() : undefined
    })

    // Bridge Processing Stage
    const bridgeStatus = getBridgeStatus(status)
    stages.push({
      id: 'bridge',
      title: 'Bridge Processing',
      subtitle: status.tool || 'Cross-chain Bridge',
      status: bridgeStatus.status,
      progress: bridgeStatus.progress,
      details: {
        amount: status.sending.formattedAmount,
        usdValue: status.sending.amountUSD,
        error: bridgeStatus.error
      },
      estimatedTime: bridgeStatus.estimatedTime,
      completedTime: bridgeStatus.completedTime
    })

    // Destination Chain Stage
    if (status.receiving || status.status === TransactionStatus.DONE) {
      stages.push({
        id: 'destination',
        title: 'Destination Chain',
        subtitle: status.receiving?.chainId ? `Chain ${status.receiving.chainId}` : 'Completing',
        status: status.receiving?.isCompleted ? 'success' :
          status.receiving?.isPending ? 'processing' :
            status.status === TransactionStatus.DONE ? 'success' :
              status.isFailed ? 'failed' : 'waiting',
        progress: status.receiving?.isCompleted ? 100 :
          status.status === TransactionStatus.DONE ? 100 :
            status.substatus === TransactionSubstatus.WAIT_DESTINATION_TRANSACTION ? 25 : 0,
        details: {
          chain: status.receiving?.chainId?.toString(),
          amount: status.receiving?.formattedAmount,
          usdValue: status.receiving?.amountUSD,
          gasUsed: status.receiving?.gasUsed,
          gasPrice: status.receiving?.gasPrice,
          txHash: status.receiving?.txHash,
          txLink: status.receiving?.txLink,
          timestamp: status.receiving?.timestamp
        },
        estimatedTime: !status.receiving?.isCompleted && status.status !== TransactionStatus.DONE ?
          '5-15 min' : undefined,
        completedTime: status.receiving?.timestamp ?
          new Date(status.receiving.timestamp * 1000).toLocaleTimeString() : undefined
      })
    }

    return stages
  }, [status])

  // Trigger confetti on completion
  useEffect(() => {
    if (lastStatus !== TransactionStatus.DONE && status.status === TransactionStatus.DONE) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }
    setLastStatus(status.status)
  }, [status.status, lastStatus])

  const overallProgress = Math.round(
    flowStages.reduce((sum, stage) => sum + stage.progress, 0) / flowStages.length
  )

  return (
    <div className="relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 overflow-hidden">
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10"
          >
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -10,
                  rotate: 0
                }}
                animate={{
                  y: window.innerHeight + 10,
                  rotate: 360
                }}
                transition={{
                  duration: Math.random() * 2 + 1,
                  ease: "easeOut"
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Status and Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: showConfetti ? 360 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="h-6 w-6 text-blue-500" />
          </motion.div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Cross-Chain Transaction Flow
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {status.displaySubstatus || status.displayStatus}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ProgressTimer
            status={status.status}
            substatus={status.substatus}
            estimatedTime={status.estimatedTimeRemaining}
          />

          {onRefresh && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefresh}
              disabled={isRefreshing}
              className={cn(
                "p-2 rounded-lg transition-colors",
                "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600",
                "hover:bg-gray-50 dark:hover:bg-gray-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Overall Progress</span>
          <span>{overallProgress}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Flow Visualization */}
      <div className="relative">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between space-x-6">
          {flowStages.map((stage, index) => (
            <div key={stage.id} className="flex items-center flex-1">
              <div className="flex-1">
                <FlowStage
                  stage={stage}
                  isExpanded={expandedStage === stage.id}
                  onToggleExpand={() =>
                    setExpandedStage(expandedStage === stage.id ? null : stage.id)
                  }
                />
              </div>

              {index < flowStages.length - 1 && (
                <FlowConnector
                  fromStage={stage}
                  toStage={flowStages[index + 1]}
                  isActive={stage.status === 'success' || stage.status === 'processing'}
                />
              )}
            </div>
          ))}
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-4">
          {flowStages.map((stage, index) => (
            <div key={stage.id}>
              <FlowStage
                stage={stage}
                isExpanded={expandedStage === stage.id}
                onToggleExpand={() =>
                  setExpandedStage(expandedStage === stage.id ? null : stage.id)
                }
                isMobile
              />

              {index < flowStages.length - 1 && (
                <div className="flex justify-center py-2">
                  <FlowConnector
                    fromStage={stage}
                    toStage={flowStages[index + 1]}
                    isActive={stage.status === 'success' || stage.status === 'processing'}
                    isVertical
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Expanded Stage Details */}
        <AnimatePresence>
          {expandedStage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <StageDetails
                stage={flowStages.find(s => s.id === expandedStage)!}
                onClose={() => setExpandedStage(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Helper function to determine bridge processing status
function getBridgeStatus(status: ParsedStatusResponse) {
  const { status: txStatus, substatus, sending, receiving } = status

  if (txStatus === TransactionStatus.DONE) {
    return {
      status: 'success' as const,
      progress: 100,
      estimatedTime: undefined,
      completedTime: receiving?.timestamp ?
        new Date(receiving.timestamp * 1000).toLocaleTimeString() :
        new Date().toLocaleTimeString(),
      error: undefined
    }
  }

  if (txStatus === TransactionStatus.FAILED) {
    return {
      status: 'failed' as const,
      progress: 0,
      estimatedTime: undefined,
      completedTime: undefined,
      error: status.substatusMessage || 'Bridge processing failed'
    }
  }

  if (txStatus === TransactionStatus.PENDING) {
    switch (substatus) {
      case TransactionSubstatus.WAIT_SOURCE_CONFIRMATIONS:
        return {
          status: 'waiting' as const,
          progress: 25,
          estimatedTime: '1-3 min',
          completedTime: undefined,
          error: undefined
        }

      case TransactionSubstatus.WAIT_DESTINATION_TRANSACTION:
        return {
          status: 'processing' as const,
          progress: 75,
          estimatedTime: '5-15 min',
          completedTime: undefined,
          error: undefined
        }

      default:
        return {
          status: sending.isCompleted ? ('processing' as const) : ('waiting' as const),
          progress: sending.isCompleted ? 50 : 25,
          estimatedTime: '5-15 min',
          completedTime: undefined,
          error: undefined
        }
    }
  }

  return {
    status: 'waiting' as const,
    progress: 0,
    estimatedTime: undefined,
    completedTime: undefined,
    error: undefined
  }
}
