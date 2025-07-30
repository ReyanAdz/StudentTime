// src/components/Header.jsx
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png'; // adjust if your logo path is different

function Header() {
  return (
    <header className="navbar">
      <div className="logo-container">
        <Link to="/">
          <img src={logo} alt="StudentTime Logo" className="logo-img" />
        </Link>
        <span className="logo-text">StudentTime</span>
      </div>
    </header>
  );
}

export default Header;
