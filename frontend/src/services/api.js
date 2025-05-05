// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Axios Request Interceptor (remains the same) ---
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bookwormToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Axios Response Interceptor (remains the same) ---
// Add response interceptor for token handling (e.g., redirect on 401)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Example: Basic 401 handling - redirect to login
    // More robust handling might involve trying to refresh the token
    if (error.response?.status === 401) {
      console.error("Unauthorized or expired token:", error.response);
      // Clear potentially invalid token
      localStorage.removeItem('bookwormToken');
      localStorage.removeItem('bookwormRefreshToken'); // Also clear refresh token
      // Redirect to login, maybe preserving intended location
      // Avoid infinite loops if login page itself causes 401
      if (window.location.pathname !== '/login') { // Example check
         // You might want to use react-router's navigate function here
         // if this service is used within a component context,
         // or pass a callback for navigation. window.location is simpler
         // but causes a full page reload.
         // alert("Your session has expired. Please log in again.");
         // window.location.href = '/login';
         // For now, just reject to let the caller handle it
         console.warn("Redirect to login due to 401 is commented out in api.js");
      }
    }
    return Promise.reject(error);
  }
);


// --- API Service Functions ---

// Modified getBooks to accept search param
const getBooks = (params = {}) => {
  // params can include: skip, limit, sort_by, category_id, author_id, min_rating, search
  return apiClient.get('/books', { params });
};

const getCategories = () => apiClient.get('/categories');
const getAuthors = () => apiClient.get('/authors');
const getBookById = (bookId) => apiClient.get(`/books/${bookId}`);

// Review Functions (remain the same)
const getReviewsForBook = (bookId, params = {}) => {
 return apiClient.get(`/books/${bookId}/reviews`, { params });
};
const createReview = (bookId, reviewData) => {
 return apiClient.post(`/books/${bookId}/reviews`, reviewData);
};
// Add deleteReview if implemented
// const deleteReview = (bookId, reviewId) => apiClient.delete(`/books/${bookId}/reviews/${reviewId}`);


// Auth Functions (remain the same)
const loginUser = (email, password) => {
 const formData = new URLSearchParams();
 formData.append('username', email);
 formData.append('password', password);
 return apiClient.post('/token', formData, {
   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
 });
};
const getCurrentUser = (token) => { // Token might be optional if interceptor always runs first
 const headers = {};
 if (token) {
   headers['Authorization'] = `Bearer ${token}`;
 }
 return apiClient.get('/users/me', { headers });
};
const refreshToken = (refreshTokenValue) => { // Renamed param for clarity
 // Backend expects JSON for refresh token endpoint based on previous code? Check backend.
 // If backend expects {'refresh_token': value}, use that. Assuming JSON for now.
 return apiClient.post('/refresh-token', { refresh_token: refreshTokenValue });
};

// Order Function (remains the same)
const createOrder = (orderData) => {
 return apiClient.post('/orders', orderData);
};
// Add getOrders if implemented fully
// const getOrders = () => apiClient.get('/orders');

// Cart Functions (remain the same)
const getUserCart = () => apiClient.get('/cart');
const updateUserCart = (cartItems) => apiClient.post('/cart', cartItems);

// Add searchBooks function that uses getBooks with search parameter
const searchBooks = (query, params = {}) => {
  return getBooks({ ...params, search: query });
};

// Export all functions
const apiService = {
 getBooks,
 getCategories,
 getAuthors,
 getBookById,
 loginUser,
 getCurrentUser,
 refreshToken, // Ensure refreshToken is exported if used in AuthContext
 createOrder,
 // getOrders,
 getReviewsForBook,
 createReview,
 // deleteReview,
 getUserCart,
 updateUserCart,
 searchBooks, // Add searchBooks to exports
};

export default apiService;
