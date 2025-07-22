import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

export function NetworkChecker() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending, error } = useSwitchChain()

  if (!isConnected) return null

  const isOnSupportedNetwork = chainId === base.id || chainId === baseSepolia.id
  
  if (isOnSupportedNetwork) {
    return (
      <div className="network-status correct">
        <p>✅ Connected to {chainId === base.id ? 'Base' : 'Base Sepolia'}</p>
      </div>
    )
  }

  return (
    <div className="network-status incorrect">
      <h3>⚠️ Unsupported Network</h3>
      <p>Please switch to Base network to create Zora coins.</p>
      
      <div className="network-buttons">
        <button
          onClick={() => switchChain({ chainId: base.id })}
          disabled={isPending}
          className="switch-network-btn"
        >
          {isPending ? 'Switching...' : 'Switch to Base'}
        </button>
        
        <button
          onClick={() => switchChain({ chainId: baseSepolia.id })}
          disabled={isPending}
          className="switch-network-btn secondary"
        >
          {isPending ? 'Switching...' : 'Switch to Base Sepolia (Testnet)'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          Failed to switch network: {error.message}
        </div>
      )}
    </div>
  )
}