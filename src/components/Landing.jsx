import React from 'react';
import { Link } from 'react-router-dom';
import UserInfo from './UserInfo';
import Navbar from './Navbar';



function Landing({ events, setEvents }) {
  return (
    <>
      <header className="navbar">
        <div className="logo">
          <img src="/src/assets/logo.png" alt="StudentTime Logo" className="logo-img" />
          <span>StudentTime</span>
        </div>
        <nav>
          <Link to="/login" className="login">Log In</Link>
          <Link to="/signup" className="signup">Sign Up</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h1>Stay Organized. Stay on Budget.</h1>
          <p>
            All-in-one scheduling and budgeting made for student life—plan smarter, spend better, and take control of your time and money.
          </p>
          <div className="cta-buttons">
            <Link to="/start" className="btn primary">Get Started</Link>
          </div>

        </div>
      </section>
      <section className="features">
      <div className="feature">
        <h2> Clean Visual Planner</h2>
        <p>
          Easily view your week with a simple and organized calendar. Add your own events or import course schedules directly from SFU.
        </p>
      </div>
      <div className="feature">
        <h2>Custom Events</h2>
        <p>
          Add one-time or recurring tasks, study sessions, or personal events — tailored to your own routine.
        </p>
      </div>
      <div className="feature">
        <h2> Budget Tracker</h2>
        <p>
          Track your expenses and manage your student budget in one place. Stay on top of where your money goes.
        </p>
      </div>
    </section>
      <footer className="footer">
        <p>&copy; 2025 StudentTime. All rights reserved.</p>
      </footer>
    </>
  );
}

export default Landing;
