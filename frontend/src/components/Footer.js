// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="app-footer bg-light border-top mt-auto py-4">
      <div className="container-fluid px-0">
        <div className="row g-0">
          <div className="col-md-6 ps-0 mb-4 mb-md-0">
            <div className="ms-0 ps-3 d-flex align-items-center gap-3 mb-3">
              <img src="/logo192.png" alt="Bookworm Logo" width="64" height="64" className="footer-logo" />
              <span className="fw-bold fs-5">BOOKWORM</span>
            </div>
            <div className="text-secondary" style={{ paddingLeft: "calc(64px + 1rem)" }}>
              <p className="mb-1">170 7th Avenue South, Perry Street</p>
              <p className="mb-0">+1 415-362-8193</p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="row">
              <div className="col-6">
                <h5 className="mb-3">Quick Links</h5>
                <ul className="list-unstyled">
                  <li className="mb-2"><Link to="/" className="text-decoration-none text-secondary">Home</Link></li>
                  <li className="mb-2"><Link to="/shop" className="text-decoration-none text-secondary">Shop</Link></li>
                  <li className="mb-2"><Link to="/about" className="text-decoration-none text-secondary">About</Link></li>
                </ul>
              </div>
              <div className="col-6">
                <h5 className="mb-3">Follow Us</h5>
                <div className="d-flex gap-3">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-secondary fs-5" aria-label="Facebook"><i className="bi bi-facebook"></i></a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-secondary fs-5" aria-label="Twitter"><i className="bi bi-twitter"></i></a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-secondary fs-5" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row mt-4 pt-3 border-top">
          <div className="col-12 text-center">
            <p className="text-muted mb-0">© {new Date().getFullYear()} Bookworm. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;





