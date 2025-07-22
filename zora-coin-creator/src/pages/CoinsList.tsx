import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { getCoinsTopGainers, getCoinsTopVolume24h, getCoinsMostValuable } from '@zoralabs/coins-sdk'
import { WalletConnection } from '../components/WalletConnection'
import { NetworkChecker } from '../components/NetworkChecker'
import { CoinCard } from '../components/CoinCard'

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

type CoinsCategory = 'gainers' | 'volume' | 'valuable'

export function CoinsList() {
  const { isConnected } = useAccount()
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [category, setCategory] = useState<CoinsCategory>('gainers')

  const fetchCoins = async (selectedCategory: CoinsCategory) => {
    if (!isConnected) return

    setLoading(true)
    setError('')

    try {
      let response
      
      switch (selectedCategory) {
        case 'gainers':
          response = await getCoinsTopGainers({ count: 20 })
          break
        case 'volume':
          response = await getCoinsTopVolume24h({ count: 20 })
          break
        case 'valuable':
          response = await getCoinsMostValuable({ count: 20 })
          break
      }

      const tokens = response.data?.exploreList?.edges?.map(edge => {
        const coin = edge.node
        return {
          id: coin.id || coin.address,
          name: coin.name,
          symbol: coin.symbol,
          description: coin.description,
          imageUrl: coin.mediaContent?.previewImage?.medium,
          marketCap: coin.marketCap,
          volume24h: coin.volume24h,
          priceChange24h: parseInt(coin.marketCapDelta24h, 10),
          address: coin.address,
        }
      }) || []

      setCoins(tokens)
    } catch (err) {
      console.error('Error fetching coins:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch coins')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoins(category)
  }, [category, isConnected])

  const handleCategoryChange = (newCategory: CoinsCategory) => {
    setCategory(newCategory)
  }

  if (!isConnected) {
    return (
      <div className="page">
        <header className="page-header">
          <h1>Top Zora Coins</h1>
          <p>Discover and buy trending coins</p>
        </header>
        
        <main className="page-main">
          <WalletConnection />
        </main>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Top Zora Coins</h1>
        <p>Discover and buy trending coins</p>
      </header>

      <main className="page-main">
        <NetworkChecker />

        <div className="coins-controls">
          <div className="category-tabs">
            <button
              className={`tab-button ${category === 'gainers' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('gainers')}
            >
              🚀 Top Gainers
            </button>
            <button
              className={`tab-button ${category === 'volume' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('volume')}
            >
              📈 Top Volume
            </button>
            <button
              className={`tab-button ${category === 'valuable' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('valuable')}
            >
              💎 Most Valuable
            </button>
          </div>

          <button
            onClick={() => fetchCoins(category)}
            disabled={loading}
            className="refresh-button"
          >
            {loading ? '🔄' : '🔃'} Refresh
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <p>Loading top coins...</p>
            <div className="loading-spinner">⏳</div>
          </div>
        ) : (
          <div className="coins-grid">
            {coins.length > 0 ? (
              coins.map((coin) => (
                <CoinCard
                  key={coin.id}
                  coin={coin}
                />
              ))
            ) : (
              <div className="empty-state">
                <p>No coins found</p>
                <button onClick={() => fetchCoins(category)} className="retry-button">
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}