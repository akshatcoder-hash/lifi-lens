export interface BridgeData {
  id: string
  name: string
  volume24h: number
  volume7d: number
  volume30d: number
  txs24h: number
  txs7d: number
  txs30d: number
  chains: string[]
}

export interface BridgeSummary {
  bridges: BridgeData[]
  totalVolume24h: number
  totalTxs24h: number
}

export interface ChainBridgeData {
  chainId: string
  name: string
  volume24h: number
  txs24h: number
  bridges: {
    [bridgeName: string]: {
      volume24h: number
      txs24h: number
    }
  }
}

export interface BridgeHistoricalData {
  date: string
  volume: number
  txs: number
  [bridgeName: string]: any
}

class DefiLlamaClient {
  private baseUrl = 'https://bridges.llama.fi'

  async getBridgesSummary(): Promise<BridgeSummary> {
    try {
      const response = await fetch(`${this.baseUrl}/bridges?includeChains=true`)
      if (!response.ok) {
        throw new Error(`Failed to fetch bridges: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Handle both array and object response formats
      const bridgesArray = Array.isArray(data) ? data : data.bridges || []
      
      const bridges: BridgeData[] = bridgesArray?.map((bridge: any) => ({
        id: bridge.id || bridge.name || 'unknown',
        name: bridge.displayName || bridge.name || 'Unknown Bridge',
        volume24h: parseFloat(bridge.lastDayVolume || bridge.volume24h || 0),
        volume7d: parseFloat(bridge.lastWeekVolume || bridge.volume7d || 0),
        volume30d: parseFloat(bridge.lastMonthVolume || bridge.volume30d || 0),
        txs24h: parseInt(bridge.lastDayTxs || bridge.txs24h || 0),
        txs7d: parseInt(bridge.lastWeekTxs || bridge.txs7d || 0),
        txs30d: parseInt(bridge.lastMonthTxs || bridge.txs30d || 0),
        chains: Array.isArray(bridge.chains) ? bridge.chains : []
      })).filter((bridge: BridgeData) => bridge.volume24h > 0 || bridge.txs24h > 0) || []

      const totalVolume24h = bridges.reduce((sum: number, bridge: BridgeData) => sum + bridge.volume24h, 0)
      const totalTxs24h = bridges.reduce((sum: number, bridge: BridgeData) => sum + bridge.txs24h, 0)

      return {
        bridges,
        totalVolume24h,
        totalTxs24h
      }
    } catch (error) {
      console.error('Error fetching bridges summary:', error)
      throw error
    }
  }

  async getBridgeById(bridgeId: string): Promise<BridgeData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/bridge/${bridgeId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch bridge ${bridgeId}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      return {
        id: data.id,
        name: data.displayName || data.name,
        volume24h: data.lastDayVolume || 0,
        volume7d: data.lastWeekVolume || 0,
        volume30d: data.lastMonthVolume || 0,
        txs24h: data.lastDayTxs || 0,
        txs7d: data.lastWeekTxs || 0,
        txs30d: data.lastMonthTxs || 0,
        chains: data.chains || []
      }
    } catch (error) {
      console.error(`Error fetching bridge ${bridgeId}:`, error)
      return null
    }
  }

  async getChainBridgeData(): Promise<ChainBridgeData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/bridgevolume/chains`)
      if (!response.ok) {
        throw new Error(`Failed to fetch chain bridge data: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      return Object.entries(data).map(([chainId, chainData]: [string, any]) => ({
        chainId,
        name: chainData.name || chainId,
        volume24h: chainData.lastDayVolume || 0,
        txs24h: chainData.lastDayTxs || 0,
        bridges: chainData.bridges || {}
      }))
    } catch (error) {
      console.error('Error fetching chain bridge data:', error)
      throw error
    }
  }

  async getBridgeHistoricalData(bridgeId: string, days: number = 30): Promise<BridgeHistoricalData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/bridgedaystats/${bridgeId}?starttimestamp=${Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000)}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch historical data for ${bridgeId}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      return data.map((item: any) => ({
        date: new Date(item.date * 1000).toISOString().split('T')[0],
        volume: item.depositUSD + item.withdrawUSD || 0,
        txs: item.depositTxs + item.withdrawTxs || 0,
        ...item
      }))
    } catch (error) {
      console.error(`Error fetching historical data for ${bridgeId}:`, error)
      return []
    }
  }

  // Get aggregated historical data across all bridges
  async getAggregatedHistoricalData(days: number = 30): Promise<BridgeHistoricalData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/bridgevolume?starttimestamp=${Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000)}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch aggregated historical data: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      return data.map((item: any) => ({
        date: new Date(item.date * 1000).toISOString().split('T')[0],
        volume: item.totalVolume || 0,
        txs: item.totalTxs || 0,
        ...item
      }))
    } catch (error) {
      console.error('Error fetching aggregated historical data:', error)
      return []
    }
  }

  // Helper method to find LI.FI specific data
  async getLiFiBridgeData(): Promise<BridgeData | null> {
    try {
      const summary = await this.getBridgesSummary()
      
      // Look for LI.FI related bridges
      const lifiData = summary.bridges.find(bridge => 
        bridge.name.toLowerCase().includes('li.fi') || 
        bridge.id.toLowerCase().includes('lifi') ||
        bridge.name.toLowerCase().includes('lifi')
      )
      
      return lifiData || null
    } catch (error) {
      console.error('Error fetching LI.FI bridge data:', error)
      return null
    }
  }
}

export const defiLlamaClient = new DefiLlamaClient()
