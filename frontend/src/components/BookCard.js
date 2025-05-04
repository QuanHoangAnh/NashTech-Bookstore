// src/components/BookCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import PriceDisplay from './PriceDisplay'; // *** IMPORT NEW COMPONENT ***
import './BookCard.css'; // Keep for overrides like title clamp

const DEFAULT_COVER_URL = '/default-book-cover.png';

function BookCard({ book }) {
    if (!book) return null; // Add basic check

    const coverImageUrl = book.book_cover_photo
        ? `/images/${book.book_cover_photo}` // Assuming images are served from /images
        : DEFAULT_COVER_URL;
    const authorName = book.author?.author_name || 'Unknown Author';

    return (
        // Link wraps the whole card for better click area
        <Link to={`/books/${book.id}`} className="text-decoration-none text-reset h-100">
            <div className="card h-100 book-card-custom"> {/* Use Bootstrap card and height utility + custom class */}
                <div className="book-cover-wrapper card-img-top bg-light d-flex align-items-center justify-content-center">
                    <img
                        src={coverImageUrl}
                        alt={book.book_title || "Book cover"}
                        onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_COVER_URL; }}
                        className="img-fluid book-cover-img" // Added img-fluid class
                    />
                </div>
                <div className="card-body d-flex flex-column p-3"> {/* Standardized padding */}
                    <h5 className="card-title book-title-clamp mb-2"> {/* Standardized margin */}
                        {book.book_title || "No Title"}
                    </h5>
                    <p className="card-subtitle text-muted small mb-3"> {/* Standardized margin */}
                        {authorName}
                    </p>
                    <div className="mt-auto text-end book-price-section"> {/* Push price to bottom right */}
                         {/* *** USE NEW COMPONENT *** */}
                        <PriceDisplay
                            originalPrice={book.book_price}
                            discountPrice={book.discount_price} // Pass discount price from book data
                        />
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default BookCard;