"use client"

import { motion } from 'framer-motion'
import { FlowStageData } from '../TransactionFlowVisualization'
import { 
  Copy, 
  ExternalLink, 
  Clock, 
  DollarSign, 
  Fuel, 
  Hash,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface StageDetailsProps {
  stage: FlowStageData
  onClose: () => void
}

export function StageDetails({ stage, onClose }: StageDetailsProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const copyToClipboard = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(item)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getStatusConfig = () => {
    switch (stage.status) {
      case 'success':
        return {
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          iconColor: 'text-green-500',
          icon: CheckCircle2
        }
      case 'failed':
        return {
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          iconColor: 'text-red-500',
          icon: AlertCircle
        }
      case 'processing':
        return {
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          iconColor: 'text-blue-500',
          icon: Clock
        }
      default:
        return {
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          iconColor: 'text-gray-500',
          icon: Clock
        }
    }
  }

  const config = getStatusConfig()
  const StatusIcon = config.icon

  const DetailItem = ({ 
    icon: Icon, 
    label, 
    value, 
    copyable = false, 
    link 
  }: {
    icon: any
    label: string
    value?: string
    copyable?: boolean
    link?: string
  }) => {
    if (!value) return null

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {label}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {value}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {link && (
            <motion.a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1 rounded text-gray-500 hover:text-blue-500 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
            </motion.a>
          )}
          
          {copyable && (
            <motion.button
              onClick={() => copyToClipboard(value, label)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "p-1 rounded transition-colors",
                copiedItem === label 
                  ? "text-green-500" 
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <Copy className="h-3 w-3" />
            </motion.button>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-lg border p-4 space-y-4 relative overflow-hidden",
        config.bgColor,
        config.borderColor
      )}
    >
      {/* Close Button */}
      <motion.button
        onClick={onClose}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute top-3 right-3 p-1 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800 transition-colors"
      >
        <X className="h-4 w-4 text-gray-500" />
      </motion.button>

      {/* Header */}
      <div className="flex items-start gap-3 pr-10">
        <StatusIcon className={cn("h-6 w-6 flex-shrink-0 mt-0.5", config.iconColor)} />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {stage.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {stage.subtitle}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Progress</span>
          <span className="text-gray-600 dark:text-gray-400">{stage.progress}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              stage.status === 'success' && "bg-green-500",
              stage.status === 'failed' && "bg-red-500",
              stage.status === 'processing' && "bg-blue-500",
              (stage.status === 'pending' || stage.status === 'waiting') && "bg-gray-400"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${stage.progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Error Message */}
      {stage.details.error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700 dark:text-red-300">
              <div className="font-medium mb-1">Error Details</div>
              <div>{stage.details.error}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stage Details */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2">
          Transaction Details
        </h4>
        
        <div className="grid gap-3">
          <DetailItem
            icon={DollarSign}
            label="Amount"
            value={stage.details.amount}
          />
          
          <DetailItem
            icon={DollarSign}
            label="USD Value"
            value={stage.details.usdValue}
          />
          
          <DetailItem
            icon={Hash}
            label="Chain ID"
            value={stage.details.chain}
          />
          
          {stage.details.txHash && (
            <DetailItem
              icon={Hash}
              label="Transaction Hash"
              value={`${stage.details.txHash.slice(0, 10)}...${stage.details.txHash.slice(-8)}`}
              copyable
              link={stage.details.txLink}
            />
          )}
          
          <DetailItem
            icon={Fuel}
            label="Gas Used"
            value={stage.details.gasUsed}
          />
          
          <DetailItem
            icon={Fuel}
            label="Gas Price"
            value={stage.details.gasPrice}
          />
          
          {stage.completedTime && (
            <DetailItem
              icon={Clock}
              label="Completed At"
              value={stage.completedTime}
            />
          )}
          
          {stage.estimatedTime && !stage.completedTime && (
            <DetailItem
              icon={Clock}
              label="Estimated Time"
              value={stage.estimatedTime}
            />
          )}
        </div>
      </div>

      {/* Status Timeline */}
      {(stage.status === 'success' || stage.status === 'failed') && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2">
            Timeline
          </h4>
          
          <div className="space-y-2">
            {stage.details.timestamp && (
              <div className="flex items-center gap-3 text-sm">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  stage.status === 'success' ? "bg-green-500" : "bg-red-500"
                )} />
                <span className="text-gray-600 dark:text-gray-400">
                  {stage.status === 'success' ? 'Completed' : 'Failed'} at{' '}
                  {new Date(stage.details.timestamp * 1000).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Copy Success Notification */}
      {copiedItem && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full"
        >
          Copied {copiedItem}!
        </motion.div>
      )}
    </motion.div>
  )
}
