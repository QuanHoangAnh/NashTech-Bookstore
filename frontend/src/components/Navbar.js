// frontend/src/components/Navbar.js
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import SignInModal from './SignInModal';
import './Navbar.css';

function Navbar() {
  const { getCartItemCount } = useCart();
  const { currentUser, logout, loading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const itemCount = getCartItemCount();

  const handleSignOut = () => { logout(); };
  const openSignInModal = () => { setIsModalOpen(true); };
  const closeSignInModal = () => { setIsModalOpen(false); };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmedSearchTerm = searchTerm.trim();
    if (trimmedSearchTerm) {
      navigate(`/search?q=${encodeURIComponent(trimmedSearchTerm)}`);
      setSearchTerm('');
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-sm navbar-light bg-light border-bottom">
        <div className="container-fluid">
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <img src="/logo192.png" alt="Bookworm Logo" width="30" height="30" className="d-inline-block align-top me-2" />
            BOOKWORM
          </Link>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarContent">
            <form onSubmit={handleSearchSubmit} className="d-flex me-auto">
              <div className="input-group">
                <input 
                  type="search" 
                  className="form-control form-control-sm" 
                  placeholder="Search..." 
                  aria-label="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-outline-secondary btn-sm" type="submit">
                  Search
                </button>
              </div>
            </form>

            <ul className="navbar-nav me-3">
              <li className="nav-item">
                <NavLink className="nav-link" to="/">Home</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/shop">Shop</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/about">About</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/cart">
                  Cart <span className="badge bg-secondary">{itemCount}</span>
                </NavLink>
              </li>
            </ul>

            <div className="navbar-auth d-flex align-items-center">
              {loading ? (
                <span className="navbar-text me-2">Loading...</span>
              ) : currentUser ? (
                <>
                  <span className="navbar-text me-3">
                    {currentUser.first_name} {currentUser.last_name}
                  </span>
                  <button onClick={handleSignOut} className="btn btn-outline-secondary btn-sm">Sign Out</button>
                </>
              ) : (
                <button onClick={openSignInModal} className="btn btn-outline-primary btn-sm">Sign In</button>
              )}
            </div>
          </div>
        </div>
      </nav>
      <SignInModal isOpen={isModalOpen} onClose={closeSignInModal} />
    </>
  );
}

export default Navbar;

