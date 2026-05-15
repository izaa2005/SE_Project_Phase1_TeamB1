/**
 * ========================================
 * AUTHENTICATION SERVICE
 * ========================================
 * 
 * Handles all authentication logic: login, register, logout, token management,
 * and verifying if the user is still logged in. Decodes JWT tokens on the frontend
 * to get user info (id, role, exp) without hitting the API every time.
 * Emits 'auth-changed' events so other parts of the app (like Navbar) can update.
 * 
 * @author Anxhela Valisi
 * @contributor Izabela Lako
 */

import api from './api';

// ===== JWT DECODING HELPER =====
const decodeToken = (token) => {
  try {
    // JWT token format: header.payload.signature
    // We only care about the payload (middle part)
    const base64Url = token.split('.')[1];
    
    // Fix base64 padding (replace URL-safe chars with standard base64)
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode base64 to UTF-8 string
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    // Parse JSON and return
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

// ===== AUTH CHANGED EVENT EMITTER =====
// Megi: "Emit this event when auth state changes so other components can react.
//       e.g., Navbar listens for this to update navigation"
const emitAuthChanged = () => {
  window.dispatchEvent(new Event('auth-changed'));
};

export const authService = {
  // ===== LOGIN =====
  /**
   * Izabela: "Authenticate user with email and password.
   *          Backend returns access and refresh tokens + user info."
   * 
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} user data
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user } = response.data;
      
      // ===== STORE TOKENS & USER INFO =====
      // Anxhela: "Save everything to localStorage so we can use it on next page load"
      localStorage.setItem('token', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userEmail', user.email);
      
      // TODO: maybe store in a more secure way (httpOnly cookies)
      // Izabela: "localStorage is vulnerable to XSS, but HttpOnly cookies can't be accessed by JS"
      
      emitAuthChanged();
      console.log('Login successful, role:', user.role);
      return { success: true, user };
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      throw error.response?.data?.message || 'Login failed';
    }
  },

  // ===== REGISTER =====
  /**
   * Megi: "Create a new user account. For students, they need to verify email and get approval before logging in.
   *       For other roles, they can log in immediately."
   */
  register: async (email, password, name, role) => {
    try {
      const response = await api.post('/auth/register', { email, password, name, role });
      const { access_token, refresh_token, user, requires_verification, requires_approval } = response.data;
      
      // ===== AUTO LOGIN AFTER REGISTRATION (only for non-students) =====
      // Anxhela: "Store tokens immediately so user is logged in (if tokens provided)"
      if (access_token && refresh_token) {
        localStorage.setItem('token', access_token);
        localStorage.setItem('refreshToken', refresh_token);
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userEmail', user.email);
        emitAuthChanged();
      }
      
      return { 
        success: true, 
        user, 
        requires_verification: requires_verification || false,
        requires_approval: requires_approval || false,
        auto_logged_in: !!(access_token && refresh_token)
      };
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      throw error.response?.data?.message || 'Registration failed';
    }
  },

  // ===== PASSWORD RECOVERY =====
  /**
   * Izabela: "Request a password reset email. Backend sends link with token."
   */
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Anxhela: "Verify that a reset token is still valid (not expired)."
   */
  validateResetToken: async (token) => {
    const response = await api.get(`/auth/reset-password/${token}`);
    return response.data;
  },

  /**
   * Megi: "Actually reset the password with the token from the email."
   */
  resetPassword: async (token, password) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  // ===== LOGOUT =====
  /**
   * Izabela: "Clear all auth data from localStorage. User is now logged out."
   */
  logout: () => {
    // ===== CLEAR AUTH DATA =====
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    emitAuthChanged();
    // Redirect handled by caller (usually Navbar)
  },

  // ===== CHECK AUTHENTICATION STATUS =====
  /**
   * Anxhela: "Get current user data from token payload.
   *          Returns null if no token or token is invalid."
   */
  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const decoded = decodeToken(token);
    if (!decoded) return null;
    
    return {
      id: decoded.id,
      role: decoded.role,
      // other claims from token...
    };
  },

  /**
   * Megi: "Is the user currently logged in with a valid token?"
   */
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    const decoded = decodeToken(token);
    if (!decoded) return false;
    
    // ===== CHECK TOKEN EXPIRATION =====
    // Izabela: "Compare token's expiry (exp) with current time.
    //          If expired, clear storage and return false."
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      // Token expired, clear storage
      authService.logout();
      return false;
    }
    
    return true;
  },

  /**
   * Anxhela: "Quick way to get user's role from localStorage.
   *          Used by Navbar and ProtectedRoute to show/hide content."
   */
  getUserRole: () => localStorage.getItem('userRole'),
};