"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TransactionStatus, TransactionSubstatus } from '@/types/lifi'
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressTimerProps {
  status: TransactionStatus
  substatus?: TransactionSubstatus
  estimatedTime?: string
  startTime?: number
}

export function ProgressTimer({ 
  status, 
  substatus, 
  estimatedTime,
  startTime = Date.now() 
}: ProgressTimerProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isLongRunning, setIsLongRunning] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - startTime) / 1000)
      setElapsedTime(elapsed)
      
      // Mark as long running if over 10 minutes for pending transactions
      setIsLongRunning(status === TransactionStatus.PENDING && elapsed > 600)
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, status])

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}m ${remainingSeconds}s`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${minutes}m`
    }
  }

  const getStatusConfig = () => {
    switch (status) {
      case TransactionStatus.DONE:
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          label: 'Completed',
          showElapsed: true
        }
      case TransactionStatus.FAILED:
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          label: 'Failed',
          showElapsed: true
        }
      case TransactionStatus.PENDING:
        return {
          icon: Clock,
          color: isLongRunning ? 'text-orange-500' : 'text-blue-500',
          bgColor: isLongRunning ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: isLongRunning ? 'border-orange-200 dark:border-orange-800' : 'border-blue-200 dark:border-blue-800',
          label: isLongRunning ? 'Taking longer than expected' : 'Processing',
          showElapsed: true
        }
      default:
        return {
          icon: Clock,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          label: 'Waiting',
          showElapsed: false
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const getEstimatedRemaining = () => {
    if (!estimatedTime || status === TransactionStatus.DONE || status === TransactionStatus.FAILED) {
      return null
    }

    // Parse estimated time (e.g., "5-15 min", "1-3 min")
    const match = estimatedTime.match(/(\d+)(?:-(\d+))?\s*(min|sec)/i)
    if (!match) return null

    const [, min, max, unit] = match
    const avgTime = max ? (parseInt(min) + parseInt(max)) / 2 : parseInt(min)
    const timeInSeconds = unit.toLowerCase() === 'min' ? avgTime * 60 : avgTime
    const remaining = Math.max(0, timeInSeconds - elapsedTime)

    return remaining > 0 ? formatTime(remaining) : 'Any moment now...'
  }

  const estimatedRemaining = getEstimatedRemaining()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200",
        config.bgColor,
        config.borderColor
      )}
    >
      <motion.div
        animate={status === TransactionStatus.PENDING ? { rotate: 360 } : {}}
        transition={status === TransactionStatus.PENDING ? { 
          repeat: Infinity, 
          duration: 2, 
          ease: "linear" 
        } : {}}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
      </motion.div>
      
      <div className="text-sm">
        <div className={cn("font-medium", config.color)}>
          {config.label}
        </div>
        
        {config.showElapsed && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span>Elapsed: {formatTime(elapsedTime)}</span>
            
            {estimatedRemaining && (
              <>
                <span>•</span>
                <span className={cn(
                  isLongRunning && "text-orange-600 dark:text-orange-400 font-medium"
                )}>
                  {estimatedRemaining}
                </span>
              </>
            )}
          </div>
        )}
        
        {isLongRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1"
          >
            ⚠️ This is taking longer than usual
          </motion.div>
        )}
      </div>
      
      {status === TransactionStatus.PENDING && (
        <div className="ml-2">
          <motion.div
            className="flex space-x-1"
            initial="loading"
            animate="loading"
          >
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className={cn("w-1 h-1 rounded-full", config.color.replace('text-', 'bg-'))}
                variants={{
                  loading: {
                    opacity: [0.3, 1, 0.3],
                    transition: {
                      repeat: Infinity,
                      duration: 1.4,
                      delay: index * 0.2,
                    },
                  },
                }}
              />
            ))}
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

// Helper component for countdown specifically
interface CountdownTimerProps {
  targetTime: number
  onComplete?: () => void
  className?: string
}

export function CountdownTimer({ targetTime, onComplete, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now()
      const remaining = Math.max(0, targetTime - now)
      setTimeLeft(Math.floor(remaining / 1000))
      
      if (remaining <= 0 && onComplete) {
        onComplete()
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [targetTime, onComplete])

  return (
    <motion.div
      className={cn("text-sm font-mono", className)}
      animate={{ scale: timeLeft <= 30 ? [1, 1.1, 1] : 1 }}
      transition={{ repeat: timeLeft <= 30 ? Infinity : 0, duration: 1 }}
    >
      {timeLeft > 0 ? (
        <span className={timeLeft <= 30 ? "text-orange-500" : "text-gray-600 dark:text-gray-400"}>
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </span>
      ) : (
        <span className="text-green-500">Ready!</span>
      )}
    </motion.div>
  )
}
