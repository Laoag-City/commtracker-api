// src/features/auth/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('token') || null, // Using 'token' consistently
    user: JSON.parse(localStorage.getItem('user')) || {},
  },
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem('token', action.payload.token); // Consistent key name
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      state.token = null;
      state.user = {};
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
