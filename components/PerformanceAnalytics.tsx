'use client'

import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Activity, Clock, DollarSign, Loader2 } from 'lucide-react'

interface PerformanceAnalyticsProps {
  timeframe?: '24h' | '7d' | '30d'
  className?: string
}

interface BridgeAnalytics {
  summary: {
    totalVolume24h: number
    totalTxs24h: number
    totalBridges: number
    lifiVolume24h: number
    lifiTxs24h: number
  }
  bridges: Array<{
    id: string
    name: string
    volume24h: number
    volume7d: number
    volume30d: number
    txs24h: number
    txs7d: number
    txs30d: number
    chains: string[]
    marketShare: number
  }>
  chains: Array<{
    chainId: string
    name: string
    volume24h: number
    txs24h: number
    bridgeCount: number
    marketShare: number
  }>
  historical: Array<{
    date: string
    volume: number
    txs: number
    index: number
  }>
  timeframe: string
  lastUpdated: string
}

export function PerformanceAnalytics({ timeframe = '24h', className }: PerformanceAnalyticsProps) {
  const { data: analytics, isLoading, error } = useQuery<BridgeAnalytics>({
    queryKey: ['bridge-analytics', timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/analytics?timeframe=${timeframe}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      return response.json()
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  const formatCurrency = (value: number) => {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`
    }
    return `$${value.toFixed(2)}`
  }

  const formatNumber = (value: number) => {
    if (value >= 1e6) {
      return `${(value / 1e6).toFixed(2)}M`
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(2)}K`
    }
    return new Intl.NumberFormat().format(Math.floor(value))
  }

  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Performance Analytics
              <Badge variant="outline">{timeframe}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-96">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              Loading bridge analytics...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Performance Analytics
              <Badge variant="outline">{timeframe}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">Failed to load analytics data</p>
              <p className="text-sm">Please try again later</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  const topBridges = analytics.bridges.slice(0, 8)
  const topChains = analytics.chains.slice(0, 10)

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Bridge Performance Analytics
            <Badge variant="outline">{timeframe}</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(analytics.lastUpdated).toLocaleTimeString()}
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bridges" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bridges">Bridge Performance</TabsTrigger>
              <TabsTrigger value="trends">Volume Trends</TabsTrigger>
              <TabsTrigger value="chains">Chain Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="bridges" className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Total Volume</p>
                        <p className="text-2xl font-bold">{formatCurrency(analytics.summary.totalVolume24h)}</p>
                      </div>
                      <Activity className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">24h volume</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Total Transactions</p>
                        <p className="text-2xl font-bold">{formatNumber(analytics.summary.totalTxs24h)}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">24h transactions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Active Bridges</p>
                        <p className="text-2xl font-bold">{analytics.summary.totalBridges}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-yellow-500" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Total bridges</p>
                  </CardContent>
                </Card>
                {analytics.summary.lifiVolume24h > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">LI.FI Volume</p>
                          <p className="text-2xl font-bold">{formatCurrency(analytics.summary.lifiVolume24h)}</p>
                        </div>
                        <Badge className="bg-purple-500">LI.FI</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatNumber(analytics.summary.lifiTxs24h)} transactions
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Top Bridges Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {topBridges.slice(0, 4).map((bridge) => (
                  <Card key={bridge.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium truncate">{bridge.name}</h4>
                        <Badge variant="outline">
                          {bridge.marketShare.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Volume: {formatCurrency(bridge.volume24h)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          Txs: {formatNumber(bridge.txs24h)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Chains: {bridge.chains.length}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Bridge Volume Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Bridge Volume Distribution (24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topBridges}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tickFormatter={formatCurrency} />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Volume']}
                        labelFormatter={(label) => `Bridge: ${label}`}
                      />
                      <Bar dataKey="volume24h" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Market Share Pie Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Market Share by Volume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={topBridges.slice(0, 8)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="marketShare"
                        >
                          {topBridges.slice(0, 8).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Market Share']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topBridges.slice(0, 6)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={formatNumber} />
                        <Tooltip formatter={(value: number) => [formatNumber(value), 'Transactions']} />
                        <Bar dataKey="txs24h" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              {/* Trend Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Avg Daily Volume</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(analytics.historical.reduce((acc, item) => acc + item.volume, 0) / analytics.historical.length)}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Last {analytics.historical.length} days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Avg Daily Txs</p>
                        <p className="text-2xl font-bold">
                          {formatNumber(analytics.historical.reduce((acc, item) => acc + item.txs, 0) / analytics.historical.length)}
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Last {analytics.historical.length} days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Peak Volume</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(Math.max(...analytics.historical.map(item => item.volume)))}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-yellow-500" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Highest single day</p>
                  </CardContent>
                </Card>
              </div>

              {/* Volume Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Volume Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.historical}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis tickFormatter={formatCurrency} />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Volume']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Line
                        type="monotone"
                        dataKey="volume"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Transaction Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Count Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.historical}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis tickFormatter={formatNumber} />
                      <Tooltip
                        formatter={(value: number) => [formatNumber(value), 'Transactions']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Line
                        type="monotone"
                        dataKey="txs"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chains" className="space-y-4">
              {/* Chain Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {topChains.slice(0, 6).map((chain) => (
                  <Card key={chain.chainId}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium truncate">{chain.name}</h4>
                        <Badge variant="outline">
                          {chain.marketShare.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>Volume: {formatCurrency(chain.volume24h)}</div>
                        <div>Transactions: {formatNumber(chain.txs24h)}</div>
                        <div>Bridges: {chain.bridgeCount}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Chain Volume Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Chain Volume Distribution (24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={topChains} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={formatCurrency} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'Volume']} />
                      <Bar dataKey="volume24h" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
