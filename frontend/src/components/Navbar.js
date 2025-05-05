// src/components/Navbar.js
import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import SignInModal from './SignInModal';
import './Navbar.css';

function NavbarComponent() {
  const { getCartItemCount, saveCartToBackend } = useCart();
  const { currentUser, logout, loading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const itemCount = getCartItemCount();

  const handleSignOut = async () => { 
    if (currentUser) {
      try {
        // First save the cart if needed
        await saveCartToBackend();
      } catch (error) {
        console.error("Failed to save cart before logout:", error);
      }
    }
    // Then logout
    logout(); 
    setDropdownOpen(false);
  };
  
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const openSignInModal = () => { setIsModalOpen(true); };
  const closeSignInModal = () => { setIsModalOpen(false); };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmedSearchTerm = searchTerm.trim();
    if (trimmedSearchTerm) {
      navigate(`/shop?search=${encodeURIComponent(trimmedSearchTerm)}`);
      setSearchTerm('');
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-sm navbar-light bg-light border-bottom sticky-top">
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
                  <i className="bi bi-search"></i>
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
                <NavLink className="nav-link position-relative" to="/cart">
                  Cart
                  {itemCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {itemCount}
                      <span className="visually-hidden">items in cart</span>
                    </span>
                  )}
                </NavLink>
              </li>
            </ul>

            <div className="d-flex align-items-center">
              {loading ? (
                <div className="spinner-border spinner-border-sm text-secondary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : currentUser ? (
                <div className="dropdown" ref={dropdownRef}>
                  <button 
                    className="btn btn-sm btn-outline-secondary dropdown-toggle" 
                    type="button" 
                    onClick={toggleDropdown}
                    aria-expanded={dropdownOpen}
                  >
                    {`${currentUser.first_name} ${currentUser.last_name}`}
                  </button>
                  {dropdownOpen && (
                    <div className="dropdown-menu dropdown-menu-end show">
                      <li><Link className="dropdown-item" to="/profile" onClick={() => setDropdownOpen(false)}>Profile</Link></li>
                      <li><Link className="dropdown-item" to="/orders" onClick={() => setDropdownOpen(false)}>Orders</Link></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><button className="dropdown-item" onClick={handleSignOut}>Sign Out</button></li>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={openSignInModal} className="btn btn-sm btn-primary">Sign In</button>
              )}
            </div>
          </div>
        </div>
      </nav>
      <SignInModal isOpen={isModalOpen} onClose={closeSignInModal} />
    </>
  );
}

export default NavbarComponent;













