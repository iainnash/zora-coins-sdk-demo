import { Link, useLocation } from 'react-router-dom'

export function Navigation() {
  const location = useLocation()

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <Link to="/" className="brand-link">
          Zora Coin Creator
        </Link>
      </div>
      
      <div className="nav-links">
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          Create Coin
        </Link>
        <Link 
          to="/coins" 
          className={`nav-link ${location.pathname === '/coins' ? 'active' : ''}`}
        >
          Buy Coins
        </Link>
        <Link 
          to="/profiles" 
          className={`nav-link ${location.pathname === '/profiles' ? 'active' : ''}`}
        >
          Profiles
        </Link>
      </div>
    </nav>
  )
}