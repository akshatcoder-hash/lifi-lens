"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Zap, Globe, Clock } from 'lucide-react'

interface NetworkStatus {
  name: string
  symbol: string
  status: 'healthy' | 'warning' | 'error'
  responseTime: number
  blockHeight?: number
}

const networks: NetworkStatus[] = [
  { name: 'Ethereum', symbol: 'ETH', status: 'healthy', responseTime: 45, blockHeight: 18756432 },
  { name: 'Arbitrum', symbol: 'ARB', status: 'healthy', responseTime: 23, blockHeight: 1428765 },
  { name: 'Polygon', symbol: 'MATIC', status: 'healthy', responseTime: 67, blockHeight: 49832156 },
  { name: 'Optimism', symbol: 'OP', status: 'warning', responseTime: 156, blockHeight: 112834567 },
  { name: 'Base', symbol: 'BASE', status: 'healthy', responseTime: 34, blockHeight: 8234567 }
]

export function NetworkStatusBar() {
  const [apiStatus, setApiStatus] = useState<'healthy' | 'warning' | 'error'>('healthy')
  const [avgResponseTime, setAvgResponseTime] = useState(45)
  const [totalTransactions, setTotalTransactions] = useState(12543)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAvgResponseTime(prev => prev + (Math.random() - 0.5) * 10)
      setTotalTransactions(prev => prev + Math.floor(Math.random() * 3))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'status-healthy'
      case 'warning': return 'status-warning'
      case 'error': return 'status-error'
      default: return 'status-healthy'
    }
  }

  return (
    <div className="w-full">

      {/* Network Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {networks.map((network, index) => (
          <motion.div
            key={network.name}
            className="bg-card border rounded-lg p-3 hover:bg-muted/50 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`status-dot ${getStatusColor(network.status)}`}></div>
                <span className="font-medium text-xs">{network.symbol}</span>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {network.responseTime}ms
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {network.name}
            </div>
            
            {network.blockHeight && (
              <div className="text-xs text-muted-foreground font-mono mt-1">
                #{network.blockHeight.toLocaleString()}
              </div>
            )}
          </motion.div>
        ))}
      </div>

    </div>
  )
}
