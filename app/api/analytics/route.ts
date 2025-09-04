import { NextResponse } from "next/server";
import { defiLlamaClient } from "@/lib/defillama-client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "24h";

    // Fetch bridge summary data
    const bridgesSummary = await defiLlamaClient.getBridgesSummary();

    // Fetch chain-specific data
    const chainData = await defiLlamaClient.getChainBridgeData();

    // Get historical data based on timeframe
    const days = timeframe === "24h" ? 1 : timeframe === "7d" ? 7 : 30;
    const historicalData = await defiLlamaClient.getAggregatedHistoricalData(
      days
    );

    // Try to get LI.FI specific data
    const lifiData = await defiLlamaClient.getLiFiBridgeData();

    // Transform data for the frontend
    const analytics = {
      summary: {
        totalVolume24h: bridgesSummary.totalVolume24h,
        totalTxs24h: bridgesSummary.totalTxs24h,
        totalBridges: bridgesSummary.bridges.length,
        lifiVolume24h: lifiData?.volume24h || 0,
        lifiTxs24h: lifiData?.txs24h || 0,
      },
      bridges: bridgesSummary.bridges
        .sort((a, b) => b.volume24h - a.volume24h)
        .slice(0, 20) // Top 20 bridges
        .map((bridge) => ({
          id: bridge.id,
          name: bridge.name,
          volume24h: bridge.volume24h,
          volume7d: bridge.volume7d,
          volume30d: bridge.volume30d,
          txs24h: bridge.txs24h,
          txs7d: bridge.txs7d,
          txs30d: bridge.txs30d,
          chains: bridge.chains,
          marketShare:
            bridgesSummary.totalVolume24h > 0
              ? (bridge.volume24h / bridgesSummary.totalVolume24h) * 100
              : 0,
        })),
      chains: chainData
        .sort((a, b) => b.volume24h - a.volume24h)
        .slice(0, 15) // Top 15 chains
        .map((chain) => ({
          chainId: chain.chainId,
          name: chain.name,
          volume24h: chain.volume24h,
          txs24h: chain.txs24h,
          bridgeCount: Object.keys(chain.bridges).length,
          marketShare:
            bridgesSummary.totalVolume24h > 0
              ? (chain.volume24h / bridgesSummary.totalVolume24h) * 100
              : 0,
        })),
      historical: historicalData.slice(-30).map((item, index) => ({
        date: item.date,
        volume: item.volume,
        txs: item.txs,
        index: index + 1,
      })),
      timeframe,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching bridge analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch bridge analytics data" },
      { status: 500 }
    );
  }
}

export const revalidate = 300; // Cache for 5 minutes
