"use client";

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import toast from "react-hot-toast";

interface DashboardStats {
  totalCourses: number;
  activeCourses: number;
  completedCourses: number;
  lessonsCompleted: number;
}

interface DashboardState {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: {
    totalCourses: 0,
    activeCourses: 0,
    completedCourses: 0,
    lessonsCompleted: 0,
  },
  loading: false,
  error: null,
};

// ✅ GET DASHBOARD STATS
export const getDashboardStats = createAsyncThunk(
  "dashboard/getDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/dashboard");
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 401) return rejectWithValue(null);
      const errorMsg = err.response?.data?.message || "Failed to fetch dashboard stats";
      toast.error(errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

// ✅ SLICE
const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getDashboardStats.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getDashboardStats.fulfilled, (state, action: PayloadAction<DashboardStats>) => {
      state.loading = false;
      state.stats = action.payload;
    });
    builder.addCase(getDashboardStats.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export default dashboardSlice.reducer;
