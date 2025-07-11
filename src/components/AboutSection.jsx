import React from "react";

function AboutSection() {
  return (
    <section className="about">
      <div className="about-grid">
        <img src="https://source.unsplash.com/300x200/?students" alt="Students" />
        <img src="https://source.unsplash.com/300x200/?laptop" alt="Studying" />
        <img src="https://source.unsplash.com/300x200/?campus" alt="Campus" />
        <img src="https://source.unsplash.com/300x200/?library" alt="Library" />
      </div>
      <div className="about-text">
        <h2>About Us</h2>
        <p>
          StudentLife empowers students to balance academics, personal goals, and finances through
          smart scheduling and goal tracking, turning time into a manageable resource.
        </p>
        <span className="more-link">More About Us →</span>
      </div>
    </section>
  );
}

export default AboutSection;
