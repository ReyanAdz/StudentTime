import React from 'react';
import { Link } from 'react-router-dom';

function Landing({ events, setEvents }) {
  return (
    <>
      <header className="navbar">
        <div className="logo">
          <img src="/src/assets/logo.png" alt="StudentTime Logo" className="logo-img" />
          <span>StudentTime</span>
        </div>
        <nav>
          <a href="#">About</a>
          <a href="#" className="login">Log In</a>
          <a href="#" className="signup">Sign Up</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h1>Your Schedule. Simplified.</h1>
          <p>
            Plan smarter, stay organized, and own your time with our all-in-one scheduling
            platform made for students.
          </p>
          <div className="cta-buttons">
            <a href="#" className="btn primary">Get Started</a>
          </div>
        </div>
      </section>

      <section className="features">
        <Link to="/calendar" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card">
            <h3>✨ Clean Visual Planner</h3>
            <p>Easily view your week with a simple and organized calendar. Add your own events or import course schedules directly from SFU.</p>
          </div>
        </Link>
        <div className="feature">
          <h2>📊 Budget Tracker</h2>
          <p>Track your expenses and manage your student budget in one place. Stay on top of where your money goes.</p>
        </div>
        <div className="feature">
          <h2>📌 Custom Events</h2>
          <p>Add one-time or recurring tasks, study sessions, or personal events — tailored to your own routine.</p>
        </div>
      </section>

      <footer className="footer">
        <p>&copy; 2025 StudentTime. All rights reserved.</p>
      </footer>
    </>
  );
}

export default Landing;
