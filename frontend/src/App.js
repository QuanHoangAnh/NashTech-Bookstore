// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Import Components
// Make sure Navbar component name matches export (AppNavbar)
import AppNavbar from './components/Navbar';
import Footer from './components/Footer'; // Assuming Footer component exists

// Import Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import AboutPage from './pages/AboutPage';
import SearchResultsPage from './pages/SearchResultsPage'; // Import the new page

import './App.css'; // Keep for minimal global app styles

function App() {
  return (
    // Use d-flex flex-column vh-100 for sticky footer effect if needed
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <AppNavbar /> {/* Use the renamed Navbar component */}
        <main className="flex-grow-1"> {/* Allow main content to grow */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/books/:bookId" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/search" element={<SearchResultsPage />} /> {/* Add search route */}
            {/* Optional: Add a 404 Not Found route */}
            {/* <Route path="*" element={<NotFoundPage />} /> */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;