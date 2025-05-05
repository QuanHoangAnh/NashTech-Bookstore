// src/components/SearchBar.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
// Removed unused import: import InputGroup from 'react-bootstrap/InputGroup';

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchTerm.trim()) {
      // Update to use 'search' parameter to match backend expectation
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    // Using d-flex for layout instead of InputGroup here
    <Form onSubmit={handleSearch} className="d-flex">
      <Form.Control
        type="search"
        placeholder="Search title or author..."
        className="me-2" // Margin end for spacing
        aria-label="Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Button variant="outline-success" type="submit">
        Search
      </Button>
    </Form>
  );
}

export default SearchBar;
