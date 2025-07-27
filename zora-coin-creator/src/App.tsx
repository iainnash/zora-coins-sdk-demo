import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { Navigation } from './components/Navigation'
import { CreateCoin } from './pages/CreateCoin'
import { CoinsList } from './pages/CoinsList'
import { Profile } from './pages/Profile'
import { Profiles } from './pages/Profiles'

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        
        <Routes>
          <Route path="/" element={<CreateCoin />} />
          <Route path="/coins" element={<CoinsList />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/profile/:identifier" element={<Profile />} />
        </Routes>

        <footer className="app-footer">
          <p>Powered by <a href="https://zora.co" target="_blank">Zora Protocol</a></p>
        </footer>
      </div>
    </Router>
  )
}

export default App
