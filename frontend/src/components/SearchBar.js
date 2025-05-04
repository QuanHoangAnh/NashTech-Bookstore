// frontend/src/components/SearchBar.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmedSearchTerm = searchTerm.trim();
    if (trimmedSearchTerm) {
      // Navigate to the search results page with the query parameter
      navigate(`/search?q=${encodeURIComponent(trimmedSearchTerm)}`);
      setSearchTerm(''); // Optional: clear search bar after submit
    }
  };

  return (
    <Form onSubmit={handleSearchSubmit} className="d-flex ms-auto me-3" style={{ maxWidth: '300px' }}>
       {/* Use InputGroup for button addon style */}
      <InputGroup>
        <Form.Control
          type="search"
          placeholder="Search title or author..."
          aria-label="Search Books"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="outline-secondary" type="submit" disabled={!searchTerm.trim()}>
          Search
        </Button>
      </InputGroup>
    </Form>
  );
}

export default SearchBar;