// src/pages/ShopPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import apiService from '../services/api';
import BookCard from '../components/BookCard';
import Accordion from 'react-bootstrap/Accordion';
// import Pagination from 'react-bootstrap/Pagination'; // No longer needed directly
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import PaginationControls from '../components/PaginationControls'; // *** IMPORT NEW COMPONENT ***
import './ShopPage.css';

function ShopPage() {
    // Get query params from URL state if available
    const location = useLocation();
    const initialSort = location.state?.initialSort || 'on_sale_home'; // Default sort

    // State for books data
    const [books, setBooks] = useState([]);
    const [totalBooks, setTotalBooks] = useState(0);

    // State for filter options
    const [categories, setCategories] = useState([]);
    const [authors, setAuthors] = useState([]);

    // State for UI controls & loading
    const [loading, setLoading] = useState(true);
    const [loadingFilters, setLoadingFilters] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState(initialSort);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedAuthor, setSelectedAuthor] = useState(null);
    const [selectedRating, setSelectedRating] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20); // Default items per page

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
        };
        // Remove null/undefined params
        Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === undefined) delete params[key];
        });

        apiService.getBooks(params)
            .then(response => {
                setBooks(response.data.items);
                setTotalBooks(response.data.total_count);
                // If we get no items but there are items available (e.g., page too high), reset to page 1
                // This check might be less necessary if totalPages calculation is robust
                // if (response.data.items.length === 0 && response.data.total_count > 0 && currentPage !== 1) {
                //     setCurrentPage(1); // This would trigger another fetch via the dependency effect
                // }
            })
            .catch(error => {
                console.error("Error fetching books:", error);
                setError("Failed to load books. Please try again later.");
                setBooks([]); setTotalBooks(0);
            })
            .finally(() => setLoading(false));
    }, [sortBy, selectedCategory, selectedAuthor, selectedRating, currentPage, itemsPerPage]);

    // --- Fetch Filter Options Effect ---
    const fetchFilterOptions = useCallback(() => {
        setLoadingFilters(true);
        Promise.all([ apiService.getCategories(), apiService.getAuthors() ])
            .then(([catResponse, authResponse]) => {
                const sortedCategories = [...catResponse.data].sort((a, b) => a.category_name.localeCompare(b.category_name));
                setCategories(sortedCategories);
                const sortedAuthors = [...authResponse.data].sort((a, b) => a.author_name.localeCompare(b.author_name));
                setAuthors(sortedAuthors);
            })
            .catch(error => { console.error("Error fetching filter options:", error); /* Optionally set an error state */ })
            .finally(() => setLoadingFilters(false));
    }, []);

    // Initial load of filter options
    useEffect(() => { fetchFilterOptions(); }, [fetchFilterOptions]);

    // Fetch books whenever dependencies change
    useEffect(() => { fetchBooks(); }, [fetchBooks]);

    // Reset page to 1 when filters/sort/itemsPerPage change
    useEffect(() => {
        // Only reset if not already on page 1 to avoid redundant fetches
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortBy, selectedCategory, selectedAuthor, selectedRating, itemsPerPage]); // Exclude currentPage

    // --- Event Handlers ---
    const handleSortChange = (event) => { setSortBy(event.target.value); };
    const handleCategoryChange = (categoryId) => { setSelectedCategory(prev => prev === categoryId ? null : categoryId); };
    const handleAuthorChange = (authorId) => { setSelectedAuthor(prev => prev === authorId ? null : authorId); };
    const handleRatingChange = (rating) => { setSelectedRating(prev => prev === rating ? null : rating); };
    const handleItemsPerPageChange = (event) => { setItemsPerPage(Number(event.target.value)); };
    const handlePageChange = (pageNumber) => {
        // Basic validation, though PaginationControls handles most of it
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            // Scroll to top of the book list for better UX - optional
            // Consider scrolling to the top of the main content area instead of window top
            // const mainContent = document.querySelector('.col-lg-9.col-md-8'); // Adjust selector if needed
            // if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Simpler window scroll
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

    // --- REMOVED renderPagination function ---

    return (
        <div className="container my-4">
            <h2 className="mb-3 shop-title-custom">
                Books <small className="text-muted active-filters-title-custom">{getActiveFilterText()}</small>
            </h2>
            <div className="row">
                {/* Sidebar with filters */}
                <aside className="col-lg-3 col-md-4">
                    <h4 className="mb-3">Filter By</h4>
                    <Accordion defaultActiveKey={['0', '1', '2']} alwaysOpen>
                        {/* Category Filter */}
                        <Accordion.Item eventKey="0">
                            <Accordion.Header>Categories</Accordion.Header>
                            <Accordion.Body className="py-2 px-3">
                                {loadingFilters ? ( <div className="text-center py-2"><Spinner animation="border" size="sm" /></div> )
                                : ( <div className="d-flex flex-column gap-1 filter-list-custom"> {categories.map(category => ( <div key={category.id} className={`list-group-item ${selectedCategory === category.id ? 'active' : ''}`} onClick={() => handleCategoryChange(category.id)}> {category.category_name} </div> ))} </div> )}
                            </Accordion.Body>
                        </Accordion.Item>
                        {/* Author Filter */}
                         <Accordion.Item eventKey="1">
                             <Accordion.Header>Authors</Accordion.Header>
                             <Accordion.Body className="py-2 px-3">
                                 {loadingFilters ? ( <div className="text-center py-2"><Spinner animation="border" size="sm" /></div> )
                                 : ( <div className="d-flex flex-column gap-1 filter-list-custom"> {authors.map(author => ( <div key={author.id} className={`list-group-item ${selectedAuthor === author.id ? 'active' : ''}`} onClick={() => handleAuthorChange(author.id)}> {author.author_name} </div> ))} </div> )}
                             </Accordion.Body>
                         </Accordion.Item>
                        {/* Rating Filter */}
                         <Accordion.Item eventKey="2">
                             <Accordion.Header>Rating</Accordion.Header>
                             <Accordion.Body className="py-2 px-3">
                                 <div className="d-flex flex-column gap-1 filter-list-custom rating-list-custom">
                                     {[5, 4, 3, 2, 1].map(rating => ( <div key={rating} className={`list-group-item ${selectedRating === rating ? 'active' : ''}`} onClick={() => handleRatingChange(rating)}> {rating}+ Stars </div> ))}
                                 </div>
                             </Accordion.Body>
                         </Accordion.Item>
                    </Accordion>
                </aside>

                {/* Main Content */}
                <main className="col-lg-9 col-md-8">
                    {/* Top Control Bar */}
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 border-bottom pb-2 gap-2 shop-controls">
                        <div className="text-muted small pagination-info">
                            {loading ? 'Loading...' : totalBooks > 0 ? `Showing ${firstItemIndex}–${lastItemIndex} of ${totalBooks} books` : 'No books found'}
                        </div>
                        <div className="d-flex gap-2">
                            <select aria-label="Sort by" value={sortBy} onChange={handleSortChange} className="form-select form-select-sm">
                                <option value="on_sale_home">Sort by: On Sale</option>
                                <option value="popularity">Sort by: Popularity</option>
                                <option value="recommended">Sort by: Highest Rated</option>
                                <option value="price_asc">Sort by: Price Low to High</option>
                                <option value="price_desc">Sort by: Price High to Low</option>
                            </select>
                            <select aria-label="Items per page" value={itemsPerPage} onChange={handleItemsPerPageChange} className="form-select form-select-sm">
                                {[5, 15, 20, 25].map(num => ( <option key={num} value={num}>Show {num}</option> ))}
                            </select>
                        </div>
                    </div>

                    {/* Book List */}
                    {loading ? ( <div className="text-center p-5"><Spinner animation="border" role="status"><span className="visually-hidden">Loading books...</span></Spinner></div> )
                    : error ? ( <Alert variant="danger">{error}</Alert> )
                    : (
                        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-3 g-3 book-list">
                            {books.length > 0 ? (
                                books.map(book => ( <div className="col" key={book.id}> <BookCard book={book} /> </div> ))
                            ) : ( <div className="col-12"> <p className="text-center text-muted mt-4">No books found matching your criteria.</p> </div> )}
                        </div>
                    )}

                    {/* *** USE NEW PAGINATION COMPONENT *** */}
                    {!loading && !error && totalBooks > 0 && (
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}

export default ShopPage;