import { useConnect, useDisconnect, useAccount } from 'wagmi'

export function WalletConnection() {
  const { connectors, connect, status, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { address, isConnected, chain } = useAccount()

  if (isConnected) {
    return (
      <div className="wallet-connected">
        <div className="connection-info">
          <p>Connected to {address?.slice(0, 6)}...{address?.slice(-4)}</p>
          <p>Network: {chain?.name}</p>
        </div>
        <button onClick={() => disconnect()} className="disconnect-btn">
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="wallet-connection">
      <h2>Connect Your Wallet</h2>
      <p>Connect your wallet to create Zora coins</p>
      
      <div className="connector-list">
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            type="button"
            disabled={status === 'pending'}
            className="connector-btn"
          >
            {connector.name}
          </button>
        ))}
      </div>

      {error && (
        <div className="error-message">
          Error: {error.message}
        </div>
      )}
    </div>
  )
}