"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { OrderbookData, SimulatedOrder } from "../types/orderbook"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
} from "recharts"
import { BarChart3, TrendingUp, TrendingDown, Maximize2, Minimize2, RefreshCw, Settings } from "lucide-react"

interface InteractiveMarketDepthChartProps {
  orderbookData: OrderbookData | null
  simulatedOrder: SimulatedOrder | null
}

export default function InteractiveMarketDepthChart({
  orderbookData,
  simulatedOrder,
}: InteractiveMarketDepthChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showBrush, setShowBrush] = useState(false)
  const [animationEnabled, setAnimationEnabled] = useState(true)
  const [hoveredPoint, setHoveredPoint] = useState<any>(null)
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null)

  // Memoize chart data to prevent unnecessary recalculations
  const { depthData, bidVolume, askVolume, imbalance, maxDepth } = useMemo(() => {
    if (!orderbookData) {
      return { depthData: [], bidVolume: 0, askVolume: 0, imbalance: 0.5, maxDepth: 0 }
    }

    const chartData = []

    // Process bids (buy side) - cumulative from highest to lowest price
    let cumulativeBidQuantity = 0
    const sortedBids = [...orderbookData.bids].sort((a, b) => b.price - a.price)

    for (const bid of sortedBids) {
      cumulativeBidQuantity += bid.quantity
      chartData.push({
        price: bid.price,
        bidDepth: cumulativeBidQuantity,
        askDepth: 0,
        side: "bid",
        quantity: bid.quantity,
      })
    }

    // Process asks (sell side) - cumulative from lowest to highest price
    let cumulativeAskQuantity = 0
    const sortedAsks = [...orderbookData.asks].sort((a, b) => a.price - b.price)

    for (const ask of sortedAsks) {
      cumulativeAskQuantity += ask.quantity
      chartData.push({
        price: ask.price,
        bidDepth: 0,
        askDepth: cumulativeAskQuantity,
        side: "ask",
        quantity: ask.quantity,
      })
    }

    // Sort all data by price for proper chart rendering
    chartData.sort((a, b) => a.price - b.price)

    const totalBidVol = orderbookData.bids.reduce((sum, bid) => sum + bid.quantity, 0)
    const totalAskVol = orderbookData.asks.reduce((sum, ask) => sum + ask.quantity, 0)
    const imbalanceRatio = totalBidVol / (totalBidVol + totalAskVol)
    const maxDepthValue = Math.max(cumulativeBidQuantity, cumulativeAskQuantity)

    return {
      depthData: chartData,
      bidVolume: totalBidVol,
      askVolume: totalAskVol,
      imbalance: imbalanceRatio,
      maxDepth: maxDepthValue,
    }
  }, [orderbookData])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xl">
          <div className="font-mono font-bold text-lg mb-2">${Number(label).toFixed(2)}</div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm font-medium">{entry.name}:</span>
              <span className="font-mono text-sm">{Number(entry.value).toFixed(4)}</span>
            </div>
          ))}
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 border-t pt-2">
            Side: {data.side} • Quantity: {data.quantity?.toFixed(4)}
          </div>
        </div>
      )
    }
    return null
  }

  if (!orderbookData) {
    return (
      <Card className="shadow-2xl border-0 bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <div className="relative">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <div className="absolute -inset-1 bg-blue-600/20 rounded-full animate-pulse" />
            </div>
            Market Depth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <div className="text-center">
              <div className="relative mb-6">
                <BarChart3 className="w-16 h-16 mx-auto opacity-50" />
                <div className="absolute inset-0 animate-ping">
                  <BarChart3 className="w-16 h-16 mx-auto opacity-25" />
                </div>
              </div>
              <p className="font-medium">No market data available</p>
              <p className="text-sm mt-2">Connect to an exchange to view depth chart</p>
              <div className="flex items-center justify-center gap-1 mt-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={`shadow-2xl border-0 bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl transition-all duration-500 hover:shadow-3xl ${isFullscreen ? "fixed inset-4 z-50" : ""}`}
    >
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <div className="absolute -inset-1 bg-blue-600/20 rounded-full animate-pulse" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
              Market Depth
            </span>
          </div>
          <div className="flex items-center gap-2">
            {simulatedOrder && (
              <Badge variant="outline" className="text-xs animate-bounce">
                {simulatedOrder.side} {simulatedOrder.quantity} @ {simulatedOrder.price || "Market"}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBrush(!showBrush)}
              className="hover:scale-110 transition-transform"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAnimationEnabled(!animationEnabled)}
              className="hover:scale-110 transition-transform"
            >
              <RefreshCw className={`w-4 h-4 ${animationEnabled ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hover:scale-110 transition-transform"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* Interactive Chart */}
        <div className={`${isFullscreen ? "h-[calc(100vh-300px)]" : "h-96"} p-4`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={depthData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              onMouseMove={(e) => setHoveredPoint(e)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="bidGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="askGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis
                dataKey="price"
                type="number"
                scale="linear"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
                stroke="#64748b"
                fontSize={12}
                tick={{ fill: "#64748b" }}
              />
              <YAxis
                tickFormatter={(value) => Number(value).toFixed(2)}
                stroke="#64748b"
                fontSize={12}
                tick={{ fill: "#64748b" }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Bid depth area (green) */}
              <Area
                type="stepAfter"
                dataKey="bidDepth"
                stroke="#10b981"
                fill="url(#bidGradient)"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: "#10b981",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                  filter: "drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))",
                }}
                isAnimationActive={animationEnabled}
                animationDuration={1000}
              />

              {/* Ask depth area (red) */}
              <Area
                type="stepBefore"
                dataKey="askDepth"
                stroke="#ef4444"
                fill="url(#askGradient)"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: "#ef4444",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                  filter: "drop-shadow(0 0 6px rgba(239, 68, 68, 0.6))",
                }}
                isAnimationActive={animationEnabled}
                animationDuration={1000}
              />

              {/* Reference line for simulated order price */}
              {simulatedOrder && simulatedOrder.price && (
                <ReferenceLine
                  x={simulatedOrder.price}
                  stroke="#f59e0b"
                  strokeWidth={3}
                  strokeDasharray="8 4"
                  label={{
                    value: `Order: $${simulatedOrder.price.toFixed(2)}`,
                    position: "top",
                    style: {
                      fill: "#f59e0b",
                      fontWeight: "bold",
                      fontSize: "14px",
                      filter: "drop-shadow(0 0 4px rgba(245, 158, 11, 0.8))",
                    },
                  }}
                />
              )}

              {/* Interactive brush for zooming */}
              {showBrush && <Brush dataKey="price" height={30} stroke="#8884d8" fill="rgba(136, 132, 216, 0.1)" />}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Interactive Market Metrics */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-gradient-to-r from-slate-50/80 to-slate-100/80 dark:from-slate-800/50 dark:to-slate-700/50">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="group cursor-pointer hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl shadow-lg hover:shadow-xl">
                <div className="relative">
                  <TrendingDown className="w-8 h-8 text-green-600" />
                  <div className="absolute -inset-1 bg-green-600/20 rounded-full animate-pulse" />
                </div>
                <div>
                  <div className="text-sm font-bold text-green-700 dark:text-green-400">Total Bid Volume</div>
                  <div className="text-2xl font-mono font-bold text-green-600">{bidVolume.toFixed(2)}</div>
                  <div className="text-xs text-green-600/70">
                    {((bidVolume / (bidVolume + askVolume)) * 100).toFixed(1)}% of total
                  </div>
                </div>
              </div>
            </div>

            <div className="group cursor-pointer hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl shadow-lg hover:shadow-xl">
                <div className="relative">
                  <TrendingUp className="w-8 h-8 text-red-600" />
                  <div className="absolute -inset-1 bg-red-600/20 rounded-full animate-pulse" />
                </div>
                <div>
                  <div className="text-sm font-bold text-red-700 dark:text-red-400">Total Ask Volume</div>
                  <div className="text-2xl font-mono font-bold text-red-600">{askVolume.toFixed(2)}</div>
                  <div className="text-xs text-red-600/70">
                    {((askVolume / (bidVolume + askVolume)) * 100).toFixed(1)}% of total
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Order Book Imbalance */}
          <div className="group cursor-pointer hover:scale-102 transition-all duration-300">
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="font-bold text-slate-700 dark:text-slate-300">Order Book Imbalance</span>
              <div className="flex items-center gap-2">
                <Badge
                  variant={imbalance > 0.6 ? "default" : imbalance < 0.4 ? "destructive" : "secondary"}
                  className="text-xs animate-pulse"
                >
                  {(imbalance * 100).toFixed(1)}% Bid Weighted
                </Badge>
                <div
                  className={`w-3 h-3 rounded-full ${
                    imbalance > 0.6 ? "bg-green-500" : imbalance < 0.4 ? "bg-red-500" : "bg-yellow-500"
                  } animate-pulse`}
                />
              </div>
            </div>

            <div className="relative w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  imbalance > 0.6
                    ? "bg-gradient-to-r from-green-400 to-green-600"
                    : imbalance < 0.4
                      ? "bg-gradient-to-r from-red-400 to-red-600"
                      : "bg-gradient-to-r from-yellow-400 to-yellow-600"
                }`}
                style={{ width: `${imbalance * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-0.5 h-full bg-slate-500 dark:bg-slate-400 opacity-50" />
              </div>

              {/* Animated indicator */}
              <div
                className="absolute top-0 h-full w-1 bg-white shadow-lg transition-all duration-1000"
                style={{ left: `${imbalance * 100}%`, transform: "translateX(-50%)" }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                More Sellers
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full" />
                Balanced
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                More Buyers
              </span>
            </div>
          </div>

          {/* Additional Interactive Metrics */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="group p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Max Depth</div>
              <div className="font-mono font-bold text-slate-900 dark:text-white">{maxDepth.toFixed(2)}</div>
            </div>
            <div className="group p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Levels</div>
              <div className="font-mono font-bold text-slate-900 dark:text-white">{depthData.length}</div>
            </div>
            <div className="group p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ratio</div>
              <div className="font-mono font-bold text-slate-900 dark:text-white">
                {(bidVolume / askVolume).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
