import React from 'react';

function Home({ events, setEvents }) {
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
        <div className="feature">
          <h2>✨ Clean Visual Planner</h2>
          <p>Drag and drop your classes, tasks, and events into a beautiful weekly view.</p>
        </div>
        <div className="feature">
          <h2>📅 Calendar Sync</h2>
          <p>Connect with Google Calendar or iCal to see everything in one place.</p>
        </div>
        <div className="feature">
          <h2>💡 Smart Reminders</h2>
          <p>Get notified before deadlines or when it's time to study.</p>
        </div>
      </section>

      <footer className="footer">
        <p>&copy; 2025 StudentTime. All rights reserved.</p>
      </footer>
    </>
  );
}

export default Home;
