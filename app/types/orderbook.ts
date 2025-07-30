export type Venue = "OKX" | "Bybit" | "Deribit"

export interface OrderbookLevel {
  price: number
  quantity: number
  total?: number
}

export interface OrderbookData {
  bids: OrderbookLevel[]
  asks: OrderbookLevel[]
  timestamp: number
  symbol: string
  venue: Venue
}

export interface SimulatedOrder {
  venue: Venue
  symbol: string
  side: "buy" | "sell"
  type: "market" | "limit"
  price?: number
  quantity: number
  timing: "immediate" | "5s" | "10s" | "30s"
  estimatedFill: number
  marketImpact: number
  slippage: number
  timeToFill?: number
}

export interface MarketImpactMetrics {
  estimatedFill: number
  marketImpact: number
  slippage: number
  averagePrice: number
  worstPrice: number
}
