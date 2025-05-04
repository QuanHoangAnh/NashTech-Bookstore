// src/pages/ProductPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../services/api'; // Service for API calls
import { useCart } from '../contexts/CartContext'; // Context for cart operations
import { useAuth } from '../contexts/AuthContext'; // Context for user authentication status
import ReviewCard from '../components/ReviewCard'; // Component to display a single review
import ReviewForm from '../components/ReviewForm'; // Component for submitting a new review
import StarRating from '../components/StarRating'; // Component to display star ratings visually
import PriceDisplay from '../components/PriceDisplay'; // Reusable price component
import PaginationControls from '../components/PaginationControls'; // Reusable pagination component

// Import necessary Bootstrap components for UI elements
import Spinner from 'react-bootstrap/Spinner'; // Loading indicator
import Alert from 'react-bootstrap/Alert'; // For displaying errors or messages
import Button from 'react-bootstrap/Button'; // Standard buttons
import Form from 'react-bootstrap/Form'; // For form elements like Select dropdown
import InputGroup from 'react-bootstrap/InputGroup'; // For quantity input styling
import ProgressBar from 'react-bootstrap/ProgressBar'; // For visualizing star rating distribution

// Import custom CSS for page-specific styling
import './ProductPage.css';

// Define the path to the default cover image (ensure this file exists in the public folder)
const DEFAULT_COVER_URL = '/default-book-cover.png';

// --- Product Page Component ---
export default function ProductPage() {
    const { bookId } = useParams();
    const { addToCart } = useCart();
    const { currentUser } = useAuth();

    // --- State Variables ---
    const [book, setBook] = useState(null);
    const [loadingBook, setLoadingBook] = useState(true);
    const [errorBook, setErrorBook] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addCartSuccessMessage, setAddCartSuccessMessage] = useState('');

    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [errorReviews, setErrorReviews] = useState(null);
    const [reviewSortBy, setReviewSortBy] = useState('date_desc');
    const [totalReviews, setTotalReviews] = useState(0);
    const [averageRating, setAverageRating] = useState(0);
    const [ratingCounts, setRatingCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    const [reviewCurrentPage, setReviewCurrentPage] = useState(1);
    // Use const as setReviewsPerPage is not used
    const reviewsPerPage = 10; // Can be made configurable if needed via props or context later
    const [selectedRatingFilter, setSelectedRatingFilter] = useState(null);

    // --- Data Fetching Effects ---
    useEffect(() => {
        // Fetch book details
        setLoadingBook(true); setErrorBook(null); setAddCartSuccessMessage('');
        apiService.getBookById(bookId)
            .then(response => setBook(response.data))
            .catch(err => { console.error("Error fetching book:", err); setErrorBook(err.response?.status === 404 ? 'Book not found.' : 'Failed to load book details. Please try again.'); })
            .finally(() => setLoadingBook(false));
    }, [bookId]);

    const fetchReviews = useCallback(() => {
        // Fetch reviews
        setLoadingReviews(true); setErrorReviews(null);
        const params = {
            sort_by: reviewSortBy,
            skip: (reviewCurrentPage - 1) * reviewsPerPage,
            limit: reviewsPerPage,
            // Fix Eslint: Remove space after ...
            ...(selectedRatingFilter !== null && { rating: selectedRatingFilter })
        };
        apiService.getReviewsForBook(bookId, params)
            .then(response => {
                // Assuming backend returns only array for now
                const data = response.data;
                 if (Array.isArray(data)) {
                    setReviews(data);
                    // WARNING: Needs backend total count for accurate pagination
                    setTotalReviews(data.length); // Placeholder

                    if (data.length > 0) {
                        const sum = data.reduce((acc, review) => acc + review.rating_start, 0);
                        setAverageRating(sum / data.length);
                        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                        data.forEach(review => { const r = review.rating_start; if (r >= 1 && r <= 5) counts[r]++; });
                        setRatingCounts(counts);
                    } else {
                        setAverageRating(0); setRatingCounts({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
                        if (reviewCurrentPage === 1 && selectedRatingFilter === null) { setTotalReviews(0); }
                    }
                } else { /* handle unexpected format */ }
            })
            .catch(err => { console.error("Error fetching reviews:", err); setErrorReviews('Failed to load reviews. Please try again.'); setReviews([]); setTotalReviews(0); setAverageRating(0); setRatingCounts({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }); })
            .finally(() => setLoadingReviews(false));
    }, [bookId, reviewSortBy, reviewCurrentPage, reviewsPerPage, selectedRatingFilter]);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    // Reset page to 1 when filters/sort change
    useEffect(() => {
        if (reviewCurrentPage !== 1) {
            setReviewCurrentPage(1);
        }
        // Fix Eslint: Add reviewCurrentPage to dependency array
    }, [reviewSortBy, selectedRatingFilter, reviewCurrentPage]);

    // --- Event Handlers ---
    const handleQuantityChange = (delta) => { setQuantity(prev => { const n = prev + delta; return n < 1 ? 1 : n > 8 ? 8 : n; }); };
    const handleAdd = () => {
        if (!book) return;
        const bookDataForCart = { id: book.id, title: book.book_title, authorName: book.author?.author_name || 'Unknown Author', price: book.book_price, discountPrice: book.discount_price, cover: book.book_cover_photo };
        addToCart(bookDataForCart, quantity);
        const successMsg = `${quantity} x "${bookDataForCart.title || 'Item'}" added to cart!`;
        setAddCartSuccessMessage(successMsg);
        setTimeout(() => { setAddCartSuccessMessage(''); }, 3000);
    };
    const submitReview = async (reviewData) => {
        try {
            await apiService.createReview(bookId, reviewData);
            if (reviewCurrentPage !== 1 && reviewSortBy === 'date_desc') { setReviewCurrentPage(1); } else { fetchReviews(); }
        } catch (error) { console.error("Review submission failed in ProductPage:", error); throw error; }
    };
    const handleRatingFilterClick = (rating) => { setSelectedRatingFilter(prev => prev === rating ? null : rating); };
    const handleShowAllReviews = () => { setSelectedRatingFilter(null); };
    const handleReviewPageChange = (pageNumber) => {
        const totalPagesCalc = Math.ceil(totalReviews / reviewsPerPage);
        if (pageNumber >= 1 && pageNumber <= totalPagesCalc) { setReviewCurrentPage(pageNumber); }
        else if (pageNumber === 1) { setReviewCurrentPage(1); }
    };

    // --- Main Render Logic ---
    if (loadingBook) { return ( <div className="container text-center p-5"><Spinner animation="border" role="status"><span className="visually-hidden">Loading book details...</span></Spinner></div> ); }
    if (errorBook) { return <Alert variant="danger" className="container mt-4">{errorBook}</Alert>; }
    if (!book) { return <Alert variant="warning" className="container mt-4">Book data not available.</Alert>; }

    // Prepare derived data
    const authorName = book.author?.author_name || 'Unknown Author';
    const categoryName = book.category?.category_name || 'Uncategorized';
    const coverUrl = book.book_cover_photo ? `/images/${book.book_cover_photo}` : DEFAULT_COVER_URL;
    // Calculate total pages for reviews based on current state (see WARNING in fetchReviews)
    const reviewTotalPages = Math.ceil(totalReviews / reviewsPerPage);

    // --- Return JSX ---
    return (
        <div className="container my-4 product-page-custom">
            {/* Category Heading */}
            <h2 className="text-muted border-bottom pb-2 mb-4">{categoryName}</h2>

            {/* Main Product Info Row */}
            <div className="row g-4 mb-5">
                 {/* Left Panel: Image & Details */}
                 <div className="col-lg-8">
                     <div className="row g-4">
                         <div className="col-md-5 text-center">
                             <img src={coverUrl} alt={book.book_title || "Book cover"} onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_COVER_URL; }} className="img-fluid rounded border product-image-custom" />
                         </div>
                         <div className="col-md-7">
                             <h1>{book.book_title}</h1>
                             <p className="text-muted fs-5 mb-3">By {authorName}</p>
                             <p className="product-description-custom">{book.book_summary || 'No description available.'}</p>
                         </div>
                     </div>
                 </div>
                 {/* Right Panel: Price & Add to Cart */}
                 <div className="col-lg-4">
                     <div className="border rounded p-3 bg-light product-order-panel-custom">
                         <PriceDisplay originalPrice={book.book_price} discountPrice={book.discount_price} className="text-end mb-3" />
                         <InputGroup className="mb-3 quantity-input-custom justify-content-center">
                             <Button variant="outline-secondary" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>–</Button>
                             <Form.Control type="text" readOnly value={quantity} className="text-center" style={{ width: '50px', minWidth: '50px', fontWeight: 'bold', color: '#212529', backgroundColor: '#fff' }} aria-label="Quantity" />
                             <Button variant="outline-secondary" onClick={() => handleQuantityChange(1)} disabled={quantity >= 8}>+</Button>
                         </InputGroup>
                         {addCartSuccessMessage && ( <Alert variant="success" className="mt-2 mb-3 py-2 px-3 small text-center">{addCartSuccessMessage}</Alert> )}
                         <div className="d-grid"> <Button variant="dark" size="lg" onClick={handleAdd}>Add to cart</Button> </div>
                     </div>
                 </div>
            </div>

            {/* Reviews Section */}
            <section className="customer-reviews-section-custom border-top pt-4">
                 <h2> Customer Reviews {selectedRatingFilter !== null && ( <small className="text-muted ms-2 active-filter-text">(Filtered by {selectedRatingFilter} star)</small> )} </h2>
                 <div className="row g-4">
                     {/* Left Panel: Review Summary, Filters, List, Pagination */}
                     <div className="col-md-7">
                         {/* Review Summary Block */}
                         <div className="mb-3 d-flex flex-wrap justify-content-between align-items-center review-summary-block">
                             <div className="me-3 mb-2 mb-md-0"> <strong className="me-2">Average:</strong> <StarRating rating={averageRating} /> <span className="ms-2 text-muted">({averageRating.toFixed(1)} / 5)</span> </div>
                             <Button variant="link" size="sm" onClick={handleShowAllReviews} className="text-muted p-0 text-decoration-none"> {totalReviews} Review{totalReviews !== 1 ? 's' : ''} </Button>
                         </div>
                         {/* Review Counts Per Star */}
                         <div className="mb-3 review-star-counts">
                             {[5, 4, 3, 2, 1].map(star => (
                                 <div key={star} className={`d-flex align-items-center count-row mb-1 filter-row ${selectedRatingFilter === star ? 'active-filter' : ''}`} onClick={() => handleRatingFilterClick(star)} style={{ cursor: 'pointer' }} role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && handleRatingFilterClick(star)} aria-label={`Filter by ${star} star reviews`}>
                                     <span className="star-label me-2 text-nowrap" style={{minWidth: '50px'}}>{star} star</span>
                                     <ProgressBar now={totalReviews > 0 ? (ratingCounts[star] / totalReviews * 100) : 0} variant="warning" className="flex-grow-1 me-2" style={{height: '8px'}} aria-label={`${ratingCounts[star]} reviews with ${star} stars`} />
                                     <span className="count text-muted">({ratingCounts[star]})</span>
                                 </div>
                             ))}
                         </div>
                         {/* Sort Dropdown */}
                         <div className="d-flex justify-content-end mb-3">
                             <Form.Select size="sm" value={reviewSortBy} onChange={e => setReviewSortBy(e.target.value)} aria-label="Sort reviews by" style={{ maxWidth: '180px' }}>
                                 <option value="date_desc">Sort by: Newest first</option>
                                 <option value="date_asc">Sort by: Oldest first</option>
                             </Form.Select>
                         </div>
                         {/* Review List & Pagination */}
                         {loadingReviews ? ( <div className="text-center p-4"><Spinner animation="border" size="sm" /></div> )
                           : errorReviews ? ( <Alert variant="warning">{errorReviews}</Alert> )
                           : reviews.length > 0 ? (
                               <>
                                   <div className="list-group review-list-custom"> {reviews.map(review => ( <ReviewCard key={review.id} review={review} /> ))} </div>
                                   {/* Use PaginationControls component */}
                                   <PaginationControls
                                       currentPage={reviewCurrentPage}
                                       totalPages={reviewTotalPages} // Use calculated total pages
                                       onPageChange={handleReviewPageChange}
                                   />
                               </>
                           )
                           : ( <p className="text-muted text-center mt-3"> {selectedRatingFilter !== null ? `No reviews found matching ${selectedRatingFilter} star.` : `No reviews yet. Be the first to review!`} </p> )}
                     </div>
                     {/* Right Panel: Review Form */}
                     {currentUser && ( <div className="col-md-5"> <div className="border rounded p-3 bg-light review-form-panel-custom"> <ReviewForm bookId={parseInt(bookId, 10)} onSubmitReview={submitReview} /> </div> </div> )}
                 </div>
             </section>
        </div>
    );
}