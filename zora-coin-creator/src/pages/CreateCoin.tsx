import { useAccount } from 'wagmi'
import { WalletConnection } from '../components/WalletConnection'
import { CoinCreationForm } from '../components/CoinCreationForm'

export function CreateCoin() {
  const { isConnected } = useAccount()

  return (
    <div className="page">
      <header className="page-header">
        <h1>Create Your Zora Coin</h1>
        <p>Launch your own coin on the Zora protocol</p>
      </header>

      <main className="page-main">
        <WalletConnection />
        {isConnected && <CoinCreationForm />}
      </main>
    </div>
  )
}