import React from 'react';
import { FaInstagram, FaTiktok } from 'react-icons/fa';
import './styles.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>
          &copy; 2025 Creado por Lucas Cenzano
        </p>
        <div className="social-links">
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a href="#" target="_blank" rel="noopener noreferrer">
            <FaInstagram className="social-icon" />
          </a>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a href="#" target="_blank" rel="noopener noreferrer">
            <FaTiktok className="social-icon" />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;