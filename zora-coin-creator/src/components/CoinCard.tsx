import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useWalletClient, usePublicClient } from 'wagmi'
import { tradeCoin } from '@zoralabs/coins-sdk'
import { parseEther } from 'viem'

interface Coin {
  id: string
  name?: string
  symbol?: string
  description?: string
  imageUrl?: string
  marketCap?: string
  volume24h?: string
  priceChange24h?: number
  address: string
}

interface CoinCardProps {
  coin: Coin
}

export function CoinCard({ coin }: CoinCardProps) {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [hash, setHash] = useState<`0x${string}` | undefined>()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const handleBuyCoin = async () => {
    if (!address || !coin.address || !walletClient || !publicClient) {
      setError('Wallet not connected or invalid coin address')
      return
    }

    setPurchasing(true)
    setError('')
    setSuccess('')

    try {
      const tradeParameters = {
        sell: { type: "eth" as const },
        buy: {
          type: "erc20" as const,
          address: coin.address as `0x${string}`,
        },
        amountIn: parseEther("0.01"), // 0.01 ETH
        slippage: 0.05, // 5% slippage
        sender: address,
      }

      // Execute the trade using Zora SDK
      const receipt = await tradeCoin({
        tradeParameters,
        walletClient,
        account: address,
        publicClient,
      })

      setHash(receipt.transactionHash)
      setSuccess('Trade submitted! Waiting for confirmation...')
    } catch (err) {
      console.error('Error buying coin:', err)
      setError(err instanceof Error ? err.message : 'Failed to buy coin')
    } finally {
      setPurchasing(false)
    }
  }

  // Handle transaction status updates
  if (isConfirming && success !== 'Transaction confirming...') {
    setSuccess('Transaction confirming...')
  }

  if (isConfirmed && hash) {
    setSuccess(`Purchase successful! Transaction: ${hash}`)
  }

  const formatNumber = (num: string | undefined) => {
    if (!num) return 'N/A'
    const numValue = parseFloat(num)
    if (numValue >= 1000000) {
      return `$${(numValue / 1000000).toFixed(1)}M`
    } else if (numValue >= 1000) {
      return `$${(numValue / 1000).toFixed(1)}K`
    }
    return `$${numValue.toFixed(2)}`
  }

  const formatPercentage = (num: number | undefined) => {
    if (typeof num !== 'number') return 'N/A'
    const sign = num >= 0 ? '+' : ''
    return `${sign}${num.toFixed(2)}%`
  }

  return (
    <div className="coin-card">
      <div className="coin-header">
        {coin.imageUrl && (
          <img 
            src={coin.imageUrl} 
            alt={coin.name || coin.symbol || 'Coin'} 
            className="coin-image"
          />
        )}
        <div className="coin-info">
          <h3 className="coin-name">
            {coin.name || 'Unknown Coin'}
          </h3>
          <p className="coin-symbol">
            ${coin.symbol || 'N/A'}
          </p>
        </div>
      </div>

      {coin.description && (
        <p className="coin-description">
          {coin.description.length > 100 
            ? `${coin.description.substring(0, 100)}...`
            : coin.description
          }
        </p>
      )}

      <div className="coin-stats">
        <div className="stat">
          <span className="stat-label">Market Cap:</span>
          <span className="stat-value">{formatNumber(coin.marketCap)}</span>
        </div>
        
        <div className="stat">
          <span className="stat-label">24h Volume:</span>
          <span className="stat-value">{formatNumber(coin.volume24h)}</span>
        </div>

        <div className="stat">
          <span className="stat-label">24h Change:</span>
          <span className={`stat-value ${
            (coin.priceChange24h || 0) >= 0 ? 'positive' : 'negative'
          }`}>
            {formatPercentage(coin.priceChange24h)}
          </span>
        </div>
      </div>

      <div className="coin-actions">
        <button
          onClick={handleBuyCoin}
          disabled={purchasing || isConfirming}
          className="buy-button"
        >
          {purchasing ? 'Buying...' : 
           isConfirming ? 'Confirming...' : 
           'Buy 0.01 ETH'}
        </button>

        <div className="coin-address">
          <span className="address-label">Contract:</span>
          <span className="address-value">
            {coin.address?.slice(0, 6)}...{coin.address?.slice(-4)}
          </span>
        </div>
      </div>

      {error && (
        <div className="coin-error">
          {error}
        </div>
      )}

      {success && (
        <div className="coin-success">
          {success}
        </div>
      )}
    </div>
  )
}