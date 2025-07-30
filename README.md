# Real-Time Orderbook Viewer

A comprehensive Next.js application for viewing real-time orderbooks from multiple cryptocurrency exchanges (OKX, Bybit, Deribit) with advanced order simulation capabilities.

## Features

### Core Functionality
- **Multi-Venue Support**: Real-time orderbook data from OKX, Bybit, and Deribit
- **WebSocket Connections**: Live data streaming with automatic reconnection
- **Order Simulation**: Simulate market and limit orders with impact analysis
- **Market Depth Visualization**: Interactive charts showing order book depth
- **Responsive Design**: Optimized for desktop and mobile trading

### Advanced Features
- **Market Impact Analysis**: Calculate slippage, fill rates, and market impact
- **Order Book Imbalance Indicators**: Visual representation of bid/ask imbalances
- **Timing Simulation**: Test different order timing scenarios
- **Real-time Updates**: Live orderbook updates with visual indicators
- **Error Handling**: Robust error handling with automatic reconnection

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd orderbook-viewer
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Integration

### Supported Exchanges

#### OKX
- **WebSocket**: `wss://ws.okx.com:8443/ws/v5/public`
- **Documentation**: https://www.okx.com/docs-v5/
- **Rate Limits**: 20 requests per 2 seconds per IP

#### Bybit
- **WebSocket**: `wss://stream.bybit.com/v5/public/linear`
- **Documentation**: https://bybit-exchange.github.io/docs/v5/intro
- **Rate Limits**: 10 requests per second per IP

#### Deribit
- **WebSocket**: `wss://www.deribit.com/ws/api/v2`
- **Documentation**: https://docs.deribit.com/
- **Rate Limits**: 20 requests per second per connection

### WebSocket Subscriptions

The application automatically subscribes to orderbook channels for each exchange:

- **OKX**: `books` channel with 15 levels
- **Bybit**: `orderbook.50` channel 
- **Deribit**: `book` channel with 100ms updates

## Architecture

### Project Structure
\`\`\`
src/
├── app/
│   ├── components/          # React components
│   │   ├── OrderbookDisplay.tsx
│   │   ├── OrderSimulationForm.tsx
│   │   └── MarketDepthChart.tsx
│   ├── hooks/              # Custom React hooks
│   │   └── useOrderbookData.ts
│   ├── types/              # TypeScript type definitions
│   │   └── orderbook.ts
│   ├── page.tsx            # Main application page
│   └── layout.tsx          # Root layout
\`\`\`

### Key Components

#### OrderbookDisplay
- Displays real-time bid/ask levels
- Highlights simulated order positions
- Shows market impact metrics
- Responsive design with color-coded levels

#### OrderSimulationForm
- Order entry form with validation
- Real-time impact calculations
- Support for market and limit orders
- Timing simulation controls

#### MarketDepthChart
- Visual representation of order book depth
- Cumulative volume charts
- Order book imbalance indicators
- Interactive tooltips and reference lines

### State Management
- React hooks for local state management
- WebSocket connection management
- Real-time data synchronization
- Error state handling

## Usage

### Viewing Orderbooks
1. Select a venue (OKX, Bybit, or Deribit)
2. Choose a trading symbol (BTC-USDT, ETH-USDT, etc.)
3. View real-time bid/ask levels with quantities
4. Monitor connection status and data updates

### Simulating Orders
1. Fill out the order simulation form:
   - Select order type (Market/Limit)
   - Choose side (Buy/Sell)
   - Enter price (for limit orders)
   - Specify quantity
   - Set timing delay
2. Click "Simulate Order" to see impact analysis
3. View order position in the orderbook
4. Analyze market impact metrics

### Market Analysis
- Monitor order book imbalance indicators
- Analyze market depth charts
- Compare different timing scenarios
- Assess slippage and market impact

## Error Handling

### Connection Issues
- Automatic WebSocket reconnection
- Fallback mechanisms for data retrieval
- User-friendly error messages
- Manual reconnection options

### Data Validation
- Input validation for all form fields
- Price and quantity range checks
- Symbol format validation
- Real-time feedback on invalid inputs

### Rate Limiting
- Built-in rate limiting compliance
- Graceful handling of API limits
- Connection throttling
- Error recovery mechanisms

## Performance Optimizations

### WebSocket Management
- Efficient connection pooling
- Automatic cleanup on unmount
- Optimized message parsing
- Memory leak prevention

### Rendering Optimizations
- React.memo for expensive components
- Debounced updates for high-frequency data
- Virtual scrolling for large datasets
- Optimized re-renders

## Common Issues & Solutions

### WebSocket Connection Failures
- **Issue**: Connection drops or fails to establish
- **Solution**: Check network connectivity, try manual reconnection
- **Prevention**: Automatic reconnection with exponential backoff

### Data Parsing Errors
- **Issue**: Malformed data from exchange APIs
- **Solution**: Robust error handling and data validation
- **Prevention**: Comprehensive data parsing with fallbacks

### Rate Limiting
- **Issue**: Too many requests to exchange APIs
- **Solution**: Implement request throttling and queuing
- **Prevention**: Respect API rate limits and use WebSockets

## Development

### Adding New Exchanges
1. Update the `Venue` type in `types/orderbook.ts`
2. Add WebSocket URL and subscription logic in `useOrderbookData.ts`
3. Implement data parsing for the new exchange format
4. Update UI components to handle the new venue

### Extending Order Types
1. Update the `SimulatedOrder` interface
2. Add new order type options to the form
3. Implement calculation logic for new order types
4. Update visualization components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

This application is for educational and demonstration purposes only. It should not be used for actual trading without proper testing and risk management. Always verify calculations and test thoroughly before using in production environments.
