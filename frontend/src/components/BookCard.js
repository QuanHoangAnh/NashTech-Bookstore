// src/components/BookCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import PriceDisplay from './PriceDisplay';
import './BookCard.css';

const DEFAULT_COVER_URL = '/default-book-cover.png';

function BookCard({ book, className = '' }) {
    if (!book) return null;

    const coverImageUrl = book.book_cover_photo
        ? `/images/${book.book_cover_photo}`
        : DEFAULT_COVER_URL;
    const authorName = book.author?.author_name || 'Unknown Author';

    return (
        <Link to={`/books/${book.id}`} className={`text-decoration-none text-reset h-100 d-block ${className}`}>
            <div className="card h-100 book-card-custom shadow-sm"> 
                <div className="book-cover-wrapper card-img-top bg-light d-flex align-items-center justify-content-center">
                    <img
                        src={coverImageUrl}
                        alt={book.book_title || "Book cover"}
                        onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_COVER_URL; }}
                        className="img-fluid book-cover-img"
                        loading="lazy"
                    />
                </div>
                <div className="card-body d-flex flex-column p-3">
                    <h5 className="card-title book-title-clamp mb-2 fw-semibold">
                        {book.book_title || "No Title"}
                    </h5>
                    <p className="card-text text-muted mb-1 small">
                        {authorName}
                    </p>
                    <div className="mt-auto pt-2">
                        <PriceDisplay 
                            originalPrice={book.book_price} 
                            discountPrice={book.discount_price}
                            className="fw-bold"
                        />
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default BookCard;





