import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar'; 

function GetStarted() {
  const navigate = useNavigate();

  return (
    <>
    <Navbar />
    <section className="hero hero-full">
      <h1>What do you want to focus on?</h1>
      <p>
        Choose how you want to start. Whether it's organizing your schedule or tracking your finances — you're in control.
      </p>

      <div className="cta-buttons">
        <button className="btn primary" onClick={() => navigate('/calendar')}>
          📅 Use the Calendar
        </button>
        <button className="btn primary" onClick={() => navigate('/finance')}>
          💰 Manage Finances
        </button>
      </div>
    </section>
    </>
  );
}

export default GetStarted;
