import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Helper function to safely parse JSON from localStorage
const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    localStorage.removeItem('user'); // Clear invalid data
    return null;
  }
};

// Create async thunk for login
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // The response.data is already the user object with token
      const userData = response.data;
      
      // Store token and user in localStorage
      if (userData.token) {
        localStorage.setItem('token', userData.token);
        // Store user data without token for cleaner storage
        const { token, ...userWithoutToken } = userData;
        localStorage.setItem('user', JSON.stringify(userWithoutToken));
      }
      
      // Return structured data for the reducer
      return {
        user: {
          userId: userData.userId,
          name: userData.name,
          role: userData.role,
          email: userData.email || ''
        },
        token: userData.token
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed'
      );
    }
  }
);

// Create async thunk for register
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      // Handle same response structure as login
      const responseData = response.data;
      
      if (responseData.token) {
        localStorage.setItem('token', responseData.token);
        const { token, ...userWithoutToken } = responseData;
        localStorage.setItem('user', JSON.stringify(userWithoutToken));
      }
      
      return {
        user: {
          userId: responseData.userId,
          name: responseData.name,
          role: responseData.role,
          email: responseData.email || ''
        },
        token: responseData.token
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: getStoredUser(), // Use helper function
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    loadUserFromStorage: (state) => {
      const token = localStorage.getItem('token');
      const user = getStoredUser();
      if (token && user) {
        state.token = token;
        state.user = user;
        state.isAuthenticated = true;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      })
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
  },
});

export const { clearError, logout, loadUserFromStorage } = authSlice.actions;
export default authSlice.reducer;
