import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { parseEther, formatEther } from 'viem'
import { getProfile, getCoin, tradeCoin, createTradeCall } from '@zoralabs/coins-sdk'
import { WalletConnection } from '../components/WalletConnection'
import { NetworkChecker } from '../components/NetworkChecker'

interface ProfileData {
  id: string
  handle: string
  username: string
  displayName?: string
  bio: string
  avatar?: {
    small: string
    medium: string
    blurhash?: string
  }
  publicWallet: {
    walletAddress: string
  }
  creatorCoin?: {
    address: string
  }
}

interface CoinData {
  name?: string
  symbol?: string
  description?: string
  totalSupply?: string
  marketCap?: string
  volume24h?: string
  address: string
}


interface TradeState {
  isTrading: boolean
  type: 'buy' | 'sell' | null
  amount: string
  expectedOutput: string
  error: string
}

// Helper function to format token amounts as integers
const formatTokenAmount = (weiAmount: string): number => {
  return Math.floor(parseFloat(formatEther(BigInt(weiAmount))))
}

export function Profile() {
  const { identifier } = useParams<{ identifier: string }>()
  const { isConnected, address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  
  const [tradeState, setTradeState] = useState<TradeState>({
    isTrading: false,
    type: null,
    amount: '',
    expectedOutput: '',
    error: ''
  })
  
  const [sellPercentage, setSellPercentage] = useState<number>(0)

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile
  } = useQuery({
    queryKey: ['profile', identifier],
    queryFn: async () => {
      if (!identifier) throw new Error('No identifier provided')
      
      const response = await getProfile({ identifier })
      const profileData = response.data?.profile
      
      if (!profileData) throw new Error('Profile not found')
      
      return {
        id: profileData.id,
        handle: profileData.handle,
        username: profileData.username,
        displayName: profileData.displayName,
        bio: profileData.bio,
        avatar: profileData.avatar,
        publicWallet: profileData.publicWallet,
        creatorCoin: profileData.creatorCoin
      } as ProfileData
    },
    enabled: Boolean(identifier),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2
  })

  const {
    data: coin,
    isLoading: coinLoading,
    error: coinError
  } = useQuery({
    queryKey: ['coin', profile?.creatorCoin?.address],
    queryFn: async () => {
      if (!profile?.creatorCoin?.address) return null
      
      const response = await getCoin({ 
        address: profile.creatorCoin.address 
      })
      
      const coinData = response.data?.zora20Token
      if (!coinData) return null
      
      return {
        name: coinData.name,
        symbol: coinData.symbol,
        description: coinData.description,
        totalSupply: coinData.totalSupply,
        marketCap: coinData.marketCap,
        volume24h: coinData.volume24h,
        address: coinData.address
      } as CoinData
    },
    enabled: Boolean(profile?.creatorCoin?.address),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1
  })

  // Get user's balance for this creator coin using direct viem call
  const {
    data: userBalance,
    isLoading: balanceLoading,
    refetch: refetchBalance
  } = useQuery({
    queryKey: ['userBalance', address, profile?.creatorCoin?.address],
    queryFn: async () => {
      if (!address || !profile?.creatorCoin?.address || !publicClient) return null
      
      const balance = await publicClient.readContract({
        address: profile.creatorCoin.address as `0x${string}`,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
          },
        ],
        functionName: 'balanceOf',
        args: [address],
      })
      
      return balance.toString()
    },
    enabled: Boolean(address && profile?.creatorCoin?.address && isConnected && publicClient),
    staleTime: 1000 * 30, // 30 seconds
  })

  // Get quote for trade preview
  const getTradeQuote = async (amountIn: string, type: 'buy' | 'sell') => {
    if (!profile?.creatorCoin?.address || !address || !amountIn || !walletClient || !publicClient) return

    try {
      const tradeParameters = {
        sell: type === 'buy' 
          ? { type: "eth" as const }
          : { type: "erc20" as const, address: profile.creatorCoin.address as `0x${string}` },
        buy: type === 'buy'
          ? { type: "erc20" as const, address: profile.creatorCoin.address as `0x${string}` }
          : { type: "eth" as const },
        amountIn: type === 'buy' 
          ? parseEther(amountIn)
          : BigInt(amountIn),
        slippage: 0.05,
        sender: address,
      }

      const quote = await createTradeCall(tradeParameters)
      return quote.quote?.amountOut || '0'
    } catch (err) {
      console.error('Quote error:', err)
      return '0'
    }
  }

  // Execute trade
  const executeTrade = async (type: 'buy' | 'sell') => {
    if (!profile?.creatorCoin?.address || !address || !walletClient || !publicClient || !tradeState.amount) return

    setTradeState(prev => ({ ...prev, isTrading: true, error: '' }))

    try {
      const amountIn = type === 'buy' 
        ? parseEther(tradeState.amount)
        : BigInt(tradeState.amount)

      const tradeParameters = {
        sell: type === 'buy' 
          ? { type: "eth" as const }
          : { type: "erc20" as const, address: profile.creatorCoin.address as `0x${string}` },
        buy: type === 'buy'
          ? { type: "erc20" as const, address: profile.creatorCoin.address as `0x${string}` }
          : { type: "eth" as const },
        amountIn,
        slippage: 0.05,
        sender: address,
      }

      await tradeCoin({
        tradeParameters,
        walletClient,
        publicClient,
        account: address,
      })

      // Refetch balances after successful trade
      refetchBalance()
      
      setTradeState({
        isTrading: false,
        type: null,
        amount: '',
        expectedOutput: '',
        error: ''
      })

    } catch (err: unknown) {
      let errorMessage = 'Trade failed'
      
      if (err instanceof Error) {
        if (err.message.includes('insufficient')) {
          errorMessage = 'Insufficient ETH for transaction'
        } else if (err.message.includes('rejected') || err.message.includes('denied')) {
          errorMessage = 'Transaction signature rejected'
        } else if (err.message.includes('reverted')) {
          errorMessage = 'Swap failed - try adjusting slippage'
        }
      }

      setTradeState(prev => ({ 
        ...prev, 
        isTrading: false, 
        error: errorMessage 
      }))
    }
  }

  // Handle amount input change with real-time quote
  const handleAmountChange = async (value: string, type: 'buy' | 'sell') => {
    setTradeState(prev => ({ ...prev, amount: value, type }))
    
    if (value && parseFloat(value) > 0) {
      const quote = await getTradeQuote(value, type)
      setTradeState(prev => ({ ...prev, expectedOutput: quote || '0' }))
    } else {
      setTradeState(prev => ({ ...prev, expectedOutput: '' }))
    }
  }

  // Handle percentage sell
  const handlePercentageSell = async (percentage: number) => {
    if (!userBalance) return
    
    setSellPercentage(percentage)
    const amount = (BigInt(userBalance) * BigInt(percentage) / BigInt(100)).toString()
    await handleAmountChange(amount, 'sell')
  }

  const loading = profileLoading || coinLoading || balanceLoading
  const error = profileError || coinError


  if (loading) {
    return (
      <div className="page">
        <header className="page-header">
          <h1>Profile</h1>
        </header>
        
        <main className="page-main">
          {isConnected && <NetworkChecker />}
          <div className="loading-state">
            <p>Loading profile...</p>
            <div className="loading-spinner">⏳</div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <header className="page-header">
          <h1>Profile</h1>
        </header>
        
        <main className="page-main">
          {isConnected && <NetworkChecker />}
          <div className="error-message">
            {error instanceof Error ? error.message : 'Failed to fetch profile data'}
          </div>
          <button onClick={() => refetchProfile()} className="retry-button">
            Try Again
          </button>
        </main>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="page">
        <header className="page-header">
          <h1>Profile</h1>
        </header>
        
        <main className="page-main">
          {isConnected && <NetworkChecker />}
          <div className="empty-state">
            <p>Profile not found</p>
            <button onClick={() => refetchProfile()} className="retry-button">
              Try Again
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Profile</h1>
        <p>User profile and creator coin information</p>
      </header>

      <main className="page-main">
        {isConnected && <NetworkChecker />}

        <div className="profile-container">
          <div className="profile-info">
            <div className="profile-header">
              {profile.avatar?.medium && (
                <img 
                  src={profile.avatar.medium} 
                  alt={profile.displayName || profile.handle || 'Profile'} 
                  className="profile-image"
                />
              )}
              <div className="profile-details">
                <h2>{profile.displayName || profile.handle || 'Anonymous'}</h2>
                {profile.handle && <p className="profile-handle">@{profile.handle}</p>}
                <p className="profile-address">{profile.publicWallet.walletAddress}</p>
                {profile.bio && <p className="profile-bio">{profile.bio}</p>}
              </div>
            </div>
          </div>

          {coin && (
            <div className="creator-coin-info">
              <h3>Creator Coin</h3>
              <div className="coin-details">
                <div className="coin-header">
                  <h4>{coin.name} ({coin.symbol})</h4>
                  <p className="coin-address">{coin.address}</p>
                </div>
                {coin.description && (
                  <p className="coin-description">{coin.description}</p>
                )}
                <div className="coin-stats">
                  {coin.marketCap && (
                    <div className="stat">
                      <span className="stat-label">Market Cap:</span>
                      <span className="stat-value">{coin.marketCap}</span>
                    </div>
                  )}
                  {coin.volume24h && (
                    <div className="stat">
                      <span className="stat-label">24h Volume:</span>
                      <span className="stat-value">{coin.volume24h}</span>
                    </div>
                  )}
                  {coin.totalSupply && (
                    <div className="stat">
                      <span className="stat-label">Total Supply:</span>
                      <span className="stat-value">{coin.totalSupply}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!coin && profile.creatorCoin?.address && (
            <div className="creator-coin-info">
              <h3>Creator Coin</h3>
              <p>Creator coin found at {profile.creatorCoin.address} but details could not be loaded.</p>
            </div>
          )}

          {!profile.creatorCoin?.address && (
            <div className="creator-coin-info">
              <h3>Creator Coin</h3>
              <p>This user does not have a creator coin.</p>
            </div>
          )}

          {/* Trading Section */}
          {coin && (
            <div className="trading-section">
              <h3>Trade {coin.symbol}</h3>
              
              {!isConnected ? (
                <div className="wallet-connection">
                  <p>Connect your wallet to trade {coin.symbol}</p>
                  <WalletConnection />
                </div>
              ) : (
                <div className="trading-content">
                  {/* User Balance Display */}
                  {userBalance && (
                    <div className="user-balance">
                      <h4>Your Balance</h4>
                      <p>{formatTokenAmount(userBalance)} {coin.symbol}</p>
                    </div>
                  )}

                  {/* Buy Section */}
                  <div className="trade-card">
                    <h4>Buy {coin.symbol}</h4>
                    <div className="trade-input">
                      <label>ETH Amount:</label>
                      <input
                        type="number"
                        step="0.001"
                        placeholder="0.01"
                        value={tradeState.type === 'buy' ? tradeState.amount : ''}
                        onChange={(e) => handleAmountChange(e.target.value, 'buy')}
                        disabled={tradeState.isTrading}
                      />
                    </div>
                    {tradeState.type === 'buy' && tradeState.expectedOutput && (
                      <div className="expected-output">
                        Expected: {formatTokenAmount(tradeState.expectedOutput)} {coin.symbol}
                      </div>
                    )}
                    <button
                      onClick={() => executeTrade('buy')}
                      disabled={tradeState.isTrading || !tradeState.amount || tradeState.type !== 'buy'}
                      className="trade-button buy-button"
                    >
                      {tradeState.isTrading && tradeState.type === 'buy' ? 'Buying...' : `Buy ${coin.symbol}`}
                    </button>
                  </div>

                  {/* Sell Section */}
                  {userBalance && formatTokenAmount(userBalance) > 0 && (
                    <div className="trade-card">
                      <h4>Sell {coin.symbol}</h4>
                      
                      {/* Percentage Buttons */}
                      <div className="percentage-buttons">
                        {[25, 50, 75, 100].map(percent => (
                          <button
                            key={percent}
                            onClick={() => handlePercentageSell(percent)}
                            disabled={tradeState.isTrading}
                            className={`percentage-button ${sellPercentage === percent ? 'active' : ''}`}
                          >
                            {percent}%
                          </button>
                        ))}
                      </div>

                      {/* Exact Amount Input */}
                      <div className="trade-input">
                        <label>{coin.symbol} Amount:</label>
                        <input
                          type="number"
                          step="0.000001"
                          placeholder="0"
                          value={tradeState.type === 'sell' ? formatTokenAmount(tradeState.amount || '0').toString() : ''}
                          onChange={(e) => {
                            const ethAmount = e.target.value
                            if (ethAmount) {
                              const weiAmount = parseEther(ethAmount).toString()
                              handleAmountChange(weiAmount, 'sell')
                            } else {
                              setTradeState(prev => ({ ...prev, amount: '', expectedOutput: '' }))
                            }
                            setSellPercentage(0)
                          }}
                          disabled={tradeState.isTrading}
                        />
                      </div>

                      {tradeState.type === 'sell' && tradeState.expectedOutput && (
                        <div className="expected-output">
                          Expected: {formatEther(BigInt(tradeState.expectedOutput))} ETH
                        </div>
                      )}

                      <button
                        onClick={() => executeTrade('sell')}
                        disabled={tradeState.isTrading || !tradeState.amount || tradeState.type !== 'sell'}
                        className="trade-button sell-button"
                      >
                        {tradeState.isTrading && tradeState.type === 'sell' ? 'Selling...' : `Sell ${coin.symbol}`}
                      </button>
                    </div>
                  )}

                  {/* Error Display */}
                  {tradeState.error && (
                    <div className="trade-error">
                      {tradeState.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}