import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Import Bootstrap components (optional but recommended for modals)
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
// import './SignInModal.css'; // CSS might not be needed if using react-bootstrap

// Using react-bootstrap Modal for easier handling
function SignInModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // Clear form on success before closing
      setEmail('');
      setPassword('');
      onClose(); // Close modal on successful login
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Incorrect email or password.");
      } else {
        setError("Login failed. Please try again.");
      }
      console.error("Sign in error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reset form state when modal is closed/opened
  const handleExited = () => {
      setEmail('');
      setPassword('');
      setError('');
      setLoading(false);
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered onExited={handleExited}>
      <Modal.Header closeButton>
        <Modal.Title>Sign In</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="signInEmail">
            <Form.Label>Email address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="signInPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </Form.Group>
          <div className="d-grid gap-2 d-sm-flex justify-content-sm-end">
             <Button variant="secondary" onClick={onClose} disabled={loading}>
                Close
             </Button>
             <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/>
                    <span className="ms-2">Signing In...</span>
                  </>
                ) : (
                  'Sign In'
                )}
             </Button>
          </div>
        </Form>
      </Modal.Body>
      {/* Footer can be removed if buttons are in body */}
      {/* <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>Close</Button>
        <Button variant="primary" type="submit" form="signInForm" disabled={loading}>
           {loading ? 'Signing In...' : 'Sign In'}
        </Button>
      </Modal.Footer> */}
    </Modal>
  );
}

export default SignInModal;

