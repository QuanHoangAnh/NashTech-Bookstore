// src/components/PriceDisplay.js
import React from 'react';

// Helper function to format a number as currency (string with 2 decimal places)
// Kept internal to this component as it's only used here.
const formatPrice = (price) => {
    const num = parseFloat(price);
    return !isNaN(num) ? num.toFixed(2) : null; // Return null if not a valid number
};

/**
 * Reusable component to display prices, handling discounts correctly.
 * Uses Bootstrap utility classes for styling.
 * Props:
 *  - originalPrice (required): The base price of the item.
 *  - discountPrice (optional): The discounted price, if available and active.
 *  - className (optional): Additional CSS classes for the container div.
 */
function PriceDisplay({ originalPrice, discountPrice, className = '' }) {
    const formattedOPrice = formatPrice(originalPrice);
    const formattedDPrice = formatPrice(discountPrice);

    // Determine if there's a valid discount (exists, is numeric, and less than original price)
    const hasValidDiscount =
        formattedDPrice !== null &&
        formattedOPrice !== null &&
        parseFloat(formattedDPrice) < parseFloat(formattedOPrice);

    // Base classes, typically includes text alignment and margin
    const baseClassName = `product-price-display ${className}`;

    if (hasValidDiscount) {
        // If discounted, show original price struck-through and the new discount price
        return (
            <div className={baseClassName}>
                <span className="text-decoration-line-through text-muted me-2 fs-5">
                    ${formattedOPrice}
                </span>
                <span className="fw-bold text-dark fs-4">
                    ${formattedDPrice}
                </span>
            </div>
        );
    } else if (formattedOPrice !== null) {
        // If not discounted (or discount invalid), show only the original price
        return (
            <div className={`${baseClassName} fw-bold text-dark fs-4`}>
                ${formattedOPrice}
            </div>
        );
    } else {
        // If the original price is invalid or null, show N/A or similar
        return (
            <div className={`${baseClassName} text-muted`}>
                N/A
            </div>
        );
    }
}

export default PriceDisplay;