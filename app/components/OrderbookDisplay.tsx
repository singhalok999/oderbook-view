"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { OrderbookData, SimulatedOrder, Venue } from "../types/orderbook"
import { TrendingUp, TrendingDown, AlertTriangle, Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react"

interface OrderbookDisplayProps {
  venue: Venue
  symbol: string
  orderbookData: OrderbookData | null
  simulatedOrder: SimulatedOrder | null
  isConnected: boolean
}

export default function OrderbookDisplay({
  venue,
  symbol,
  orderbookData,
  simulatedOrder,
  isConnected,
}: OrderbookDisplayProps) {
  const [hoveredLevel, setHoveredLevel] = useState<{ price: number; side: "bid" | "ask" } | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<{ price: number; side: "bid" | "ask" } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  // Memoize calculations to prevent unnecessary re-renders
  const { processedAsks, processedBids, spread, midPrice, volumeWeightedPrice } = useMemo(() => {
    if (!orderbookData) {
      return { processedAsks: [], processedBids: [], spread: 0, midPrice: 0, volumeWeightedPrice: 0 }
    }

    const asks = orderbookData.asks.slice(0, 15)
    const bids = orderbookData.bids.slice(0, 15)
    const spreadValue = asks[0] && bids[0] ? asks[0].price - bids[0].price : 0
    const midPriceValue = asks[0] && bids[0] ? (asks[0].price + bids[0].price) / 2 : 0

    // Calculate volume weighted average price
    const totalBidVolume = bids.reduce((sum, bid) => sum + bid.quantity, 0)
    const totalAskVolume = asks.reduce((sum, ask) => sum + ask.quantity, 0)
    const bidVWAP = bids.reduce((sum, bid) => sum + bid.price * bid.quantity, 0) / totalBidVolume
    const askVWAP = asks.reduce((sum, ask) => sum + ask.price * ask.quantity, 0) / totalAskVolume
    const vwap = (bidVWAP + askVWAP) / 2

    return {
      processedAsks: asks,
      processedBids: bids,
      spread: spreadValue,
      midPrice: midPriceValue,
      volumeWeightedPrice: vwap || 0,
    }
  }, [orderbookData])

  // Update animation trigger
  useEffect(() => {
    if (orderbookData) {
      setLastUpdate(Date.now())
    }
  }, [orderbookData])

  const isSimulatedOrderAtLevel = (price: number, side: "buy" | "sell") => {
    if (!simulatedOrder || simulatedOrder.type === "market") return false
    return Math.abs((simulatedOrder.price || 0) - price) < 0.01 && simulatedOrder.side === side
  }

  const handleLevelClick = (price: number, side: "bid" | "ask") => {
    setSelectedLevel({ price, side })
    if (soundEnabled) {
      console.log("Click sound for level:", price, side)
    }
  }

  const handleLevelHover = (price: number, side: "bid" | "ask") => {
    setHoveredLevel({ price, side })
  }

  const getVolumeBarWidth = (quantity: number, maxQuantity: number) => {
    return Math.max((quantity / maxQuantity) * 100, 5)
  }

  const maxBidQuantity = Math.max(...processedBids.map((bid) => bid.quantity), 1)
  const maxAskQuantity = Math.max(...processedAsks.map((ask) => ask.quantity), 1)

  if (!isConnected) {
    return (
      <Card className="shadow-2xl border-0 bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-ping opacity-75" />
            </div>
            <span className="text-lg">{venue} Orderbook</span>
            <Badge variant="outline" className="ml-auto animate-bounce">
              {symbol}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              <div className="absolute inset-2 border-4 border-transparent border-t-purple-600 rounded-full animate-spin animate-reverse" />
            </div>
            <div className="mt-6 space-y-2">
              <p className="text-slate-600 dark:text-slate-400 font-medium">Connecting to {venue}...</p>
              <div className="flex items-center justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
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
        <CardTitle className="flex items-center gap-2">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />
          </div>
          <span className="text-lg">{venue} Orderbook</span>
          <Badge variant="outline" className="ml-auto hover:scale-105 transition-transform">
            {symbol}
          </Badge>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="hover:scale-110 transition-transform"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
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
        <div className={`${isFullscreen ? "h-[calc(100vh-200px)]" : "h-[600px]"} flex flex-col`}>
          {/* Interactive Header with Metrics */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50/80 to-slate-100/80 dark:from-slate-800/50 dark:to-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="group cursor-pointer hover:scale-105 transition-transform">
                <span className="text-slate-500 dark:text-slate-400 block">Mid Price</span>
                <div className="font-mono font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ${midPrice.toFixed(2)}
                </div>
              </div>
              <div className="group cursor-pointer hover:scale-105 transition-transform">
                <span className="text-slate-500 dark:text-slate-400 block">Spread</span>
                <div className="font-mono font-bold text-lg text-slate-900 dark:text-white">${spread.toFixed(2)}</div>
              </div>
              <div className="group cursor-pointer hover:scale-105 transition-transform">
                <span className="text-slate-500 dark:text-slate-400 block">VWAP</span>
                <div className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                  ${volumeWeightedPrice.toFixed(2)}
                </div>
              </div>
              <div className="group cursor-pointer hover:scale-105 transition-transform">
                <span className="text-slate-500 dark:text-slate-400 block">Last Update</span>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  {new Date(lastUpdate).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Column Headers */}
          <div className="px-6 py-3 bg-slate-100/80 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
            <div className="grid grid-cols-4 gap-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <div className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">Price</div>
              <div className="text-right hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                Size
              </div>
              <div className="text-right hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                Total
              </div>
              <div className="text-right hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                Volume
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {/* Interactive Asks Section */}
            <div className="h-1/2 overflow-y-auto scrollbar-thin">
              <div className="px-6 py-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative">
                    <TrendingUp className="w-5 h-5 text-red-500" />
                    <div className="absolute -inset-1 bg-red-500/20 rounded-full animate-pulse" />
                  </div>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">ASKS</span>
                  <Badge variant="outline" className="text-xs animate-pulse">
                    {processedAsks.length} levels
                  </Badge>
                </div>

                <div className="space-y-1">
                  {processedAsks
                    .slice()
                    .reverse()
                    .map((ask, index) => {
                      const total = processedAsks
                        .slice(0, processedAsks.length - index)
                        .reduce((sum, a) => sum + a.quantity, 0)
                      const isSimulated = isSimulatedOrderAtLevel(ask.price, "sell")
                      const isHovered = hoveredLevel?.price === ask.price && hoveredLevel?.side === "ask"
                      const isSelected = selectedLevel?.price === ask.price && selectedLevel?.side === "ask"
                      const volumeWidth = getVolumeBarWidth(ask.quantity, maxAskQuantity)

                      return (
                        <div
                          key={`ask-${ask.price}-${index}`}
                          className={`relative grid grid-cols-4 gap-4 p-3 rounded-lg text-sm transition-all duration-200 cursor-pointer group ${
                            isSimulated
                              ? "bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/20 border-2 border-yellow-400 dark:border-yellow-600 shadow-lg scale-105"
                              : isSelected
                                ? "bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 border-2 border-red-400 dark:border-red-600 shadow-lg scale-102"
                                : isHovered
                                  ? "bg-gradient-to-r from-red-50 to-red-25 dark:from-red-900/20 dark:to-red-800/10 shadow-md scale-101"
                                  : "bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/80 dark:hover:bg-red-900/20 hover:shadow-md hover:scale-101"
                          }`}
                          onMouseEnter={() => handleLevelHover(ask.price, "ask")}
                          onMouseLeave={() => setHoveredLevel(null)}
                          onClick={() => handleLevelClick(ask.price, "ask")}
                        >
                          {/* Volume Bar Background */}
                          <div
                            className="absolute inset-0 bg-gradient-to-r from-red-200/30 to-transparent rounded-lg transition-all duration-300"
                            style={{ width: `${volumeWidth}%` }}
                          />

                          <div className="relative font-mono text-red-600 dark:text-red-400 font-bold group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">
                            ${ask.price.toFixed(2)}
                          </div>
                          <div className="relative font-mono text-slate-700 dark:text-slate-300 text-right group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            {ask.quantity.toFixed(4)}
                          </div>
                          <div className="relative font-mono text-slate-500 dark:text-slate-400 text-right text-xs group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                            {total.toFixed(4)}
                          </div>
                          <div className="relative text-right">
                            <div className="w-full bg-red-200 dark:bg-red-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-500"
                                style={{ width: `${volumeWidth}%` }}
                              />
                            </div>
                          </div>

                          {/* Hover Tooltip */}
                          {isHovered && (
                            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl z-10 whitespace-nowrap">
                              Click to select • ${ask.price.toFixed(2)} × {ask.quantity.toFixed(4)}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>

            {/* Interactive Spread Indicator */}
            <div className="px-6 py-4 bg-gradient-to-r from-red-50/50 via-slate-50 to-green-50/50 dark:from-red-900/10 dark:via-slate-800/50 dark:to-green-900/10 border-y border-slate-200 dark:border-slate-700">
              <div className="text-center group cursor-pointer hover:scale-105 transition-transform">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Market Spread</div>
                <div className="font-mono font-bold text-lg bg-gradient-to-r from-red-600 via-slate-600 to-green-600 bg-clip-text text-transparent">
                  ${spread.toFixed(2)} ({((spread / midPrice) * 100).toFixed(3)}%)
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 to-green-500 rounded-full animate-pulse" />
                </div>
              </div>
            </div>

            {/* Interactive Bids Section */}
            <div className="h-1/2 overflow-y-auto scrollbar-thin">
              <div className="px-6 py-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative">
                    <TrendingDown className="w-5 h-5 text-green-500" />
                    <div className="absolute -inset-1 bg-green-500/20 rounded-full animate-pulse" />
                  </div>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">BIDS</span>
                  <Badge variant="outline" className="text-xs animate-pulse">
                    {processedBids.length} levels
                  </Badge>
                </div>

                <div className="space-y-1">
                  {processedBids.map((bid, index) => {
                    const total = processedBids.slice(0, index + 1).reduce((sum, b) => sum + b.quantity, 0)
                    const isSimulated = isSimulatedOrderAtLevel(bid.price, "buy")
                    const isHovered = hoveredLevel?.price === bid.price && hoveredLevel?.side === "bid"
                    const isSelected = selectedLevel?.price === bid.price && selectedLevel?.side === "bid"
                    const volumeWidth = getVolumeBarWidth(bid.quantity, maxBidQuantity)

                    return (
                      <div
                        key={`bid-${bid.price}-${index}`}
                        className={`relative grid grid-cols-4 gap-4 p-3 rounded-lg text-sm transition-all duration-200 cursor-pointer group ${
                          isSimulated
                            ? "bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/20 border-2 border-yellow-400 dark:border-yellow-600 shadow-lg scale-105"
                            : isSelected
                              ? "bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 border-2 border-green-400 dark:border-green-600 shadow-lg scale-102"
                              : isHovered
                                ? "bg-gradient-to-r from-green-50 to-green-25 dark:from-green-900/20 dark:to-green-800/10 shadow-md scale-101"
                                : "bg-green-50/50 dark:bg-green-900/10 hover:bg-green-100/80 dark:hover:bg-green-900/20 hover:shadow-md hover:scale-101"
                        }`}
                        onMouseEnter={() => handleLevelHover(bid.price, "bid")}
                        onMouseLeave={() => setHoveredLevel(null)}
                        onClick={() => handleLevelClick(bid.price, "bid")}
                      >
                        {/* Volume Bar Background */}
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-green-200/30 to-transparent rounded-lg transition-all duration-300"
                          style={{ width: `${volumeWidth}%` }}
                        />

                        <div className="relative font-mono text-green-600 dark:text-green-400 font-bold group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                          ${bid.price.toFixed(2)}
                        </div>
                        <div className="relative font-mono text-slate-700 dark:text-slate-300 text-right group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {bid.quantity.toFixed(4)}
                        </div>
                        <div className="relative font-mono text-slate-500 dark:text-slate-400 text-right text-xs group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                          {total.toFixed(4)}
                        </div>
                        <div className="relative text-right">
                          <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                              style={{ width: `${volumeWidth}%` }}
                            />
                          </div>
                        </div>

                        {/* Hover Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl z-10 whitespace-nowrap">
                            Click to select • ${bid.price.toFixed(2)} × {bid.quantity.toFixed(4)}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Order Impact Section */}
        {simulatedOrder && (
          <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                <div className="absolute -inset-1 bg-blue-600/20 rounded-full animate-pulse" />
              </div>
              <h4 className="font-bold text-blue-800 dark:text-blue-300">Order Impact Analysis</h4>
              <Badge variant="outline" className="animate-bounce">
                Live Analysis
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="group p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Estimated Fill</span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          simulatedOrder.estimatedFill >= 100
                            ? "bg-green-500 animate-pulse"
                            : simulatedOrder.estimatedFill >= 50
                              ? "bg-yellow-500 animate-pulse"
                              : "bg-red-500 animate-pulse"
                        }`}
                      />
                      <span
                        className={`font-mono font-bold text-lg ${
                          simulatedOrder.estimatedFill >= 100
                            ? "text-green-600"
                            : simulatedOrder.estimatedFill >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {simulatedOrder.estimatedFill.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        simulatedOrder.estimatedFill >= 100
                          ? "bg-gradient-to-r from-green-400 to-green-600"
                          : simulatedOrder.estimatedFill >= 50
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                            : "bg-gradient-to-r from-red-400 to-red-600"
                      }`}
                      style={{ width: `${simulatedOrder.estimatedFill}%` }}
                    />
                  </div>
                </div>

                <div className="group p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Market Impact</span>
                    <span className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                      {simulatedOrder.marketImpact.toFixed(4)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="group p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Slippage</span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          simulatedOrder.slippage > 0.1 ? "bg-red-500 animate-pulse" : "bg-green-500 animate-pulse"
                        }`}
                      />
                      <span
                        className={`font-mono font-bold text-lg ${
                          simulatedOrder.slippage > 0.1 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {simulatedOrder.slippage.toFixed(4)}%
                      </span>
                    </div>
                  </div>
                </div>

                {simulatedOrder.timeToFill && (
                  <div className="group p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Time to Fill</span>
                      <span className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                        {simulatedOrder.timeToFill}s
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
