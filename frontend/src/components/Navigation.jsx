import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

function Navigation() {
  const location = useLocation();

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <span className="nav-icon">🛡️</span>
          <span className="nav-title">Spam Detector</span>
        </div>
        <div className="nav-links">
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'active' : ''}
          >
            <span className="nav-link-icon">🏠</span>
            Home
          </Link>
          <Link 
            to="/history" 
            className={location.pathname === '/history' ? 'active' : ''}
          >
            <span className="nav-link-icon">📜</span>
            History
          </Link>
          <Link 
            to="/analytics" 
            className={location.pathname === '/analytics' ? 'active' : ''}
          >
            <span className="nav-link-icon">📊</span>
            Analytics
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;

