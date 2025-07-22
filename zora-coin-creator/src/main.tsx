import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setApiKey } from '@zoralabs/coins-sdk'
import './index.css'
import App from './App.tsx'
import { config } from './config/wagmi'

// Set Zora API key if provided
const zoraApiKey = import.meta.env.VITE_ZORA_API_KEY
if (zoraApiKey) {
  setApiKey(zoraApiKey)
}

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
