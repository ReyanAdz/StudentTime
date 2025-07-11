import React from "react";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-left">
        <p>© 2025 Group 3. All rights reserved</p>
        <ul>
          <li>Об университете</li>
          <li>Курсы</li>
          <li>Контакты</li>
        </ul>
      </div>
      <div className="footer-right">
        <div className="socials">
          <p>📘 student.life</p>
          <p>📸 Studentlife</p>
        </div>
        <div className="email-box">
          <input type="email" placeholder="Email" />
          <button>→</button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
