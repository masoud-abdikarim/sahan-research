"use client";

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import toast from "react-hot-toast";

// ✅ TYPES
export interface Enrollment {
  id: number;
  userId: number;
  courseId: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  course?: {
    id: number;
    name: string;
    imageUrl?: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  isCompleted: boolean;
  completedAt?: string;
}

interface EnrollmentState {
  enrollments: Enrollment[];
  loading: boolean;
  error: string | null;
}

const initialState: EnrollmentState = {
  enrollments: [],
  loading: false,
  error: null,
};

// ✅ ENROLL COURSE
export const enrollCourse = createAsyncThunk(
  "enrollment/enrollCourse",
  async (courseId: number, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/user/enrollments", { courseId });
      toast.success("Enrolled successfully, waiting for approval.");
      return res.data.enrollment;
    } catch (err: any) {
      if (err.response?.status === 401) return rejectWithValue(null);
      const errorMsg = err.response?.data?.message || "Failed to enroll";
      toast.error(errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

export const getAllEnrollments = createAsyncThunk(
  "enrollment/getAllEnrollments",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/admin/enrollments");
      return res.data.enrollments;
    } catch (err: any) {
      if (err.response?.status === 401) return rejectWithValue(null);
      const errorMsg = err.response?.data?.message || "Failed to fetch all enrollments";
      toast.error(errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

// ✅ GET USER ENROLLMENTS
export const getUserEnrollments = createAsyncThunk(
  "enrollment/getUserEnrollments",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/user/enrollments`);
      return res.data.enrollments;
    } catch (err: any) {
      if (err.response?.status === 401) return rejectWithValue(null);
      const errorMsg = err.response?.data?.message || "Failed to fetch enrollments";
      toast.error(errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

// ✅ APPROVE ENROLLMENT (ADMIN)
export const approveEnrollment = createAsyncThunk(
  "enrollment/approveEnrollment",
  async ({ id, status }: { id: number; status: "APPROVED" | "REJECTED" }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/api/admin/enrollments/${id}`, { status });
      toast.success(`Enrollment ${status.toLowerCase()}!`);
      return res.data.enrollment;
    } catch (err: any) {
      if (err.response?.status === 401) return rejectWithValue(null);
      const errorMsg = err.response?.data?.message || "Failed to update enrollment";
      toast.error(errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

// ✅ SLICE
const enrollmentSlice = createSlice({
  name: "enrollment",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // ENROLL COURSE
    builder.addCase(enrollCourse.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(enrollCourse.fulfilled, (state, action: PayloadAction<Enrollment>) => {
      state.loading = false;
      state.enrollments.push(action.payload);
    });
    builder.addCase(enrollCourse.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // GET USER ENROLLMENTS
    builder.addCase(getUserEnrollments.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUserEnrollments.fulfilled, (state, action: PayloadAction<Enrollment[]>) => {
      state.loading = false;
      state.enrollments = action.payload;
    });
    builder.addCase(getUserEnrollments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(getAllEnrollments.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(getAllEnrollments.fulfilled, (state, action: PayloadAction<Enrollment[]>) => {
      state.loading = false;
      state.enrollments = action.payload;
    });
    builder.addCase(getAllEnrollments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // APPROVE ENROLLMENT
    builder.addCase(approveEnrollment.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(approveEnrollment.fulfilled, (state, action: PayloadAction<Enrollment>) => {
      state.loading = false;
      const index = state.enrollments.findIndex(e => e.id === action.payload.id);
      if (index !== -1) {
        state.enrollments[index] = action.payload;
      }
    });
    builder.addCase(approveEnrollment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export default enrollmentSlice.reducer;
