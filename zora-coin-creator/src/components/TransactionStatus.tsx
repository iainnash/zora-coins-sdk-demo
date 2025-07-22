import { useEffect, useState } from 'react'
import { getCoinCreateFromLogs } from '@zoralabs/coins-sdk'
import { useWaitForTransactionReceipt } from 'wagmi'

interface TransactionStatusProps {
  hash: `0x${string}` | undefined
  onSuccess?: (coinAddress: string) => void
}

export function TransactionStatus({ hash, onSuccess }: TransactionStatusProps) {
  const [coinAddress, setCoinAddress] = useState<string>('')
  
  const { 
    data: receipt, 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error
  } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    if (isConfirmed && receipt) {
      try {
        const coinDeployment = getCoinCreateFromLogs(receipt)
        if (coinDeployment?.coin) {
          setCoinAddress(coinDeployment.coin)
          onSuccess?.(coinDeployment.coin)
        }
      } catch (err) {
        console.error('Error extracting coin address:', err)
      }
    }
  }, [isConfirmed, receipt, onSuccess])

  if (!hash) return null

  if (error) {
    return (
      <div className="transaction-status error">
        <h3>Transaction Failed</h3>
        <p>{error.message}</p>
      </div>
    )
  }

  if (isConfirming) {
    return (
      <div className="transaction-status pending">
        <h3>Transaction Confirming...</h3>
        <p>Hash: {hash}</p>
        <div className="loading-spinner">⏳</div>
      </div>
    )
  }

  if (isConfirmed && coinAddress) {
    return (
      <div className="transaction-status success">
        <h3>🎉 Coin Created Successfully!</h3>
        <div className="coin-details">
          <p><strong>Transaction:</strong></p>
          <p className="hash">{hash}</p>
          
          <p><strong>Coin Address:</strong></p>
          <p className="coin-address">{coinAddress}</p>
          
          <div className="action-buttons">
            <a 
              href={`https://basescan.org/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="view-tx-btn"
            >
              View on BaseScan
            </a>
            <a 
              href={`https://basescan.org/address/${coinAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="view-coin-btn"
            >
              View Coin Contract
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (isConfirmed) {
    return (
      <div className="transaction-status success">
        <h3>Transaction Confirmed</h3>
        <p>Hash: {hash}</p>
        <p>Unable to extract coin address from logs</p>
      </div>
    )
  }

  return null
}