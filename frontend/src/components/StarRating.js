import React from 'react';

// Simple Star Rating Display Component using text characters
// Props:
// - rating: The numerical rating value (e.g., 4.6)
// - totalStars: The total number of stars to display (defaults to 5)
const StarRating = ({ rating, totalStars = 5 }) => {
    // Clamp the rating between 0 and totalStars, then round to nearest integer
    // for determining filled stars. Use Math.max/min for clamping.
    const numberOfFilledStars = Math.max(0, Math.min(totalStars, Math.round(rating || 0)));

    return (
        // Use text-warning for Bootstrap's yellow color for filled stars
        // Use text-muted or similar for empty stars
        // Use inline-block or similar to keep stars together
        <span className="star-rating-display" aria-label={`Rating: ${rating ? rating.toFixed(1) : '0'} out of ${totalStars} stars`}>
            {[...Array(totalStars)].map((_, index) => {
                // Determine if the current star should be filled or empty
                const isFilled = index < numberOfFilledStars;
                return (
                    <span
                        key={index}
                        className={isFilled ? 'text-warning' : 'text-muted'}
                        style={{ fontSize: '1.1em', cursor: 'default' }} // Adjust style as needed
                    >
                        {isFilled ? '★' : '☆'} {/* Filled or empty star character */}
                    </span>
                );
            })}
        </span>
    );
};

export default StarRating;