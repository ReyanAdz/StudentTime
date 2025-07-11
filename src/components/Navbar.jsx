import React from "react";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">🎓 StudentLife</div>
      <ul className="nav-links">
        <li>Home</li>
        <li>Academic</li>
        <li>Calendar</li>
        <li>Finance</li>
      </ul>
      <div className="search">🔍</div>
    </nav>
  );
}

export default Navbar;
