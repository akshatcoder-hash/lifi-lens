"use client"

import { motion } from 'framer-motion'
import { Loader2, Zap, TrendingUp, Activity, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  animate?: boolean
}

export function Skeleton({ className, animate = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-gray-200 dark:bg-gray-800 rounded-md",
        animate && "animate-pulse",
        className
      )}
    />
  )
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={cn('inline-block', className)}
    >
      <Loader2 className={cn('text-blue-500', sizeClasses[size])} />
    </motion.div>
  )
}

export function TransactionSearchingSkeleton() {
  return (
    <motion.div
      className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <LoadingSpinner size="sm" />
        </div>
        <div>
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </motion.div>
  )
}

export function TransactionDetailsSkeleton() {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Hash className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {i % 2 === 0 ? (
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <Activity className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <Skeleton className="h-5 w-32" />
            </div>
            
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

interface PulsingDotProps {
  color?: 'blue' | 'green' | 'yellow' | 'red'
  size?: 'sm' | 'md' | 'lg'
}

export function PulsingDot({ color = 'blue', size = 'md' }: PulsingDotProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }
  
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  }

  return (
    <motion.div
      className={cn('rounded-full', colorClasses[color], sizeClasses[size])}
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [1, 0.5, 1]
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  )
}

export function SearchingAnimation() {
  return (
    <motion.div 
      className="flex items-center justify-center p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-center">
        <motion.div
          className="inline-flex items-center gap-2 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-4"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <LoadingSpinner size="lg" />
        </motion.div>
        
        <motion.h3 
          className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Analyzing Transaction
        </motion.h3>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Fetching data from LI.FI network...
        </p>
        
        <div className="flex items-center justify-center gap-1 mt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              className="h-2 w-2 bg-blue-500 rounded-full"
              animate={{
                y: [0, -10, 0],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
