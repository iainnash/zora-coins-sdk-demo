# Zora Coin Creator

A web application for creating and trading Zora coins using the Zora Protocol SDK. Create custom ERC20 tokens and discover trending coins on Base network.

## Features

- **Create Coins**: Launch custom ERC20 tokens with metadata and IPFS upload
- **Discover Coins**: Browse top gainers, volume leaders, and most valuable coins
- **Trade Coins**: Buy coins with 0.01 ETH using built-in trading functionality
- **Wallet Integration**: MetaMask, Coinbase Wallet, and WalletConnect support
- **Base Network**: Optimized for Base mainnet and testnet

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Add your Zora API key and WalletConnect project ID
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Development Commands

```bash
# Development
npm run dev          # Start development server

# Building
npm run build        # Build for production
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint
```

## Requirements

- **Node.js**: v22+ (required for Vite 7 and @zoralabs/coins-sdk compatibility)
- **Web3 Wallet**: MetaMask, Coinbase Wallet, or WalletConnect compatible
- **Network**: Base mainnet or Base Sepolia testnet
- **Gas Fees**: ETH on Base network for transactions

## Environment Variables

```bash
# Required for coin creation media uploads
VITE_ZORA_API_KEY=your_zora_api_key_here

# Optional - enables WalletConnect support
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Get your Zora API key from [Zora developer settings](https://zora.co) and WalletConnect project ID from [WalletConnect Cloud](https://cloud.walletconnect.com).

## Usage

1. **Create Coins**: Connect wallet → Fill form → Upload metadata → Deploy coin
2. **Browse Coins**: Navigate to "Buy Coins" → Select category → View trending coins  
3. **Trade Coins**: Click "Buy 0.01 ETH" on any coin → Confirm transaction

## License

MIT
