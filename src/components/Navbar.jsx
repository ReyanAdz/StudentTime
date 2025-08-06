// src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav style={styles.navbar}>
      <Link to="/" style={styles.logoContainer}>
        <img src="/src/assets/logo.png" alt="StudentTime" style={styles.logo} />
        <span style={styles.title}>StudentTime</span>
      </Link>
      <div style={styles.navLinks}>
        <Link to="/calendar" style={styles.link}>Calendar</Link>
        <Link to="/finance" style={styles.link}>Finances</Link>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: 'var(--gray-800)',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
  },
  logo: {
    width: '50px',
    height: '50px',
    marginRight: '0.5rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  navLinks: {
    display: 'flex',
    gap: '1.5rem',
  },
  link: {
    textDecoration: 'none',
    color: '#FFFFFF',
    fontWeight: '500',
  }
};

export default Navbar;
