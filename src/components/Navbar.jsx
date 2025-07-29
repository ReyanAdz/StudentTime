import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={navStyle}>
      <div style={logoContainer}>
        <img src="/src/assets/logo.png" alt="StudentTime Logo" style={logoStyle} />
        <span style={titleStyle}>StudentTime</span>
      </div>

      <ul style={linkListStyle}>
        <li><Link to="/calendar" style={linkStyle}>Calandar</Link></li>
        <li><Link to="/finance" style={linkStyle}>Finances</Link></li>
      </ul>
    </nav>
  );
}

const navStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1rem 2rem",
  backgroundColor: "#fff",
  borderBottom: "1px solid #eee",
};

const logoContainer = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const logoStyle = {
  height: "36px",
};

const titleStyle = {
  fontSize: "1.25rem",
  fontWeight: "600",
};

const linkListStyle = {
  listStyle: "none",
  display: "flex",
  gap: "1.5rem",
  margin: 0,
  padding: 0,
};

const linkStyle = {
  textDecoration: "none",
  color: "#333",
  fontWeight: "500",
};

export default Navbar;
