import { Link, useLocation } from 'react-router-dom';
import '../styles/Header.css';

function Header() {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="app-header">
            <div className="header-content">
                <div className="header-logo">
                    <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="logo-text">SmartBuy</span>
                </div>

                <nav className="header-nav">
                    <Link to="/" className={isActive('/') ? 'nav-link active' : 'nav-link'}>
                        Dashboard
                    </Link>
                    <Link to="/houses" className={isActive('/houses') ? 'nav-link active' : 'nav-link'}>
                        Houses
                    </Link>
                    <Link to="/profile" className={isActive('/profile') ? 'nav-link active' : 'nav-link'}>
                        Profile
                    </Link>
                </nav>
            </div>
        </header>
    );
}

export default Header;
