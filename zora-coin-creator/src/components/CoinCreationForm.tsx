import { useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { createMetadataBuilder, createZoraUploaderForCreator, DeployCurrency, createCoinCall } from '@zoralabs/coins-sdk'
import { type Address } from 'viem'
import { useWriteContract } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { TransactionStatus } from './TransactionStatus'
import { NetworkChecker } from './NetworkChecker'

interface CoinMetadata {
  name: string
  symbol: string
  description: string
  image: File | null
}

export function CoinCreationForm() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [metadata, setMetadata] = useState<CoinMetadata>({
    name: '',
    symbol: '',
    description: '',
    image: null
  })
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  const { writeContract, data: hash, error: writeError } = useWriteContract()

  const isOnSupportedNetwork = chainId === base.id || chainId === baseSepolia.id

  if (!isConnected) {
    return (
      <div className="form-disabled">
        <p>Please connect your wallet to create a coin</p>
      </div>
    )
  }

  if (!isOnSupportedNetwork) {
    return (
      <div className="coin-creation-form">
        <NetworkChecker />
        <div className="form-disabled">
          <p>Please switch to Base network to create coins</p>
        </div>
      </div>
    )
  }

  const handleInputChange = (field: keyof CoinMetadata, value: string | File) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
    setSuccess('')
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image file must be less than 5MB')
        return
      }
      handleInputChange('image', file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!metadata.name || !metadata.symbol || !metadata.description || !metadata.image) {
      setError('All fields are required')
      return
    }

    if (!address) {
      setError('Wallet not connected')
      return
    }

    setIsCreating(true)
    setError('')
    setSuccess('')

    try {
      // Create metadata using Zora's metadata builder
      const { createMetadataParameters } = await createMetadataBuilder()
        .withName(metadata.name)
        .withSymbol(metadata.symbol)
        .withDescription(metadata.description)
        .withImage(metadata.image)
        .upload(createZoraUploaderForCreator(address as Address))

      // Prepare coin creation parameters
      const createCoinArgs = {
        ...createMetadataParameters,
        payoutRecipient: address as Address,
        currency: DeployCurrency.ZORA,
        chainId: chainId, // Use current chain ID
      }

      // Get the contract call parameters
      const contractCallParams = await createCoinCall(createCoinArgs)

      // Execute the transaction
      writeContract(contractCallParams)

      setSuccess('Transaction submitted! Waiting for confirmation...')
    } catch (err) {
      console.error('Error creating coin:', err)
      setError(err instanceof Error ? err.message : 'Failed to create coin')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCoinCreated = (coinAddress: string) => {
    setSuccess(`Coin created successfully! Address: ${coinAddress}`)
    // Reset form after successful creation
    setMetadata({
      name: '',
      symbol: '',
      description: '',
      image: null
    })
  }

  if (writeError) {
    setError(writeError.message)
  }

  return (
    <div className="coin-creation-form">
      <h2>Create Your Zora Coin</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Coin Name</label>
          <input
            type="text"
            id="name"
            value={metadata.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., My Awesome Coin"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="symbol">Symbol</label>
          <input
            type="text"
            id="symbol"
            value={metadata.symbol}
            onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
            placeholder="e.g., MAC"
            maxLength={10}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={metadata.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your coin..."
            rows={4}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">Coin Image</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
          <small>Max file size: 5MB</small>
        </div>

        <button 
          type="submit" 
          disabled={isCreating}
          className="create-btn"
        >
          {isCreating ? 'Creating Coin...' : 'Create Coin'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <TransactionStatus hash={hash} onSuccess={handleCoinCreated} />
    </div>
  )
}