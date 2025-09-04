"use client"

import { motion } from 'framer-motion'
import { ArrowRight, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FlowStageData } from '../TransactionFlowVisualization'

interface FlowConnectorProps {
  fromStage: FlowStageData
  toStage: FlowStageData
  isActive?: boolean
  isVertical?: boolean
}

export function FlowConnector({ 
  fromStage, 
  toStage, 
  isActive = false,
  isVertical = false 
}: FlowConnectorProps) {
  const getConnectorColor = () => {
    if (fromStage.status === 'success') {
      return 'text-green-500'
    } else if (fromStage.status === 'processing') {
      return 'text-blue-500'
    } else if (fromStage.status === 'failed') {
      return 'text-red-500'
    } else {
      return 'text-gray-300 dark:text-gray-600'
    }
  }

  const getLineColor = () => {
    if (fromStage.status === 'success') {
      return 'from-green-500 to-green-400'
    } else if (fromStage.status === 'processing') {
      return 'from-blue-500 to-blue-400'
    } else if (fromStage.status === 'failed') {
      return 'from-red-500 to-red-400'
    } else {
      return 'from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700'
    }
  }

  if (isVertical) {
    return (
      <div className="flex flex-col items-center py-2">
        {/* Vertical Line */}
        <div className="relative h-12 w-1">
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full" />
          {isActive && (
            <motion.div
              className={cn("absolute inset-0 bg-gradient-to-b rounded-full", getLineColor())}
              initial={{ height: '0%' }}
              animate={{ height: '100%' }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          )}
          
          {/* Animated Flow Particles */}
          {isActive && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className={cn("absolute w-2 h-2 rounded-full", getConnectorColor().replace('text-', 'bg-'))}
                  style={{ left: '-2px' }}
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ 
                    y: 48,
                    opacity: [0, 1, 1, 0] 
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "linear"
                  }}
                />
              ))}
            </>
          )}
        </div>

        {/* Arrow Icon */}
        <motion.div
          className={cn(
            "p-1 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600",
            getConnectorColor()
          )}
          animate={isActive ? { 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360] 
          } : {}}
          transition={isActive ? { 
            repeat: Infinity, 
            duration: 3, 
            ease: "easeInOut" 
          } : {}}
        >
          <ArrowDown className="h-3 w-3" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex items-center px-4">
      <div className="relative flex-1 h-1">
        {/* Base Line */}
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full" />
        
        {/* Animated Progress Line */}
        {isActive && (
          <motion.div
            className={cn("absolute inset-0 bg-gradient-to-r rounded-full", getLineColor())}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        )}

        {/* Animated Flow Particles */}
        {isActive && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "absolute w-2 h-2 rounded-full shadow-sm",
                  getConnectorColor().replace('text-', 'bg-')
                )}
                style={{ top: '-2px' }}
                initial={{ x: 0, opacity: 0 }}
                animate={{ 
                  x: '100%',
                  opacity: [0, 1, 1, 0] 
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "linear"
                }}
              />
            ))}
          </>
        )}

        {/* Pulsing Wave Effect */}
        {fromStage.status === 'processing' && (
          <motion.div
            className="absolute inset-0 bg-blue-400 rounded-full opacity-30"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: [0, 1, 0] }}
            transition={{ 
              repeat: Infinity, 
              duration: 2, 
              ease: "easeInOut" 
            }}
          />
        )}
      </div>

      {/* Arrow Icon */}
      <motion.div
        className={cn(
          "mx-2 p-2 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-sm",
          getConnectorColor()
        )}
        animate={isActive ? { 
          scale: [1, 1.1, 1],
          x: [0, 4, 0] 
        } : {}}
        transition={isActive ? { 
          repeat: Infinity, 
          duration: 2, 
          ease: "easeInOut" 
        } : {}}
        whileHover={{ scale: 1.2 }}
      >
        <ArrowRight className="h-4 w-4" />
      </motion.div>

      <div className="relative flex-1 h-1">
        {/* Base Line */}
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full" />
        
        {/* Next Stage Preparation */}
        {toStage.status === 'processing' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-200 to-blue-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '50%' }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        )}
      </div>
    </div>
  )
}
