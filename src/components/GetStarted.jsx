import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar'; 

function GetStarted() {
  const navigate = useNavigate();

  return (
    <div className="get-started-page"> 
      <Navbar />
      <section className="get-started-hero">
        <h1>What do you want to focus on?</h1>
        <p>
          Choose how you want to start. Whether it's organizing your schedule or tracking your finances — you're in control.
        </p>

        <div className="cta-buttons">
          <button className="btn secondary" onClick={() => navigate('/calendar')}>
            📅 Use the Calendar
          </button>
          <button className="btn secondary" onClick={() => navigate('/finance')}>
            💰 Manage Finances
          </button>
        </div>
      </section>
    </div>
  );
}

export default GetStarted;
