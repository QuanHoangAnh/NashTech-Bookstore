import React, { useState } from 'react';
// Import Bootstrap components
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
// import './ReviewForm.css'; // CSS might not be needed

function ReviewForm({ bookId, onSubmitReview }) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [rating, setRating] = useState(''); // Store rating value directly
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation
    if (!title.trim()) { setError('Review title is required.'); return; }
    if (!rating) { setError('Please select a rating.'); return; }
    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      setError('Rating must be between 1 and 5.'); return;
    }

    setLoading(true);
    try {
      await onSubmitReview({
        review_title: title,
        review_details: details,
        rating_start: numRating,
      });
      // Clear form on success
      setTitle('');
      setDetails('');
      setRating('');
      // Show success message
      setSuccess('Review submitted successfully!');
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      const message = err.response?.data?.detail || err.message || "Failed to submit review.";
      setError(message);
      console.error("Review submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    // No need for extra container div if used within a panel already
    <>
      <h4 className="mb-3">Write a Review</h4> {/* Adjusted heading level */}
      <Form onSubmit={handleSubmit}>
        {error && <Alert variant="danger" size="sm">{error}</Alert>}
        {success && <Alert variant="success" size="sm">{success}</Alert>}
        
        <Form.Group className="mb-3" controlId="reviewTitle">
          <Form.Label>Add a title<span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120} // Matches backend validation
            required
            disabled={loading}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="reviewDetails">
          <Form.Label>Details please! Your review helps other shoppers.</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            disabled={loading}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="reviewRating">
           <Form.Label>Select a rating star<span className="text-danger">*</span></Form.Label>
           <Form.Select
             value={rating}
             onChange={(e) => setRating(e.target.value)}
             required
             disabled={loading}
             aria-label="Select Rating"
           >
             <option value="" disabled>Select Rating</option>
             {[5, 4, 3, 2, 1].map(r => (
               <option key={r} value={r}>
                 {r} Star{r > 1 ? 's' : ''}
               </option>
             ))}
           </Form.Select>
        </Form.Group>

        <div className="d-grid">
            <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/>
                    <span className="ms-2">Submitting...</span>
                  </>
                ) : (
                  'Submit Review'
                )}
            </Button>
        </div>
      </Form>
    </>
  );
}

export default ReviewForm;
