import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar'; 

function GetStarted() {
  const navigate = useNavigate();

  return (
    <div className="get-started-page"> 
      <Navbar />
      <section className="get-started-hero">
        <div className="get-started-content">
          <h1 className="get-started-title">What do you want to focus on?</h1>
          <p className="get-started-description">
            Choose how you want to start. Whether it's organizing your schedule or tracking your finances — you're in control.
          </p>

          <div className="get-started-options">
            <div className="option-card" onClick={() => navigate('/calendar')}>
              <div className="option-icon">🗓️</div>
              <h3>Calendar & Schedule</h3>
              <p>Organize your time, manage classes, and plan your day with our intuitive calendar interface.</p>
              <button className="option-button">
                Get Started →
              </button>
            </div>

            <div className="option-card" onClick={() => navigate('/finance')}>
              <div className="option-icon">💳</div>
              <h3>Finance Tracker</h3>
              <p>Track your expenses, monitor your budget, and get insights into your spending habits.</p>
              <button className="option-button">
                Get Started →
              </button>
            </div>
          </div>

          <div className="get-started-footer">
            <p>You can always switch between features later from the navigation menu.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default GetStarted;
