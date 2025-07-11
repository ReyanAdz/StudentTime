import React from "react";

function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-image">
        <img src="https://source.unsplash.com/600x400/?graduation" alt="Graduation" />
      </div>
      <div className="hero-text">
        <h2>Welcome!</h2>
        <h3>Simplify Your Student Journey</h3>
        <div className="hero-links">
          <span>← Upcoming Events</span>
          <span>Finance Aid →</span>
        </div>
      </div>
      <div className="user-card">
        <img src="https://source.unsplash.com/100x100/?student" alt="John" className="user-avatar" />
        <h3>John</h3>
        <p><strong>SFU Computer Science</strong></p>
        <p>Upcoming Deadlines:</p>
        <ul>
          <li>- CMPT 276 Exam</li>
          <li>- Math 152 Lab</li>
        </ul>
      </div>
    </section>
  );
}

export default HeroSection;
