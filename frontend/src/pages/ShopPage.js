// src/pages/ShopPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import apiService from '../services/api';
import BookCard from '../components/BookCard';
import Accordion from 'react-bootstrap/Accordion';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import './ShopPage.css';

function ShopPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchTermFromUrl = searchParams.get('search');

  const initialSort = location.state?.initialSort || 'on_sale';

  // --- State Variables ---
  const [books, setBooks] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState(initialSort);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // --- Calculations for pagination display ---
  const totalPages = Math.max(1, Math.ceil(totalBooks / itemsPerPage));
  const firstItemIndex = totalBooks === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const lastItemIndex = Math.min(currentPage * itemsPerPage, totalBooks);

  // --- Fetch Books Effect ---
  const fetchBooks = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = {
      sort_by: sortBy,
      category_id: selectedCategory,
      author_id: selectedAuthor,
      min_rating: selectedRating,
      skip: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage,
      search: searchTermFromUrl || undefined,
    };
    Object.keys(params).forEach(key => {
      if (params[key] == null || params[key] === '') {
        delete params[key];
      }
    });

    apiService.getBooks(params)
      .then(response => {
        setBooks(response.data.items);
        setTotalBooks(response.data.total_count);
        const newTotalPages = Math.max(1, Math.ceil(response.data.total_count / itemsPerPage));
        if (currentPage > newTotalPages) {
            // If current page is now invalid after filtering/search, reset to 1
            setCurrentPage(1);
        }
      })
      .catch(error => {
        console.error("Error fetching books:", error);
        setError("Failed to load books. Please try again later.");
        setBooks([]);
        setTotalBooks(0);
      })
      .finally(() => setLoading(false));
  }, [sortBy, selectedCategory, selectedAuthor, selectedRating, currentPage, itemsPerPage, searchTermFromUrl]);

  // --- Fetch Filter Options Effect ---
  const fetchFilterOptions = useCallback(() => {
    setLoadingFilters(true);
    Promise.all([apiService.getCategories(), apiService.getAuthors()])
      .then(([catResponse, authResponse]) => {
        const sortedCategories = [...catResponse.data].sort((a, b) =>
          a.category_name.localeCompare(b.category_name));
        setCategories(sortedCategories);
        const sortedAuthors = [...authResponse.data].sort((a, b) =>
          a.author_name.localeCompare(b.author_name));
        setAuthors(sortedAuthors);
      })
      .catch(error => {
        console.error("Error fetching filter options:", error);
      })
      .finally(() => setLoadingFilters(false));
  }, []);

  // Initial load of filter options
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Fetch books whenever dependencies change
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Reset page to 1 when filters/sort/itemsPerPage/search change
  useEffect(() => {
    // Only reset if not already on page 1 to avoid redundant fetches
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, selectedCategory, selectedAuthor, selectedRating, itemsPerPage, searchTermFromUrl]);

  // --- Event Handlers ---
  const handleSortChange = (event) => { setSortBy(event.target.value); };
  const handleCategoryChange = (categoryId) => { setSelectedCategory(prev => prev === categoryId ? null : categoryId); };
  const handleAuthorChange = (authorId) => { setSelectedAuthor(prev => prev === authorId ? null : authorId); };
  const handleRatingChange = (rating) => { setSelectedRating(prev => prev === rating ? null : rating); };
  const handleItemsPerPageChange = (event) => { setItemsPerPage(Number(event.target.value)); };
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- Helper to display active filters ---
  const getActiveFilterText = () => {
    let filters = [];
    const cat = categories.find(c => c.id === selectedCategory);
    const auth = authors.find(a => a.id === selectedAuthor);
    if (cat) filters.push(`Category: ${cat.category_name}`);
    if (auth) filters.push(`Author: ${auth.author_name}`);
    if (selectedRating) filters.push(`Rating: ${selectedRating}+ Stars`);
    return filters.length > 0 ? `(Filtered by ${filters.join(', ')})` : '';
  };

  return (
    <Container fluid>
      <Row>
        <Col xs={12}>
          <div className="d-flex align-items-center">
            <h3 className="books-heading mt-3" style={{ paddingLeft: "0", marginLeft: "-30px" }}>Books {getActiveFilterText()}</h3>
          </div>
          <hr className="mb-4" />
        </Col>
      </Row>
      <Row>
        {/* Sidebar Filters */}
        <Col lg={3} md={4} sm={12} className="mb-4 filter-sidebar">
          <div className="sticky-top pt-3" style={{ top: '1rem', zIndex: 10 }}>
            <h4>Filter By</h4>
            <Accordion defaultActiveKey={['0']} alwaysOpen className="filter-accordion-custom">
              {/* Category Filter */}
              <Accordion.Item eventKey="0">
                <Accordion.Header>Categories</Accordion.Header>
                <Accordion.Body className="py-2 px-3 filter-scroll">
                  {loadingFilters ? <Spinner animation="border" size="sm" /> : (
                    categories.map(category => (
                      <div
                        key={category.id}
                        className={`list-group-item list-group-item-action ${selectedCategory === category.id ? 'active' : ''}`}
                        onClick={() => handleCategoryChange(category.id)}
                        style={{ cursor: 'pointer' }}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => e.key === 'Enter' && handleCategoryChange(category.id)}
                      >
                        {category.category_name}
                      </div>
                    ))
                  )}
                </Accordion.Body>
              </Accordion.Item>

              {/* Author Filter */}
              <Accordion.Item eventKey="1">
                <Accordion.Header>Authors</Accordion.Header>
                <Accordion.Body className="py-2 px-3 filter-scroll">
                  {loadingFilters ? <Spinner animation="border" size="sm" /> : (
                    authors.map(author => (
                      <div
                        key={author.id}
                        className={`list-group-item list-group-item-action ${selectedAuthor === author.id ? 'active' : ''}`}
                        onClick={() => handleAuthorChange(author.id)}
                        style={{ cursor: 'pointer' }}
                        role="button" 
                        tabIndex={0} 
                        onKeyPress={(e) => e.key === 'Enter' && handleAuthorChange(author.id)}
                      >
                        {author.author_name}
                      </div>
                    ))
                  )}
                </Accordion.Body>
              </Accordion.Item>

              {/* Rating Filter */}
              <Accordion.Item eventKey="2">
                <Accordion.Header>Rating</Accordion.Header>
                <Accordion.Body className="py-2 px-3 filter-scroll">
                  {[5, 4, 3, 2, 1].map(rating => (
                    <div
                      key={rating}
                      className={`list-group-item list-group-item-action ${selectedRating === rating ? 'active' : ''}`}
                      onClick={() => handleRatingChange(rating)}
                      style={{ cursor: 'pointer' }}
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => e.key === 'Enter' && handleRatingChange(rating)}
                    >
                      {rating}+ Stars
                    </div>
                  ))}
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </div>
        </Col>

        {/* Main Content Area */}
        <Col lg={9} md={8}>
          {searchTermFromUrl && (
            <div className="mb-4">
              <h2 className="mb-3">Search Results for "{searchTermFromUrl}"</h2>
              {totalBooks === 0 && !loading && (
                <Alert variant="warning">No books found matching "{searchTermFromUrl}".</Alert>
              )}
            </div>
          )}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
            <div className="text-muted mb-2 mb-md-0">
              {loading ? 'Loading...' : totalBooks > 0 ?
                `Showing ${firstItemIndex}–${lastItemIndex} of ${totalBooks} results` :
                (searchTermFromUrl ? 'No books found matching your search.' : 'No books found.')
              }
            </div>
            <div className="d-flex flex-wrap gap-2">
              <Form.Select size="sm" value={sortBy} onChange={handleSortChange} style={{ width: '180px' }} className="me-2" aria-label="Sort books by">
                <option value="on_sale">Sort by: On Sale</option>
                <option value="popularity">Sort by: Popularity</option>
                <option value="recommended">Sort by: Recommended</option>
                <option value="price_asc">Sort by: Price Low to High</option>
                <option value="price_desc">Sort by: Price High to Low</option>
              </Form.Select>
              <Form.Select size="sm" value={itemsPerPage} onChange={handleItemsPerPageChange} style={{ width: '100px' }} aria-label="Items per page">
                <option value={5}>Show 5</option>
                <option value={15}>Show 15</option>
                <option value={20}>Show 20</option>
                <option value={25}>Show 25</option>
              </Form.Select>
            </div>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading books...</span>
              </Spinner>
            </div>
          ) : (
            <Row xs={1} sm={2} md={2} lg={3} xl={4} className="g-4">
              {books.length > 0 ? (
                books.map(book => (
                  <Col key={book.id} className="d-flex">
                    <BookCard book={book} className="w-100 h-100" />
                  </Col>
                ))
              ) : (
                !error && <Col xs={12}><p className="text-center py-4">No books found matching your criteria.</p></Col>
              )}
            </Row>
          )}

          {!loading && !error && totalBooks > 0 && (
            <div className="d-flex justify-content-center mt-4">
              <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                {[...Array(Math.min(totalPages, 5)).keys()].map(i => {
                  const pageNumber = i + 1;
                  return (
                    <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    </li>
                  );
                })}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default ShopPage;








