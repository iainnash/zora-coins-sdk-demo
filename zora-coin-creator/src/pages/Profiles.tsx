import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { getMostValuableCreatorCoins } from '@zoralabs/coins-sdk'
import { NetworkChecker } from '../components/NetworkChecker'

interface CreatorCoin {
  id: string
  name: string
  symbol: string
  marketCap: string
  marketCapDelta24h: string
  creatorProfile?: {
    id: string
    handle: string
    avatar?: {
      previewImage: {
        small: string
        medium: string
      }
    }
  }
}

export function Profiles() {
  const { isConnected } = useAccount()
  const navigate = useNavigate()
  const [searchIdentifier, setSearchIdentifier] = useState('')

  const {
    data: creatorCoins,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['mostValuableCreatorCoins'],
    queryFn: async () => {
      const response = await getMostValuableCreatorCoins({ count: 20 })
      
      return response.data?.exploreList?.edges?.map(edge => {
        const coin = edge.node
        return {
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          marketCap: coin.marketCap,
          marketCapDelta24h: coin.marketCapDelta24h,
          creatorProfile: coin.creatorProfile
        } as CreatorCoin
      }) || []
    },
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2
  })

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchIdentifier.trim()) {
      navigate(`/profile/${encodeURIComponent(searchIdentifier.trim())}`)
    }
  }

  const handleCreatorClick = (creatorProfile: CreatorCoin['creatorProfile']) => {
    if (creatorProfile?.handle) {
      navigate(`/profile/${encodeURIComponent(creatorProfile.handle)}`)
    }
  }

  const formatMarketCap = (marketCap: string) => {
    const value = parseFloat(marketCap)
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return `$${value.toFixed(0)}`
  }

  const formatMarketCapDelta = (delta: string) => {
    const value = parseFloat(delta)
    const isPositive = value >= 0
    const formatted = Math.abs(value).toFixed(1)
    return {
      value: `${isPositive ? '+' : '-'}${formatted}%`,
      isPositive
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Creator Profiles</h1>
        <p>Discover top creator coins and search profiles</p>
      </header>

      <main className="page-main">
        {isConnected && <NetworkChecker />}

        {/* Profile Search */}
        <div className="profile-search">
          <h3>Search Profile</h3>
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Enter wallet address or handle (e.g., vitalik.zora)"
                value={searchIdentifier}
                onChange={(e) => setSearchIdentifier(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button" disabled={!searchIdentifier.trim()}>
                Go to Profile
              </button>
            </div>
          </form>
        </div>

        {/* Creator Coins List */}
        <div className="creator-coins-section">
          <div className="section-header">
            <h3>Most Valuable Creator Coins</h3>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="refresh-button"
            >
              {isLoading ? '🔄' : '🔃'} Refresh
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error instanceof Error ? error.message : 'Failed to fetch creator coins'}
            </div>
          )}

          {isLoading ? (
            <div className="loading-state">
              <p>Loading creator coins...</p>
              <div className="loading-spinner">⏳</div>
            </div>
          ) : (
            <div className="creator-coins-grid">
              {creatorCoins && creatorCoins.length > 0 ? (
                creatorCoins.map((coin) => {
                  const delta = formatMarketCapDelta(coin.marketCapDelta24h)
                  
                  return (
                    <div
                      key={coin.id}
                      className="creator-coin-card"
                      onClick={() => handleCreatorClick(coin.creatorProfile)}
                      style={{ cursor: coin.creatorProfile?.handle ? 'pointer' : 'default' }}
                    >
                      <div className="creator-info">
                        {coin.creatorProfile?.avatar?.previewImage?.small ? (
                          <img
                            src={coin.creatorProfile.avatar.previewImage.small}
                            alt={coin.creatorProfile.handle || 'Creator'}
                            className="creator-avatar"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="creator-avatar-placeholder">
                            👤
                          </div>
                        )}
                        
                        <div className="creator-details">
                          <h4 className="creator-name">
                            {coin.creatorProfile?.handle || coin.name}
                          </h4>
                          <p className="coin-symbol">{coin.symbol}</p>
                        </div>
                      </div>

                      <div className="market-stats">
                        <div className="market-cap">
                          <span className="stat-label">Market Cap</span>
                          <span className="stat-value">{formatMarketCap(coin.marketCap)}</span>
                        </div>
                        
                        <div className="market-delta">
                          <span className="stat-label">24h Change</span>
                          <span className={`stat-value ${delta.isPositive ? 'positive' : 'negative'}`}>
                            {delta.value}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="empty-state">
                  <p>No creator coins found</p>
                  <button onClick={() => refetch()} className="retry-button">
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}