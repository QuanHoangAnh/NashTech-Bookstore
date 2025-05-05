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

// Import necessary Bootstrap components for UI elements
import Spinner from 'react-bootstrap/Spinner'; // Loading indicator
import Alert from 'react-bootstrap/Alert'; // For displaying errors or messages
import Button from 'react-bootstrap/Button'; // Standard buttons
import Form from 'react-bootstrap/Form'; // For form elements like Select dropdown
import InputGroup from 'react-bootstrap/InputGroup'; // For quantity input styling

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
    const [reviewsPerPage, setReviewsPerPage] = useState(10);
    const [selectedRatingFilter, setSelectedRatingFilter] = useState(null);
    const [paginationInfo, setPaginationInfo] = useState({
        startIndex: 0,
        endIndex: 0,
        total: 0
    });

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
            ...(selectedRatingFilter !== null && { rating: selectedRatingFilter })
        };
        apiService.getReviewsForBook(bookId, params)
            .then(response => {
                // Check if response has items and total_count properties
                if (response.data && typeof response.data === 'object') {
                    if (Array.isArray(response.data.items)) {
                        const totalCount = response.data.total_count || response.data.items.length;
                        setReviews(response.data.items);
                        setTotalReviews(totalCount);
                        
                        // Calculate average rating and rating counts
                        if (response.data.items.length > 0) {
                            // Calculate average rating
                            const sum = response.data.items.reduce((acc, review) => acc + (review.rating_start || 0), 0);
                            const avg = sum / response.data.items.length;
                            setAverageRating(avg);
                            
                            // Calculate rating counts
                            const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                            response.data.items.forEach(review => {
                                const rating = review.rating_start || 0;
                                if (rating >= 1 && rating <= 5) {
                                    counts[rating]++;
                                }
                            });
                            setRatingCounts(counts);
                        } else {
                            setAverageRating(0);
                            setRatingCounts({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
                        }
                        
                        // Update pagination info using totalCount from response
                        const startIndex = (totalCount > 0) ? (reviewCurrentPage - 1) * reviewsPerPage + 1 : 0;
                        const endIndex = Math.min(reviewCurrentPage * reviewsPerPage, totalCount);
                        setPaginationInfo({
                            startIndex,
                            endIndex,
                            total: totalCount
                        });
                    } else if (Array.isArray(response.data)) {
                        // Fallback for array-only response
                        setReviews(response.data);
                        setTotalReviews(response.data.length);
                        
                        // Calculate average rating and rating counts for array response
                        if (response.data.length > 0) {
                            // Calculate average rating
                            const sum = response.data.reduce((acc, review) => acc + (review.rating_start || 0), 0);
                            const avg = sum / response.data.length;
                            setAverageRating(avg);
                            
                            // Calculate rating counts
                            const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                            response.data.forEach(review => {
                                const rating = review.rating_start || 0;
                                if (rating >= 1 && rating <= 5) {
                                    counts[rating]++;
                                }
                            });
                            setRatingCounts(counts);
                        } else {
                            setAverageRating(0);
                            setRatingCounts({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
                        }
                        
                        // Update pagination info
                        const startIndex = response.data.length > 0 ? (reviewCurrentPage - 1) * reviewsPerPage + 1 : 0;
                        const endIndex = Math.min(reviewCurrentPage * reviewsPerPage, response.data.length);
                        setPaginationInfo({
                            startIndex,
                            endIndex,
                            total: response.data.length
                        });
                    }
                }
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
    }, [reviewSortBy, selectedRatingFilter, reviewsPerPage, reviewCurrentPage]);

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
    const handleReviewPageChange = (pageNumber) => {
        const totalPagesCalc = Math.ceil(totalReviews / reviewsPerPage);
        if (pageNumber >= 1 && pageNumber <= totalPagesCalc) { setReviewCurrentPage(pageNumber); }
        else if (pageNumber === 1) { setReviewCurrentPage(1); }
    };
    const handleReviewsPerPageChange = (event) => {
        setReviewsPerPage(Number(event.target.value));
        if (reviewCurrentPage !== 1) {
            setReviewCurrentPage(1);
        }
    };

    // --- Main Render Logic ---
    if (loadingBook) { return ( <div className="container text-center p-5"><Spinner animation="border" role="status"><span className="visually-hidden">Loading book details...</span></Spinner></div> ); }
    if (errorBook) { return <Alert variant="danger" className="container mt-4">{errorBook}</Alert>; }
    if (!book) { return <Alert variant="warning" className="container mt-4">Book data not available.</Alert>; }

    // Prepare derived data
    const authorName = book.author?.author_name || 'Unknown Author';
    const categoryName = book.category?.category_name || 'Uncategorized';
    const coverUrl = book.book_cover_photo ? `/images/${book.book_cover_photo}` : DEFAULT_COVER_URL;
    // Calculate total pages for reviews
    const reviewTotalPages = Math.max(1, Math.ceil(totalReviews / reviewsPerPage));

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
                         <div className="col-md-5">
                             <div className="book-image-container">
                                 <img src={coverUrl} alt={book.book_title || "Book cover"} onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_COVER_URL; }} className="img-fluid rounded border product-image-custom" />
                                 <p className="text-muted author-credit">By <span className="fw-bold">{authorName}</span></p>
                             </div>
                         </div>
                         <div className="col-md-7">
                             <h1>{book.book_title}</h1>
                             <p className="product-description-custom">{book.book_summary || 'No description available.'}</p>
                         </div>
                     </div>
                 </div>
                 {/* Right Panel: Price & Add to Cart */}
                 <div className="col-lg-4">
                     <div className="border rounded p-3 bg-light product-order-panel-custom">
                         <PriceDisplay originalPrice={book.book_price} discountPrice={book.discount_price} className="mb-3" />
                         <div>
                             <div className="mb-1">Quantity</div>
                             <InputGroup className="mb-3">
                                 <Button variant="outline-secondary" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>–</Button>
                                 <Form.Control type="text" readOnly value={quantity} className="text-center" style={{ width: '50px', minWidth: '50px', fontWeight: 'bold', color: '#212529', backgroundColor: '#fff' }} aria-label="Quantity" />
                                 <Button variant="outline-secondary" onClick={() => handleQuantityChange(1)} disabled={quantity >= 8}>+</Button>
                             </InputGroup>
                         </div>
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
                         <div className="mb-3 d-flex flex-wrap align-items-center review-summary-block">
                             <div className="me-3 mb-2 mb-md-0"> <strong className="me-2">Average:</strong> <StarRating rating={averageRating} /> <span className="ms-2 text-muted">({averageRating.toFixed(1)} / 5)</span> </div>
                         </div>
                         {/* Review Counts Per Star - Horizontal format */}
                         <div className="mb-3 d-flex flex-wrap align-items-center">
                             <span className="me-3">({totalReviews} reviews)</span>
                             {[5, 4, 3, 2, 1].map((star, index) => (
                                 <React.Fragment key={star}>
                                     <span 
                                         className={`me-3 star-filter ${selectedRatingFilter === star ? 'active-filter' : ''}`}
                                         onClick={() => handleRatingFilterClick(star)}
                                         style={{ cursor: 'pointer' }}
                                         role="button"
                                         tabIndex={0}
                                         onKeyPress={(e) => e.key === 'Enter' && handleRatingFilterClick(star)}
                                     >
                                         {star} star ({ratingCounts[star]})
                                     </span>
                                     {index < 4 && <span className="me-3">|</span>}
                                 </React.Fragment>
                             ))}
                         </div>
                         {/* Sort Dropdown and Items Per Page */}
                         <div className="d-flex justify-content-between align-items-center mb-3">
                             <div>
                                 {reviews.length > 0 && (
                                     <span className="text-muted">
                                         Showing {paginationInfo.startIndex}-{paginationInfo.endIndex} of {totalReviews} reviews
                                     </span>
                                 )}
                             </div>
                             <div className="d-flex align-items-center">
                                 <Form.Select 
                                     size="sm" 
                                     value={reviewsPerPage} 
                                     onChange={handleReviewsPerPageChange} 
                                     aria-label="Items per page"
                                     className="me-2"
                                     style={{ maxWidth: '120px' }}
                                 >
                                     <option value={5}>Show 5</option>
                                     <option value={10}>Show 10</option>
                                     <option value={15}>Show 15</option>
                                     <option value={20}>Show 20</option>
                                     <option value={25}>Show 25</option>
                                 </Form.Select>
                                 <Form.Select 
                                     size="sm" 
                                     value={reviewSortBy} 
                                     onChange={e => setReviewSortBy(e.target.value)} 
                                     aria-label="Sort reviews by" 
                                     style={{ maxWidth: '180px' }}
                                 >
                                     <option value="date_desc">Sort by: Newest first</option>
                                     <option value="date_asc">Sort by: Oldest first</option>
                                 </Form.Select>
                             </div>
                         </div>
                         {/* Review List & Pagination */}
                         {loadingReviews ? ( <div className="text-center p-4"><Spinner animation="border" size="sm" /></div> )
                           : errorReviews ? ( <Alert variant="warning">{errorReviews}</Alert> )
                           : reviews.length > 0 ? (
                               <>
                                   <div className="list-group review-list-custom"> {reviews.map(review => ( <ReviewCard key={review.id} review={review} /> ))} </div>
                                   {/* Custom Pagination Controls */}
                                   {reviewTotalPages > 1 && (
                                       <div className="d-flex justify-content-center mt-4">
                                           <ul className="pagination">
                                               {/* Previous button */}
                                               <li className={`page-item ${reviewCurrentPage === 1 ? 'disabled' : ''}`}>
                                                   <button 
                                                       className="page-link" 
                                                       onClick={() => handleReviewPageChange(reviewCurrentPage - 1)}
                                                       disabled={reviewCurrentPage === 1}
                                                   >
                                                       Previous
                                                   </button>
                                               </li>
                                               
                                               {/* First page */}
                                               {reviewCurrentPage > 3 && (
                                                   <li className="page-item">
                                                       <button className="page-link" onClick={() => handleReviewPageChange(1)}>1</button>
                                                   </li>
                                               )}
                                               
                                               {/* Ellipsis after first page */}
                                               {reviewCurrentPage > 3 && (
                                                   <li className="page-item disabled">
                                                       <span className="page-link">...</span>
                                                   </li>
                                               )}
                                               
                                               {/* Page numbers */}
                                               {[...Array(reviewTotalPages)].map((_, i) => {
                                                   const pageNum = i + 1;
                                                   // Show current page and 1 page before and after
                                                   if (
                                                       pageNum === reviewCurrentPage ||
                                                       pageNum === reviewCurrentPage - 1 ||
                                                       pageNum === reviewCurrentPage + 1
                                                   ) {
                                                       return (
                                                           <li key={pageNum} className={`page-item ${reviewCurrentPage === pageNum ? 'active' : ''}`}>
                                                               <button 
                                                                   className="page-link" 
                                                                   onClick={() => handleReviewPageChange(pageNum)}
                                                               >
                                                                   {pageNum}
                                                               </button>
                                                           </li>
                                                       );
                                                   }
                                                   return null;
                                               })}
                                               
                                               {/* Ellipsis before last page */}
                                               {reviewCurrentPage < reviewTotalPages - 2 && (
                                                   <li className="page-item disabled">
                                                       <span className="page-link">...</span>
                                                   </li>
                                               )}
                                               
                                               {/* Last page */}
                                               {reviewCurrentPage < reviewTotalPages - 2 && (
                                                   <li className="page-item">
                                                       <button 
                                                           className="page-link" 
                                                           onClick={() => handleReviewPageChange(reviewTotalPages)}
                                                       >
                                                           {reviewTotalPages}
                                                       </button>
                                                   </li>
                                               )}
                                               
                                               {/* Next button */}
                                               <li className={`page-item ${reviewCurrentPage === reviewTotalPages ? 'disabled' : ''}`}>
                                                   <button 
                                                       className="page-link" 
                                                       onClick={() => handleReviewPageChange(reviewCurrentPage + 1)}
                                                       disabled={reviewCurrentPage === reviewTotalPages}
                                                   >
                                                       Next
                                                   </button>
                                               </li>
                                           </ul>
                                       </div>
                                   )}
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
















