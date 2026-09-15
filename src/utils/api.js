/**
 * Lightweight API utility for interacting with the Korus backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Generic fetch wrapper that automatically attaches the stored JWT token
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('korus_auth_token');

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      const networkError = new Error('Cannot connect to Korus backend server. Please ensure the server is running on port 5000.');
      networkError.status = 503;
      throw networkError;
    }
    throw error;
  }
}

// Authentication API methods
export const authApi = {
  register: (name, email, password) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    }),

  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  getMe: () =>
    apiRequest('/auth/me', {
      method: 'GET',
    }),

  checkHealth: () =>
    apiRequest('/health', {
      method: 'GET',
    }),
};
