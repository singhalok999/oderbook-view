"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { OrderbookData, Venue } from "../types/orderbook"

export function useOrderbookData(venue: Venue, symbol: string) {
  const [orderbookData, setOrderbookData] = useState<OrderbookData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const getWebSocketUrl = useCallback((venue: Venue, symbol: string) => {
    switch (venue) {
      case "OKX":
        return "wss://ws.okx.com:8443/ws/v5/public"
      case "Bybit":
        return "wss://stream.bybit.com/v5/public/linear"
      case "Deribit":
        return "wss://www.deribit.com/ws/api/v2"
      default:
        return ""
    }
  }, [])

  const getSubscriptionMessage = useCallback((venue: Venue, symbol: string) => {
    const normalizedSymbol = symbol.replace("-", "").toLowerCase()

    switch (venue) {
      case "OKX":
        return {
          op: "subscribe",
          args: [
            {
              channel: "books",
              instId: symbol,
            },
          ],
        }
      case "Bybit":
        return {
          op: "subscribe",
          args: [`orderbook.50.${symbol}`],
        }
      case "Deribit":
        return {
          jsonrpc: "2.0",
          method: "public/subscribe",
          id: 1,
          params: {
            channels: [`book.${symbol}.100ms`],
          },
        }
      default:
        return {}
    }
  }, [])

  const parseOrderbookData = useCallback((venue: Venue, data: any): OrderbookData | null => {
    try {
      switch (venue) {
        case "OKX":
          if (data.data && data.data[0]) {
            const book = data.data[0]
            return {
              bids: book.bids
                .map(([price, quantity]: [string, string]) => ({
                  price: Number.parseFloat(price),
                  quantity: Number.parseFloat(quantity),
                }))
                .slice(0, 15),
              asks: book.asks
                .map(([price, quantity]: [string, string]) => ({
                  price: Number.parseFloat(price),
                  quantity: Number.parseFloat(quantity),
                }))
                .slice(0, 15),
              timestamp: Number.parseInt(book.ts),
              symbol: book.instId,
              venue: "OKX",
            }
          }
          break
        case "Bybit":
          if (data.data) {
            return {
              bids: data.data.b
                .map(([price, quantity]: [string, string]) => ({
                  price: Number.parseFloat(price),
                  quantity: Number.parseFloat(quantity),
                }))
                .slice(0, 15),
              asks: data.data.a
                .map(([price, quantity]: [string, string]) => ({
                  price: Number.parseFloat(price),
                  quantity: Number.parseFloat(quantity),
                }))
                .slice(0, 15),
              timestamp: data.ts,
              symbol: data.data.s,
              venue: "Bybit",
            }
          }
          break
        case "Deribit":
          if (data.params && data.params.data) {
            const book = data.params.data
            return {
              bids: book.bids
                .map(([price, quantity]: [number, number]) => ({
                  price,
                  quantity,
                }))
                .slice(0, 15),
              asks: book.asks
                .map(([price, quantity]: [number, number]) => ({
                  price,
                  quantity,
                }))
                .slice(0, 15),
              timestamp: book.timestamp,
              symbol: book.instrument_name,
              venue: "Deribit",
            }
          }
          break
      }
      return null
    } catch (err) {
      console.error("Error parsing orderbook data:", err)
      return null
    }
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close()
    }

    const wsUrl = getWebSocketUrl(venue, symbol)
    if (!wsUrl) {
      setError(`WebSocket URL not available for ${venue}`)
      return
    }

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log(`Connected to ${venue} WebSocket`)
        setIsConnected(true)
        setError(null)

        const subscriptionMessage = getSubscriptionMessage(venue, symbol)
        ws.send(JSON.stringify(subscriptionMessage))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const parsedData = parseOrderbookData(venue, data)
          if (parsedData) {
            setOrderbookData(parsedData)
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err)
        }
      }

      ws.onerror = (error) => {
        console.error(`${venue} WebSocket error:`, error)
        setError(`WebSocket connection error for ${venue}`)
        setIsConnected(false)
      }

      ws.onclose = () => {
        console.log(`${venue} WebSocket connection closed`)
        setIsConnected(false)

        // Auto-reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 5000)
      }
    } catch (err) {
      setError(`Failed to connect to ${venue}: ${err}`)
      setIsConnected(false)
    }
  }, [venue, symbol, getWebSocketUrl, getSubscriptionMessage, parseOrderbookData])

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    connect()
  }, [connect])

  useEffect(() => {
    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])

  return {
    orderbookData,
    isConnected,
    error,
    reconnect,
  }
}
