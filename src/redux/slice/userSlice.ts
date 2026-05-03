"use client";

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// ✅ TYPES
interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "USER" | "ADMIN";
  createdAt: string;
}

interface UserState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  loading: false,
  error: null,
};

// ✅ LOGIN USER
export const loginUser = createAsyncThunk(
  "user/login",
  async (data: { identifier: string; password: any }, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/auth/login", data);
      return res.data.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

// ✅ REGISTER USER
export const registerUser = createAsyncThunk(
  "user/register",
  async (data: any, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/user", data);
      return res.data.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Register failed");
    }
  }
);

// ✅ FETCH CURRENT SESSION (Lightweight)
export const fetchSession = createAsyncThunk(
  "user/session",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/auth/me");
      return res.data.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "No session");
    }
  }
);

// ✅ FETCH FULL PROFILE (Complete)
export const getCurrentUser = createAsyncThunk(
  "user/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/user/me");
      return res.data.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch profile");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "user/logout",
  async (_, { dispatch }) => {
    try {
      // Clear state immediately in Redux
      dispatch(logout());
      
      // Attempt to clear session cookie on server
      await axios.post("/api/auth/me");
      
      localStorage.setItem("logout-event", Date.now().toString());
      return null;
    } catch (err: any) {
      // Handle silently - if server logout fails, we still want to be logged out locally
      return null;
    }
  }
);

// ✅ SLICE
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logout: (state) => {
      state.currentUser = null;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.currentUser = action.payload;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchSession.pending, (state) => { state.loading = true; });
    builder.addCase(fetchSession.fulfilled, (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.currentUser = action.payload;
    });
    builder.addCase(fetchSession.rejected, (state) => {
      state.loading = false;
      state.currentUser = null;
    });

    builder.addCase(getCurrentUser.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(getCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.currentUser = action.payload;
    });
    builder.addCase(getCurrentUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(logoutUser.fulfilled, (state) => {
      state.currentUser = null;
    });
  },
});

export const { logout } = userSlice.actions;
export default userSlice.reducer;