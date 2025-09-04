"use client"

import { motion } from 'framer-motion'
import { 
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FlowStageData } from '../TransactionFlowVisualization'

interface FlowStageProps {
  stage: FlowStageData
  isExpanded?: boolean
  onToggleExpand?: () => void
  isMobile?: boolean
}

export function FlowStage({ 
  stage, 
  isExpanded = false, 
  onToggleExpand,
  isMobile = false 
}: FlowStageProps) {
  const getStatusIcon = () => {
    switch (stage.status) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin" />
      case 'failed':
        return <XCircle className="h-5 w-5" />
      case 'waiting':
        return <Clock className="h-5 w-5" />
      default:
        return <AlertTriangle className="h-5 w-5" />
    }
  }

  const getStatusColor = () => {
    switch (stage.status) {
      case 'success':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-700 dark:text-green-300',
          ring: 'ring-green-200 dark:ring-green-800',
          glow: 'shadow-green-100 dark:shadow-green-900/50'
        }
      case 'processing':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-700 dark:text-blue-300',
          ring: 'ring-blue-200 dark:ring-blue-800',
          glow: 'shadow-blue-100 dark:shadow-blue-900/50'
        }
      case 'failed':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-700 dark:text-red-300',
          ring: 'ring-red-200 dark:ring-red-800',
          glow: 'shadow-red-100 dark:shadow-red-900/50'
        }
      case 'waiting':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          text: 'text-yellow-700 dark:text-yellow-300',
          ring: 'ring-yellow-200 dark:ring-yellow-800',
          glow: 'shadow-yellow-100 dark:shadow-yellow-900/50'
        }
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-800',
          text: 'text-gray-700 dark:text-gray-300',
          ring: 'ring-gray-200 dark:ring-gray-700',
          glow: 'shadow-gray-100 dark:shadow-gray-800/50'
        }
    }
  }

  const colors = getStatusColor()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative bg-white dark:bg-gray-900 rounded-xl border-2 transition-all duration-300",
        colors.ring,
        colors.glow,
        isMobile ? "w-full" : "min-w-[280px]",
        isExpanded ? "shadow-xl" : "shadow-lg hover:shadow-xl",
        onToggleExpand && "cursor-pointer"
      )}
      whileHover={{ scale: onToggleExpand ? 1.02 : 1 }}
      onClick={onToggleExpand}
    >
      {/* Status Glow Effect */}
      {stage.status === 'processing' && (
        <motion.div
          className={cn("absolute inset-0 rounded-xl blur-xl opacity-20", colors.bg)}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}

      {/* Pulse Effect for Failed States */}
      {stage.status === 'failed' && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-red-400 opacity-20"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
        />
      )}

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <motion.div
              className={cn(
                "p-2 rounded-full",
                colors.bg,
                colors.text
              )}
              animate={stage.status === 'processing' ? { rotate: 360 } : {}}
              transition={stage.status === 'processing' ? { 
                repeat: Infinity, 
                duration: 2, 
                ease: "linear" 
              } : {}}
            >
              {getStatusIcon()}
            </motion.div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {stage.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stage.subtitle}
              </p>
            </div>
          </div>

          {onToggleExpand && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </motion.div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{stage.progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                stage.status === 'success' ? "bg-green-500" :
                stage.status === 'processing' ? "bg-blue-500" :
                stage.status === 'failed' ? "bg-red-500" :
                "bg-yellow-500"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${stage.progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Key Information */}
        <div className="space-y-2">
          {stage.details.amount && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Amount</span>
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-white">
                  {stage.details.amount}
                </div>
                {stage.details.usdValue && (
                  <div className="text-xs text-gray-500">
                    ${parseFloat(stage.details.usdValue).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {stage.estimatedTime && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Est. Time</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {stage.estimatedTime}
              </span>
            </div>
          )}

          {stage.completedTime && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Completed</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {stage.completedTime}
              </span>
            </div>
          )}

          {stage.details.error && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-xs text-red-600 dark:text-red-400">
                {stage.details.error}
              </p>
            </div>
          )}

          {stage.details.txHash && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono">
                  {stage.details.txHash.slice(0, 10)}...{stage.details.txHash.slice(-8)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(stage.details.txHash!)
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <Copy className="h-3 w-3 text-gray-400" />
                </button>
                {stage.details.txLink && (
                  <a
                    href={stage.details.txLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Loading Animation Overlay */}
        {stage.status === 'processing' && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ 
              repeat: Infinity, 
              duration: 2, 
              ease: "linear" 
            }}
            style={{ 
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' 
            }}
          />
        )}
      </div>
    </motion.div>
  )
}
