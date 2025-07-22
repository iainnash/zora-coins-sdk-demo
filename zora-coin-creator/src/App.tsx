import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { Navigation } from './components/Navigation'
import { CreateCoin } from './pages/CreateCoin'
import { CoinsList } from './pages/CoinsList'

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        
        <Routes>
          <Route path="/" element={<CreateCoin />} />
          <Route path="/coins" element={<CoinsList />} />
        </Routes>

        <footer className="app-footer">
          <p>Powered by <a href="https://zora.co" target="_blank">Zora Protocol</a></p>
        </footer>
      </div>
    </Router>
  )
}

export default App
