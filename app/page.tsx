"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import OrderbookDisplay from "./components/OrderbookDisplay"
import OrderSimulationForm from "./components/OrderSimulationForm"
import MarketDepthChart from "./components/MarketDepthChart"
import { useOrderbookData } from "./hooks/useOrderbookData"
import type { Venue, SimulatedOrder } from "./types/orderbook"
import { Activity, Wifi, WifiOff, TrendingUp } from "lucide-react"

const VENUES: Venue[] = ["OKX", "Bybit", "Deribit"]

export default function OrderbookViewer() {
  const [selectedVenue, setSelectedVenue] = useState<Venue>("OKX")
  const [selectedSymbol, setSelectedSymbol] = useState("BTC-USDT")
  const [simulatedOrder, setSimulatedOrder] = useState<SimulatedOrder | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false)

  const { orderbookData, isConnected, error, reconnect } = useOrderbookData(selectedVenue, selectedSymbol)

  const handleOrderSimulation = (order: SimulatedOrder) => {
    setSimulatedOrder(order)
  }

  const clearSimulation = () => {
    setSimulatedOrder(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Interactive Header */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Orderbook Viewer
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Real-time market analysis</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105"
              >
                <span className="text-sm font-medium">Advanced Metrics</span>
              </button>

              <div className="relative">
                <Badge
                  variant={isConnected ? "default" : "destructive"}
                  className={`flex items-center gap-2 transition-all duration-300 hover:scale-105 cursor-pointer ${
                    isConnected ? "animate-pulse" : ""
                  }`}
                  onClick={() => !isConnected && reconnect()}
                >
                  {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isConnected ? "Live" : "Disconnected"}
                </Badge>
                {isConnected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Venue Selection */}
        <Card className="mb-6 shadow-xl border-0 bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl hover:shadow-2xl transition-all duration-500">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className="relative">
                <Activity className="w-5 h-5 text-blue-600" />
                <div className="absolute -inset-1 bg-blue-600/20 rounded-full animate-ping" />
              </div>
              Exchange Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedVenue} onValueChange={(value) => setSelectedVenue(value as Venue)}>
              <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                {VENUES.map((venue) => (
                  <TabsTrigger
                    key={venue}
                    value={venue}
                    className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-300 rounded-lg font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${venue === selectedVenue ? "bg-green-500 animate-pulse" : "bg-slate-400"}`}
                      />
                      {venue}
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Grid - Fixed Heights */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Order Simulation Form */}
          <div className="xl:col-span-4">
            <div className="sticky top-32">
              <OrderSimulationForm
                venue={selectedVenue}
                symbol={selectedSymbol}
                onSymbolChange={setSelectedSymbol}
                onOrderSimulation={handleOrderSimulation}
                onClearSimulation={clearSimulation}
                orderbookData={orderbookData}
              />
            </div>
          </div>

          {/* Orderbook Display */}
          <div className="xl:col-span-4">
            <div className="sticky top-32">
              <OrderbookDisplay
                venue={selectedVenue}
                symbol={selectedSymbol}
                orderbookData={orderbookData}
                simulatedOrder={simulatedOrder}
                isConnected={isConnected}
              />
            </div>
          </div>

          {/* Market Depth Chart */}
          <div className="xl:col-span-4">
            <div className="sticky top-32">
              <MarketDepthChart orderbookData={orderbookData} simulatedOrder={simulatedOrder} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
