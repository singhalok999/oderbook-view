"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import type { OrderbookData, SimulatedOrder, Venue, MarketImpactMetrics } from "../types/orderbook"
import {
  Calculator,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
} from "lucide-react"

interface InteractiveOrderSimulationFormProps {
  venue: Venue
  symbol: string
  onSymbolChange: (symbol: string) => void
  onOrderSimulation: (order: SimulatedOrder) => void
  onClearSimulation: () => void
  orderbookData: OrderbookData | null
}

const SYMBOLS = [
  { value: "BTC-USDT", label: "Bitcoin", icon: "₿" },
  { value: "ETH-USDT", label: "Ethereum", icon: "Ξ" },
  { value: "BTC-USD", label: "Bitcoin USD", icon: "₿" },
  { value: "ETH-USD", label: "Ethereum USD", icon: "Ξ" },
  { value: "SOL-USDT", label: "Solana", icon: "◎" },
  { value: "ADA-USDT", label: "Cardano", icon: "₳" },
  { value: "DOT-USDT", label: "Polkadot", icon: "●" },
  { value: "LINK-USDT", label: "Chainlink", icon: "⬢" },
  { value: "AVAX-USDT", label: "Avalanche", icon: "▲" },
  { value: "MATIC-USDT", label: "Polygon", icon: "⬟" },
  { value: "UNI-USDT", label: "Uniswap", icon: "🦄" },
  { value: "ATOM-USDT", label: "Cosmos", icon: "⚛" },
]

const TIMING_OPTIONS = [
  { value: "immediate", label: "Immediate", icon: "⚡", color: "text-red-600" },
  { value: "5s", label: "5 seconds", icon: "⏱️", color: "text-orange-600" },
  { value: "10s", label: "10 seconds", icon: "⏲️", color: "text-yellow-600" },
  { value: "30s", label: "30 seconds", icon: "⏰", color: "text-green-600" },
]

export default function InteractiveOrderSimulationForm({
  venue,
  symbol,
  onSymbolChange,
  onOrderSimulation,
  onClearSimulation,
  orderbookData,
}: InteractiveOrderSimulationFormProps) {
  const [orderType, setOrderType] = useState<"market" | "limit">("limit")
  const [side, setSide] = useState<"buy" | "sell">("buy")
  const [price, setPrice] = useState("")
  const [quantity, setQuantity] = useState("")
  const [timing, setTiming] = useState<"immediate" | "5s" | "10s" | "30s">("immediate")
  const [sliderQuantity, setSliderQuantity] = useState([0])
  const [isAnimating, setIsAnimating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Auto-update price when switching sides
  useEffect(() => {
    if (orderType === "limit" && orderbookData) {
      const bestPrice = getBestPrice()
      if (bestPrice) {
        setPrice(bestPrice)
      }
    }
  }, [side, orderbookData, orderType])

  const calculateMarketImpact = (): MarketImpactMetrics => {
    if (!orderbookData || !quantity) {
      return {
        estimatedFill: 0,
        marketImpact: 0,
        slippage: 0,
        averagePrice: 0,
        worstPrice: 0,
      }
    }

    const orderQuantity = Number.parseFloat(quantity)
    const levels = side === "buy" ? orderbookData.asks : orderbookData.bids

    let remainingQuantity = orderQuantity
    let totalCost = 0
    let totalQuantityFilled = 0
    let worstPrice = 0

    for (const level of levels) {
      if (remainingQuantity <= 0) break

      const quantityAtLevel = Math.min(remainingQuantity, level.quantity)
      totalCost += quantityAtLevel * level.price
      totalQuantityFilled += quantityAtLevel
      remainingQuantity -= quantityAtLevel
      worstPrice = level.price
    }

    const estimatedFill = (totalQuantityFilled / orderQuantity) * 100
    const averagePrice = totalQuantityFilled > 0 ? totalCost / totalQuantityFilled : 0
    const bestPrice = levels[0]?.price || 0
    const slippage = bestPrice > 0 ? Math.abs((averagePrice - bestPrice) / bestPrice) * 100 : 0
    const marketImpact =
      levels.length > 0 ? (totalQuantityFilled / levels.reduce((sum, level) => sum + level.quantity, 0)) * 100 : 0

    return {
      estimatedFill,
      marketImpact,
      slippage,
      averagePrice,
      worstPrice,
    }
  }

  const handleSimulate = () => {
    if (!quantity || (orderType === "limit" && !price)) return

    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 1000)

    const metrics = calculateMarketImpact()
    const timingMap = { immediate: 0, "5s": 5, "10s": 10, "30s": 30 }

    const simulatedOrder: SimulatedOrder = {
      venue,
      symbol,
      side,
      type: orderType,
      price: orderType === "limit" ? Number.parseFloat(price) : undefined,
      quantity: Number.parseFloat(quantity),
      timing,
      estimatedFill: metrics.estimatedFill,
      marketImpact: metrics.marketImpact,
      slippage: metrics.slippage,
      timeToFill: timingMap[timing],
    }

    onOrderSimulation(simulatedOrder)
  }

  const getBestPrice = () => {
    if (!orderbookData) return ""
    const levels = side === "buy" ? orderbookData.asks : orderbookData.bids
    return levels[0]?.price.toString() || ""
  }

  const getMaxQuantity = () => {
    if (!orderbookData) return 100
    const levels = side === "buy" ? orderbookData.asks : orderbookData.bids
    return levels.reduce((sum, level) => sum + level.quantity, 0)
  }

  const handleSliderChange = (value: number[]) => {
    setSliderQuantity(value)
    setQuantity(((value[0] / 100) * getMaxQuantity()).toFixed(4))
  }

  const isFormValid = quantity && (orderType === "market" || price)
  const metrics = calculateMarketImpact()

  return (
    <Card className="shadow-2xl border-0 bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl hover:shadow-3xl transition-all duration-500">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <div className="relative">
            <Calculator className="w-5 h-5 text-blue-600" />
            <div className="absolute -inset-1 bg-blue-600/20 rounded-full animate-pulse" />
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
            Order Simulation
          </span>
          <Badge variant="outline" className="ml-auto animate-bounce">
            {venue}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Interactive Symbol Selection */}
        <div className="space-y-3">
          <Label htmlFor="symbol" className="text-sm font-bold flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Trading Pair
          </Label>
          <Select value={symbol} onValueChange={onSymbolChange}>
            <SelectTrigger className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl">
              {SYMBOLS.map((sym) => (
                <SelectItem key={sym.value} value={sym.value}>
                  <div className="flex items-center gap-3 py-1">
                    <span className="text-lg">{sym.icon}</span>
                    <div>
                      <div className="font-mono font-bold">{sym.value}</div>
                      <div className="text-xs text-slate-500">{sym.label}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Interactive Order Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label htmlFor="orderType" className="text-sm font-bold">
              Order Type
            </Label>
            <Select value={orderType} onValueChange={(value: "market" | "limit") => setOrderType(value)}>
              <SelectTrigger className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:scale-105 transition-all duration-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">
                  <div className="flex items-center gap-3 py-1">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <div>
                      <div className="font-medium">Market</div>
                      <div className="text-xs text-slate-500">Instant execution</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="limit">
                  <div className="flex items-center gap-3 py-1">
                    <Calculator className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="font-medium">Limit</div>
                      <div className="text-xs text-slate-500">Set your price</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="side" className="text-sm font-bold">
              Side
            </Label>
            <Select value={side} onValueChange={(value: "buy" | "sell") => setSide(value)}>
              <SelectTrigger className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:scale-105 transition-all duration-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">
                  <div className="flex items-center gap-3 py-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="font-medium text-green-600">Buy</div>
                      <div className="text-xs text-slate-500">Long position</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="sell">
                  <div className="flex items-center gap-3 py-1">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <div>
                      <div className="font-medium text-red-600">Sell</div>
                      <div className="text-xs text-slate-500">Short position</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Interactive Price Input */}
        {orderType === "limit" && (
          <div className="space-y-3">
            <Label htmlFor="price" className="text-sm font-bold flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Price (USD)
            </Label>
            <div className="flex gap-3">
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 focus:scale-105"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPrice(getBestPrice())}
                className="whitespace-nowrap hover:scale-110 transition-all duration-200 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
              >
                <Zap className="w-4 h-4 mr-1" />
                Best Price
              </Button>
            </div>
          </div>
        )}

        {/* Interactive Quantity Input with Slider */}
        <div className="space-y-4">
          <Label htmlFor="quantity" className="text-sm font-bold flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Quantity
          </Label>
          <Input
            id="quantity"
            type="number"
            step="0.0001"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value)
              const maxQty = getMaxQuantity()
              setSliderQuantity([(Number.parseFloat(e.target.value) / maxQty) * 100])
            }}
            placeholder="Enter quantity"
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 focus:scale-105"
          />

          {/* Quantity Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>0</span>
              <span>Max Available: {getMaxQuantity().toFixed(2)}</span>
            </div>
            <Slider value={sliderQuantity} onValueChange={handleSliderChange} max={100} step={1} className="w-full" />
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">25%</span>
              <span className="text-slate-500">50%</span>
              <span className="text-slate-500">75%</span>
              <span className="text-slate-500">100%</span>
            </div>
          </div>
        </div>

        {/* Interactive Timing Selection */}
        <div className="space-y-3">
          <Label htmlFor="timing" className="text-sm font-bold flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Execution Timing
          </Label>
          <Select value={timing} onValueChange={(value: any) => setTiming(value)}>
            <SelectTrigger className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:scale-105 transition-all duration-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMING_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-3 py-1">
                    <span className="text-lg">{option.icon}</span>
                    <div>
                      <div className={`font-medium ${option.color}`}>{option.label}</div>
                      <div className="text-xs text-slate-500">
                        {option.value === "immediate" ? "Execute now" : `Wait ${option.label.split(" ")[0]}`}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Interactive Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSimulate}
            disabled={!isFormValid || isAnimating}
            className={`flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 ${isAnimating ? "animate-pulse" : ""}`}
          >
            {isAnimating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Simulating...
              </div>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Simulate Order
              </>
            )}
          </Button>
          <Button
            onClick={onClearSimulation}
            variant="outline"
            className="px-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:scale-110 transition-all duration-200"
          >
            Clear
          </Button>
        </div>

        {/* Advanced Options Toggle */}
        <Button
          variant="ghost"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-sm hover:scale-105 transition-all duration-200"
        >
          {showAdvanced ? "Hide" : "Show"} Advanced Metrics
        </Button>

        {/* Real-time Impact Preview */}
        {quantity && orderbookData && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <div className="absolute -inset-1 bg-blue-600/20 rounded-full animate-pulse" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white">Live Impact Preview</h4>
              <Badge variant="outline" className="animate-bounce text-xs">
                Real-time
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="group p-4 bg-gradient-to-br from-white/60 to-slate-50/60 dark:from-slate-800/60 dark:to-slate-700/60 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Fill Rate</span>
                    <div className="flex items-center gap-2">
                      {metrics.estimatedFill >= 100 ? (
                        <CheckCircle className="w-4 h-4 text-green-500 animate-pulse" />
                      ) : metrics.estimatedFill >= 50 ? (
                        <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 animate-pulse" />
                      )}
                      <span
                        className={`font-mono font-bold text-lg ${
                          metrics.estimatedFill >= 100
                            ? "text-green-600"
                            : metrics.estimatedFill >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {metrics.estimatedFill.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        metrics.estimatedFill >= 100
                          ? "bg-gradient-to-r from-green-400 to-green-600"
                          : metrics.estimatedFill >= 50
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                            : "bg-gradient-to-r from-red-400 to-red-600"
                      }`}
                      style={{ width: `${Math.min(metrics.estimatedFill, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="group p-4 bg-gradient-to-br from-white/60 to-slate-50/60 dark:from-slate-800/60 dark:to-slate-700/60 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer backdrop-blur-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Market Impact</span>
                    <span className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                      {metrics.marketImpact.toFixed(4)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="group p-4 bg-gradient-to-br from-white/60 to-slate-50/60 dark:from-slate-800/60 dark:to-slate-700/60 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Slippage</span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          metrics.slippage > 0.1 ? "bg-red-500 animate-pulse" : "bg-green-500 animate-pulse"
                        }`}
                      />
                      <span
                        className={`font-mono font-bold text-lg ${
                          metrics.slippage > 0.1 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {metrics.slippage.toFixed(4)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="group p-4 bg-gradient-to-br from-white/60 to-slate-50/60 dark:from-slate-800/60 dark:to-slate-700/60 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer backdrop-blur-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Avg Price</span>
                    <span className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                      ${metrics.averagePrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Metrics */}
            {showAdvanced && (
              <div className="mt-6 p-4 bg-gradient-to-r from-slate-50/80 to-slate-100/80 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl backdrop-blur-sm">
                <h5 className="font-bold text-slate-900 dark:text-white mb-3">Advanced Metrics</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Worst Price:</span>
                    <span className="font-mono text-slate-900 dark:text-white">${metrics.worstPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Price Impact:</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {(
                        (Math.abs(
                          metrics.averagePrice - (orderbookData?.asks[0]?.price || orderbookData?.bids[0]?.price || 0),
                        ) /
                          (orderbookData?.asks[0]?.price || orderbookData?.bids[0]?.price || 1)) *
                        100
                      ).toFixed(3)}
                      %
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Warning for high impact orders */}
            {(metrics.slippage > 0.5 || metrics.estimatedFill < 50) && (
              <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 animate-pulse" />
                  <div>
                    <span className="text-sm font-bold text-yellow-800 dark:text-yellow-300">High Impact Warning</span>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                      This order may cause significant market impact or partial fills. Consider reducing size or using
                      limit orders.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
