import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import apiService from '../services/api';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [guestCartItems, setGuestCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem('bookwormGuestCart');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Could not parse guest cart data", error);
      return [];
    }
  });
  const [userCartItems, setUserCartItems] = useState([]);
  
  // Computed property to determine which cart to use
  const cartItems = currentUser ? userCartItems : guestCartItems;
  const setCartItems = currentUser ? setUserCartItems : setGuestCartItems;

  // Load user's cart when they log in and merge with guest cart if needed
  useEffect(() => {
    if (currentUser) {
      const handleCartMerge = async () => {
        try {
          // First fetch the user's existing cart
          const response = await apiService.getUserCart();
          const existingUserCart = response.data || [];
          
          // Check if guest cart has items to merge
          if (guestCartItems.length > 0) {
            // Create a map of existing items by book id for easy lookup
            const existingItemsMap = new Map(
              existingUserCart.map(item => [item.id, item])
            );
            
            // Merge guest items with user items
            const mergedItems = [...existingUserCart];
            
            guestCartItems.forEach(guestItem => {
              const existingItem = existingItemsMap.get(guestItem.id);
              
              if (existingItem) {
                // If item exists, update quantity (respecting max limit of 8)
                const newQuantity = Math.min(existingItem.quantity + guestItem.quantity, 8);
                existingItem.quantity = newQuantity;
              } else {
                // If item doesn't exist, add it to the merged items
                mergedItems.push(guestItem);
              }
            });
            
            // Update backend with merged cart
            await apiService.updateUserCart(mergedItems);
            
            // Set the merged cart as the user's cart
            setUserCartItems(mergedItems);
            
            // Optionally clear guest cart after successful merge
            setGuestCartItems([]);
          } else {
            // No guest items to merge, just set the user's cart
            setUserCartItems(existingUserCart);
          }
        } catch (error) {
          console.error("Failed to merge carts:", error);
          // Fallback to just fetching user cart
          fetchUserCart();
        }
      };
      
      handleCartMerge();
    }
  }, [currentUser, guestCartItems]);

  // Save guest cart to localStorage
  useEffect(() => {
    localStorage.setItem('bookwormGuestCart', JSON.stringify(guestCartItems));
  }, [guestCartItems]);

  // Fetch user's cart from backend
  const fetchUserCart = async () => {
    try {
      const response = await apiService.getUserCart();
      setUserCartItems(response.data || []);
    } catch (error) {
      console.error("Failed to fetch user cart", error);
    }
  };

  const addToCart = (itemToAdd, quantity) => {
    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity < 1 || numQuantity > 8) {
      alert("Quantity must be between 1 and 8.");
      return;
    }

    // Ensure itemToAdd has necessary fields before proceeding
    if (!itemToAdd || typeof itemToAdd.id === 'undefined' || typeof itemToAdd.price === 'undefined') {
        console.error("Invalid item data passed to addToCart:", itemToAdd);
        alert("Could not add item to cart due to invalid data.");
        return;
    }


    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === itemToAdd.id);

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = Math.min((existingItem.quantity || 0) + numQuantity, 8); // Ensure existing quantity is number

        if (newQuantity !== existingItem.quantity) {
          updatedItems[existingItemIndex] = { ...existingItem, quantity: newQuantity };
          alert(`${itemToAdd.title || 'Item'} quantity updated to ${newQuantity}.`);
          return updatedItems;
        } else {
          alert(`You already have the maximum quantity (8) of "${itemToAdd.title || 'this item'}" in your cart.`);
          return prevItems;
        }
      } else {
        const quantityToAdd = Math.min(numQuantity, 8);
        // Create the cart item structure consistently
        const newItem = {
          id: itemToAdd.id,
          title: itemToAdd.title || 'Unknown Title', // Use directly, provide fallback
          authorName: itemToAdd.authorName || 'Unknown Author', // Use directly, provide fallback
          price: itemToAdd.price, // Use directly
          discountPrice: itemToAdd.discount_price, // Use property name from ProductPage data
          cover: itemToAdd.book_cover_photo, // Use property name from ProductPage data, store as 'cover'
          quantity: quantityToAdd,
        };
        alert(`${quantityToAdd} x "${newItem.title}" added to cart!`);
        return [...prevItems, newItem];
      }
    });
  };

  const updateCartQuantity = (itemId, newQuantity) => {
    const numQuantity = Number(newQuantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const validatedQuantity = Math.max(1, Math.min(numQuantity, 8));
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: validatedQuantity } : item
      )
    );
  };

  const removeFromCart = (itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + (Number(item?.quantity) || 0), 0); // Add safety checks
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
        if (!item || typeof item.price === 'undefined' || typeof item.quantity === 'undefined') return total;

        const originalPrice = parseFloat(item.price) || 0;
        const discountPrice = item.discountPrice ? parseFloat(item.discountPrice) : null;
        const quantity = Number(item.quantity) || 0;

        const hasDiscount = discountPrice !== null && !isNaN(discountPrice) && discountPrice < originalPrice;
        const effectivePrice = hasDiscount ? discountPrice : originalPrice;

        if (isNaN(effectivePrice)) return total; // Skip if price is invalid

        return total + (effectivePrice * quantity);
    }, 0);
};

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('bookwormGuestCart'); // Fixed key
  };

  const value = {
    cartItems,
    addToCart,
    getCartItemCount,
    updateCartQuantity,
    removeFromCart,
    getCartTotal,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
