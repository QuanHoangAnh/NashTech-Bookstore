// frontend/src/services/api.js
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
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Original 401 handling logic here...
    // Consider adding token refresh logic here if needed
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
       originalRequest._retry = true;
       console.log("Attempting token refresh...");
       try {
           // Assuming refreshToken function exists and handles storage
           // const newAccessToken = await refreshToken(); // You need a refresh token mechanism
           // if (newAccessToken) {
           //    axios.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
           //    return apiClient(originalRequest);
           // } else {
              localStorage.removeItem('bookwormToken');
              localStorage.removeItem('bookwormRefreshToken'); // Clear refresh token too
              // Redirect to login or trigger logout state
              window.location.href = '/'; // Redirect home, Navbar will show Sign In
              console.error("Token refresh failed or not possible. Logging out.");
           // }
       } catch (refreshError) {
           localStorage.removeItem('bookwormToken');
           localStorage.removeItem('bookwormRefreshToken');
           window.location.href = '/';
           console.error("Error during token refresh:", refreshError);
           return Promise.reject(refreshError);
       }
    }
    // Fallback for non-401 or retry failed
    if (error.response?.status === 401 && originalRequest._retry) {
        localStorage.removeItem('bookwormToken');
        localStorage.removeItem('bookwormRefreshToken');
        window.location.href = '/'; // Redirect home if retry fails
    }
    return Promise.reject(error);
  }
);


// --- Existing API Service Functions (getBooks, getCategories, etc. remain) ---
const getBooks = (params = {}) => apiClient.get('/books', { params });
const getCategories = () => apiClient.get('/categories');
const getAuthors = () => apiClient.get('/authors');
const getBookById = (bookId) => apiClient.get(`/books/${bookId}`);
const getReviewsForBook = (bookId, params = {}) => {
  return apiClient.get(`/books/${bookId}/reviews`, { params });
};
const createReview = (bookId, reviewData) => {
  return apiClient.post(`/books/${bookId}/reviews`, reviewData);
};
const loginUser = (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  return apiClient.post('/token', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};
const getCurrentUser = (token) => { // Token might be optional if interceptor always runs first
  const headers = {};
  if (token) { // Pass token explicitly if needed (e.g., initial load)
    headers['Authorization'] = `Bearer ${token}`;
  }
  return apiClient.get('/users/me', { headers });
};
const refreshToken = (refreshTokenValue) => { // Renamed param for clarity
    // Backend expects JSON for refresh token endpoint based on auth.py example
    return apiClient.post('/refresh-token', { refresh_token: refreshTokenValue });
};
const createOrder = (orderData) => {
  return apiClient.post('/orders', orderData);
};
const getUserCart = () => apiClient.get('/cart');
const updateUserCart = (cartItems) => apiClient.post('/cart', cartItems);

// --- NEW SEARCH FUNCTION ---
const searchBooks = (query, params = {}) => {
  // Pass search query 'q' and other params like skip, limit
  return apiClient.get('/search', { params: { q: query, ...params } });
};


const apiService = {
  getBooks,
  getCategories,
  getAuthors,
  getBookById,
  loginUser,
  getCurrentUser,
  createOrder,
  getReviewsForBook,
  createReview,
  refreshToken,
  getUserCart,
  updateUserCart,
  searchBooks, // Export the new function
};

export default apiService;