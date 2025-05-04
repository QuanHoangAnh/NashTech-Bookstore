// src/pages/CartPage.js
import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import PriceDisplay from '../components/PriceDisplay'; // *** IMPORT NEW COMPONENT ***

// Import Bootstrap components
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import './CartPage.css'; // Keep for overrides
// Import SignInModal component
import SignInModal from '../components/SignInModal';

const DEFAULT_COVER_URL = '/default-book-cover.png';

function CartPage() {
    const { cartItems, updateCartQuantity, removeFromCart, getCartTotal, clearCart, getCartItemCount } = useCart();
    const { currentUser } = useAuth(); // Need login status and potentially trigger modal
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false); // Place order loading
    const [error, setError] = useState(''); // Place order error
    // Add state for sign-in modal
    const [showSignInModal, setShowSignInModal] = useState(false);

    // Handler for +/- quantity buttons
    const handleQuantityChange = (itemId, currentQuantity, change) => {
        const newQuantity = currentQuantity + change;
        updateCartQuantity(itemId, newQuantity);
    };

    // Handler for removing item via dedicated button
    const handleRemoveItem = (itemId) => {
        removeFromCart(itemId);
    };

    // Calculates the total price for a single cart item line
    const calculateLineTotal = (item) => {
        if (!item || typeof item.quantity === 'undefined' || typeof item.price === 'undefined') return 0;
        const originalPrice = parseFloat(item.price) || 0;
        const discountPrice = item.discountPrice ? parseFloat(item.discountPrice) : null;
        const quantity = Number(item.quantity) || 0;

        const effectivePrice = (discountPrice !== null && !isNaN(discountPrice) && discountPrice < originalPrice)
            ? discountPrice
            : originalPrice;

        return effectivePrice * quantity;
    };

    // Handler for the "Place Order" button click
    const handlePlaceOrder = async () => {
        setError('');
        if (!currentUser) {
            setShowSignInModal(true); // Show sign-in modal
            return;
        }
        if (!cartItems || cartItems.length === 0) {
            setError("Your cart is empty.");
            return;
        }

        const orderData = {
            items: cartItems.map(item => ({
                book_id: item.id,
                quantity: item.quantity,
            })),
        };

        setIsLoading(true);
        try {
            const response = await apiService.createOrder(orderData);
            clearCart(); // Clear cart from context/localStorage
            alert(`Order placed successfully! Order ID: ${response.data.id}. Redirecting home...`);
            setTimeout(() => navigate('/'), 10000); // Redirect after 10 seconds
        } catch (err) {
            console.error("Order placement failed:", err);
            const errorDetail = err.response?.data?.detail || "Order placement failed. Please try again later.";
            let displayError = errorDetail;

            // Check if error contains information about unavailable items
            if (err.response?.headers?.unavailable_items) {
                const unavailableItemsStr = err.response.headers.unavailable_items;
                const unavailableItems = unavailableItemsStr.split(',').map(id => parseInt(id.trim()));
                // Remove unavailable items from cart
                unavailableItems.forEach(itemId => removeFromCart(itemId)); // Remove from context/localStorage
                displayError = `Some items were unavailable and have been removed from your cart. Please review your order. (${errorDetail})`;
            }
            setError(displayError);
        } finally {
             setIsLoading(false);
        }
    };

    const totalItemsInCart = getCartItemCount();
    const cartTotalAmount = getCartTotal();

    // Render empty cart message
    if (cartItems.length === 0 && !isLoading) {
        return (
            <div className="container text-center my-5">
                <h2>Your Cart is Empty</h2>
                <p className="text-muted">Looks like you haven't added any books yet.</p>
                <Button as={Link} to="/shop" variant="primary">Go Shopping</Button>
            </div>
        );
    }

    // Main Cart Page Render
    return (
        <div className="container my-4 cart-page-custom">
            <h2 className="mb-4">Your cart: {totalItemsInCart} item{totalItemsInCart !== 1 ? 's' : ''}</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            <div className="row g-4">
                {/* Cart Items List */}
                <div className="col-lg-8">
                    <div className="cart-items-container-custom border rounded">
                        {/* Cart Header Row (Optional but good for clarity) */}
                        <div className="cart-header-custom d-none d-md-flex p-2 bg-light border-bottom">
                            <div className="flex-grow-1">Product</div>
                            <div style={{ width: '100px' }} className="text-center">Price</div>
                            <div style={{ width: '120px' }} className="text-center">Quantity</div>
                            <div style={{ width: '100px' }} className="text-end">Total</div>
                            <div style={{ width: '50px' }}></div> {/* Spacer for remove */}
                        </div>

                        {/* Cart Items List */}
                        <div className="list-group list-group-flush">
                            {cartItems.map(item => {
                                if (!item || typeof item.id === 'undefined') return null; // Skip invalid items
                                const coverImageUrl = item.cover ? `/images/${item.cover}` : DEFAULT_COVER_URL;
                                const lineTotal = calculateLineTotal(item);

                                return (
                                    <div key={item.id} className="list-group-item p-3 cart-item-custom">
                                        <div className="row align-items-center g-3">
                                            {/* Product Column */}
                                            <div className="col-md-5 d-flex align-items-center">
                                                <img src={coverImageUrl} alt={item.title || 'Book cover'} onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_COVER_URL; }} className="img-fluid me-3 cart-item-image-custom" />
                                                <div>
                                                    <Link to={`/books/${item.id}`} className="fw-bold text-dark text-decoration-none" target="_blank" rel="noopener noreferrer">
                                                        {item.title || 'Unknown Title'}
                                                    </Link>
                                                    <small className="d-block text-muted">{item.authorName || 'Unknown Author'}</small>
                                                </div>
                                            </div>

                                            {/* Price Column */}
                                            <div className="col-6 col-md-2 text-md-center">
                                                <span className="d-md-none small text-muted">Price: </span>
                                                {/* *** USE NEW COMPONENT *** */}
                                                <PriceDisplay
                                                    originalPrice={item.price} // Original price stored in cart item
                                                    discountPrice={item.discountPrice} // Discount price stored in cart item
                                                    className="justify-content-center justify-content-md-center" // Center align
                                                />
                                            </div>

                                            {/* Quantity Column */}
                                            <div className="col-6 col-md-2">
                                                <span className="d-md-none small text-muted">Qty: </span>
                                                <InputGroup size="sm" className="quantity-input-cart">
                                                    <Button variant="outline-secondary" onClick={() => handleQuantityChange(item.id, item.quantity, -1)} disabled={item.quantity <= 1 || isLoading}>–</Button>
                                                    <Form.Control type="text" readOnly value={item.quantity || 1} className="text-center" aria-label="Item quantity" />
                                                    <Button variant="outline-secondary" onClick={() => handleQuantityChange(item.id, item.quantity, 1)} disabled={item.quantity >= 8 || isLoading}>+</Button>
                                                </InputGroup>
                                            </div>

                                            {/* Total Column */}
                                            <div className="col-6 col-md-2 text-md-end">
                                                <span className="d-md-none small text-muted">Total: </span>
                                                <span className="fw-bold">${(lineTotal || 0).toFixed(2)}</span>
                                            </div>

                                            {/* Remove Column */}
                                            <div className="col-6 col-md-1 text-md-center text-end">
                                                <Button variant="outline-danger" size="sm" onClick={() => handleRemoveItem(item.id)} disabled={isLoading} aria-label={`Remove ${item.title}`} className="remove-button-custom">
                                                    × {/* Use times symbol */}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Cart Summary */}
                <div className="col-lg-4">
                    <div className="border rounded p-3 bg-light cart-summary-custom">
                        <h3 className="text-center border-bottom pb-2 mb-3">Cart Totals</h3>
                        <div className="d-flex justify-content-between mb-3 fs-4">
                            <span>Subtotal</span>
                            <span className="fw-bold">${(cartTotalAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="d-grid">
                            <Button variant="success" size="lg" onClick={handlePlaceOrder} disabled={isLoading || cartItems.length === 0}>
                                {isLoading ? (
                                    <> <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> <span className="ms-2">Placing Order ... </span> </>
                                ) : ( 'Place Order' )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add SignInModal */}
            <SignInModal show={showSignInModal} onHide={() => setShowSignInModal(false)} />
        </div>
    );
}

export default CartPage;