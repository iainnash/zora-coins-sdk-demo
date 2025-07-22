# Zora Coin Creation Webapp - Implementation Plan

## Project Overview

Build a simple webpage that allows users to connect their wallet and create Zora coins backed by the Zora protocol. The application will use modern web3 tools and the official Zora Coins SDK.

## Technical Stack

- **Frontend Framework**: Vite + React + TypeScript
- **Blockchain Integration**: WAGMI v2 + Viem
- **Zora Integration**: @zoralabs/coins-sdk
- **Target Blockchain**: Base (Zora's primary network)
- **Wallet Support**: MetaMask, WalletConnect, Coinbase Wallet
- **Styling**: CSS Modules or Tailwind CSS

## Implementation Steps

### 1. Project Setup
- [ ] Initialize Vite React project with TypeScript template
- [ ] Set up project structure and basic configuration
- [ ] Configure development environment

### 2. Install Dependencies
```bash
npm install @zoralabs/coins-sdk wagmi viem @wagmi/core @wagmi/connectors
npm install @tanstack/react-query
npm install @coinbase/wallet-sdk @walletconnect/ethereum-provider
```

### 3. WAGMI Configuration
- [ ] Configure WAGMI with Base chain support
- [ ] Set up wallet connectors (MetaMask, WalletConnect, Coinbase)
- [ ] Configure public and wallet clients
- [ ] Set up React Query provider

### 4. Wallet Connection Implementation
- [ ] Create wallet connection UI components
- [ ] Implement connect/disconnect functionality
- [ ] Display connected wallet address
- [ ] Handle connection errors and edge cases

### 5. Coin Creation Form
- [ ] Design form UI for coin metadata:
  - Coin name (required)
  - Coin symbol (required)
  - Description (optional)
  - Image upload (optional)
  - Payout recipient address
- [ ] Add form validation
- [ ] Implement file upload for coin images

### 6. Metadata Builder Integration
- [ ] Integrate Zora's metadata builder
- [ ] Implement IPFS upload functionality using `createZoraUploaderForCreator`
- [ ] Handle metadata validation and error cases
- [ ] Generate valid metadata URI

### 7. Coin Creation Logic
- [ ] Implement coin creation using `createCoinCall`
- [ ] Configure ZORA as backing currency (`DeployCurrency.ZORA`)
- [ ] Set up transaction simulation with `useSimulateContract`
- [ ] Execute transactions with `useWriteContract`
- [ ] Handle initial purchase option (optional feature)

### 8. Transaction Handling
- [ ] Track transaction status (pending, success, failed)
- [ ] Implement transaction confirmation waiting
- [ ] Extract coin address from transaction logs using `getCoinCreateFromLogs`
- [ ] Display deployed coin information to user

### 9. Error Handling & UX
- [ ] Implement comprehensive error handling:
  - Wallet connection errors
  - Insufficient funds
  - Transaction failures
  - Network issues
- [ ] Add loading states and progress indicators
- [ ] Provide user-friendly error messages
- [ ] Add success notifications

### 10. Testing & Validation
- [ ] Test on Base testnet first
- [ ] Validate all user flows:
  - Wallet connection/disconnection
  - Form submission and validation
  - Successful coin creation
  - Error scenarios
- [ ] Test with different wallet providers
- [ ] Verify coin deployment on blockchain explorer

## Key Technical Implementation Details

### Coin Creation Parameters
```typescript
const coinParams = {
  name: string,           // "My Awesome Coin"
  symbol: string,         // "MAC"
  uri: ValidMetadataURI,  // IPFS metadata URI
  payoutRecipient: Address, // Creator's wallet address
  currency: DeployCurrency.ZORA, // Use ZORA as backing currency
  chainId: base.id,       // Base mainnet
  platformReferrer?: Address, // Optional referrer
  initialPurchase?: {     // Optional initial supply purchase
    currency: InitialPurchaseCurrency.ETH,
    amount: bigint
  }
}
```

### Metadata Structure
```typescript
const metadata = {
  name: string,
  symbol: string,
  description?: string,
  image?: File,
  // Additional metadata fields as needed
}
```

### Transaction Flow
1. User fills out coin creation form
2. Form validation and metadata preparation
3. Upload metadata to IPFS via Zora uploader
4. Simulate transaction to check for errors
5. Execute coin creation transaction
6. Wait for transaction confirmation
7. Extract coin address from transaction logs
8. Display success message with coin details

## API Integration

### Zora SDK Setup
```typescript
import { setApiKey } from "@zoralabs/coins-sdk";

// Configure API key for rate limiting prevention
setApiKey("your-zora-api-key");
```

### Required SDK Functions
- `createMetadataBuilder()` - For metadata creation
- `createZoraUploaderForCreator()` - For IPFS uploads
- `createCoinCall()` - For coin creation configuration
- `getCoinCreateFromLogs()` - For extracting coin address

## Development Environment

### Chain Configuration
- **Primary**: Base Mainnet (Chain ID: 8453)
- **Testing**: Base Sepolia Testnet (Chain ID: 84532)

### Required Environment Variables
```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_ZORA_API_KEY=your_zora_api_key
```

## User Experience Flow

1. **Landing Page**: Simple interface explaining coin creation
2. **Wallet Connection**: Prominent connect wallet button
3. **Coin Creation Form**: Clean, intuitive form with validation
4. **Transaction Progress**: Clear status updates during creation
5. **Success State**: Display coin address and link to explorer
6. **Error Handling**: Helpful error messages with retry options

## Security Considerations

- Validate all user inputs
- Sanitize file uploads
- Handle wallet connection securely
- Never expose private keys or sensitive data
- Use secure RPC endpoints
- Implement proper error boundaries

## Future Enhancements

- [ ] Support for additional backing currencies (ETH)
- [ ] Batch coin creation
- [ ] Coin management dashboard
- [ ] Integration with Zora marketplace
- [ ] Advanced metadata options
- [ ] Social sharing features
- [ ] Analytics and tracking

## Resources

- [Zora Coins Documentation](https://docs.zora.co/coins/sdk)
- [WAGMI Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)
- [Base Network Documentation](https://docs.base.org/)

## Success Criteria

- [x] Research completed and plan documented
- [ ] Functional wallet connection with multiple providers
- [ ] Successful coin creation on Base network
- [ ] Intuitive user interface with proper error handling
- [ ] Comprehensive testing on testnet and mainnet
- [ ] Clean, maintainable code with TypeScript