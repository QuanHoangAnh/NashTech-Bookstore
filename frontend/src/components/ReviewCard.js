import React from 'react';
import './ReviewCard.css'; // Keep for star rating styles maybe

// Simple Star Rating Display Component (using Bootstrap icons or text stars)
const StarRating = ({ rating }) => {
  const totalStars = 5;
  // Use Math.max/min to clamp rating between 0 and 5
  const validRating = Math.max(0, Math.min(totalStars, Math.round(rating || 0)));

  return (
    // Use text color utilities for stars
    <span className="star-rating-display text-warning"> {/* Use warning color (yellow) */}
      {[...Array(totalStars)].map((_, index) => (
        <span key={index}>
          {index < validRating ? '★' : '☆'} {/* Filled or empty star */}
        </span>
      ))}
    </span>
  );
};

function ReviewCard({ review }) {
  // Basic check for review data
  if (!review) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      // Consistent date format
      return new Date(dateString).toLocaleDateString('en-CA'); // YYYY-MM-DD
    } catch (e) { return dateString; }
  };

  // Use optional chaining for user data
  const userName = review.user ? `${review.user.first_name} ${review.user.last_name}`.trim() : 'Anonymous';

  return (
    // Using list-group-item structure for consistency if used in ProductPage
    <div className="list-group-item list-group-item-action flex-column align-items-start review-card-custom px-0 py-3">
      <div className="d-flex w-100 justify-content-between mb-1">
        <h5 className="mb-1 review-title-custom">{review.review_title || "Review"}</h5>
        <small className="text-muted"><StarRating rating={review.rating_start} /></small>
      </div>
      <div className="mb-2 review-meta-custom">
        <small className="text-muted">By {userName} on {formatDate(review.review_date)}</small>
      </div>
      <p className="mb-1 review-details-custom">
        {review.review_details || <span className="text-muted fst-italic">No details provided.</span>}
      </p>
    </div>
  );
}

export default ReviewCard;