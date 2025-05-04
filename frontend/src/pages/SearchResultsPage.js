// frontend/src/pages/SearchResultsPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom'; // Hook to get URL query params
import apiService from '../services/api';
import BookCard from '../components/BookCard';
import PaginationControls from '../components/PaginationControls';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const ITEMS_PER_PAGE = 20; // Or make configurable

function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = useMemo(() => searchParams.get('q') || '', [searchParams]); // Get search query 'q'

  const [books, setBooks] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch results when query or page changes
    if (!query) {
        setBooks([]);
        setTotalBooks(0);
        setError('Please enter a search term.');
        return; // Don't fetch if query is empty
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          skip: (currentPage - 1) * ITEMS_PER_PAGE,
          limit: ITEMS_PER_PAGE,
        };
        const response = await apiService.searchBooks(query, params);
        setBooks(response.data.items || []);
        setTotalBooks(response.data.total_count || 0);
         if (response.data.total_count === 0) {
            setError(`No books found matching "${query}".`);
        }
      } catch (err) {
        console.error("Error fetching search results:", err);
        setError("Failed to fetch search results. Please try again later.");
        setBooks([]);
        setTotalBooks(0);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, currentPage]); // Re-fetch when query or page changes

  const totalPages = Math.max(1, Math.ceil(totalBooks / ITEMS_PER_PAGE));

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
       window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll top on page change
    }
  };

  return (
    <Container>
      <h2 className="mb-4">Search Results for "{query}"</h2>

      {loading && (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}

      {error && !loading && <Alert variant="warning">{error}</Alert>}

      {!loading && !error && books.length > 0 && (
        <>
          <Row xs={1} sm={2} md={3} lg={4} className="g-4 mb-4">
            {books.map(book => (
              <Col key={book.id} className="d-flex align-items-stretch">
                {/* Ensure BookCard takes the full book object */}
                <BookCard book={book} />
              </Col>
            ))}
          </Row>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
       {/* Message moved to error state handling above */}
       {/* {!loading && !error && books.length === 0 && totalBooks === 0 && query && (
        <Alert variant="info">No books found matching "{query}".</Alert>
      )} */}
    </Container>
  );
}

export default SearchResultsPage;