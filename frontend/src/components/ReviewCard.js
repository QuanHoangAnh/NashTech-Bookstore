import React from 'react';
import './ReviewCard.css';
import StarRating from './StarRating';

function ReviewCard({ review }) {
  // Basic check for review data
  if (!review) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-CA');
    } catch (e) { return dateString; }
  };

  const userName = review.user ? `${review.user.first_name} ${review.user.last_name}`.trim() : 'Anonymous';

  return (
    <div className="list-group-item list-group-item-action flex-column align-items-start review-card-custom px-0 py-3">
      <div className="d-flex w-100 justify-content-between mb-1">
        <h5 className="mb-1 review-title-custom">{review.review_title || "Review"}</h5>
        <div>
          <StarRating rating={review.rating_start || 0} />
          <small className="text-muted ms-2">({review.rating_start || 0}/5)</small>
        </div>
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




