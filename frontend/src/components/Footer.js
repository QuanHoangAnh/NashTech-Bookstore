// src/components/Footer.js
import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="app-footer bg-light border-top mt-auto py-4">
      <div className="container-fluid footer-content">
        <div className="footer-left">
          <div className="d-flex align-items-center gap-3 mb-3">
            <img src="/logo192.png" alt="Bookworm Logo" width="64" height="64" className="footer-logo" />
            <span className="fw-bold fs-5">BOOKWORM</span>
          </div>
          <div className="text-secondary">
            <p className="mb-1">170 7th Avenue South, Perry Street</p>
            <p className="mb-0">+1 415-362-8193</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
