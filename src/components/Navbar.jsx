import React from "react";

function Navbar() {
  return (
    <nav className="navbar">
     <img src="/src/assets/logo.png" alt="StudentLife Logo" style={{ height: "40px" }} />
     <ul className="nav-links">
        <li><a href="#">Home</a></li>
        <li><a href="#">Academic</a></li>
        <li><a href="#">Calendar</a></li>
        <li><a href="#">Finance</a></li>
</ul>

    </nav>
  );
}

export default Navbar;
