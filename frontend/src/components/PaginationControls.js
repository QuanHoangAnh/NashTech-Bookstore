// src/components/PaginationControls.js
import React from 'react';
import Pagination from 'react-bootstrap/Pagination';

/**
 * Reusable component to render pagination controls using react-bootstrap.
 * Props:
 *  - currentPage (required): The currently active page number.
 *  - totalPages (required): The total number of pages available.
 *  - onPageChange (required): Callback function invoked with the new page number when a page link is clicked.
 *  - maxPagesToShow (optional, default 5): Max number of direct page links shown.
 *  - className (optional): Additional CSS classes for the main Pagination container.
 */
function PaginationControls({
    currentPage,
    totalPages,
    onPageChange,
    maxPagesToShow = 5, // Sensible default
    className = ''
}) {

    // Don't render pagination if there's only one page or less, or invalid totalPages
    if (totalPages <= 1 || isNaN(totalPages)) {
        return null;
    }

    let items = []; // Array to hold pagination elements

    // Ensure currentPage is within valid bounds
    const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

    // Calculate the start and end page numbers for the direct links
    let startPage = Math.max(1, validCurrentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Adjust startPage if the calculated range is smaller than maxPagesToShow (near the end)
    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // --- Build Pagination Items ---

    // 'Previous' button
    items.push(
        <Pagination.Prev
            key="prev"
            onClick={() => onPageChange(validCurrentPage - 1)}
            disabled={validCurrentPage === 1}
        />
    );

    // First page link and ellipsis if needed
    if (startPage > 1) {
        items.push(
            <Pagination.Item key={1} onClick={() => onPageChange(1)}>
                {1}
            </Pagination.Item>
        );
        // Add ellipsis if there's a gap between page 1 and startPage
        if (startPage > 2) {
            items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
        }
    }

    // Direct page number links
    for (let number = startPage; number <= endPage; number++) {
        items.push(
            <Pagination.Item
                key={number}
                active={number === validCurrentPage}
                onClick={() => onPageChange(number)}
            >
                {number}
            </Pagination.Item>
        );
    }

    // Last page link and ellipsis if needed
    if (endPage < totalPages) {
         // Add ellipsis if there's a gap between endPage and totalPages
        if (endPage < totalPages - 1) {
            items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
        }
        items.push(
            <Pagination.Item
                key={totalPages}
                onClick={() => onPageChange(totalPages)}
            >
                {totalPages}
            </Pagination.Item>
        );
    }

    // 'Next' button
    items.push(
        <Pagination.Next
            key="next"
            onClick={() => onPageChange(validCurrentPage + 1)}
            disabled={validCurrentPage === totalPages}
        />
    );

    // Return the Pagination component containing all the generated items
    return (
        <Pagination className={`justify-content-center mt-4 ${className}`}>
            {items}
        </Pagination>
    );
}

export default PaginationControls;