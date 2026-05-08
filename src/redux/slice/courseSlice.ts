"use client";

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import toast from "react-hot-toast";

export interface Course {
  id: number;
  name: string;
  description: string;
  outcomes: string[];
  instructor?: string;
  price: number;
  durationMonths: number;
  category: string;
  imageUrl?: string;
  whoIsFor: string[];
  prerequisites: string[];
  createdAt: string;
}

interface CourseState {
  courses: Course[];
  loading: boolean;
  error: string | null;
}

const initialState: CourseState = {
  courses: [],
  loading: false,
  error: null,
};

export const createCourse = createAsyncThunk(
  "course/createCourse",
  async (data: any, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/admin/courses", data);
      toast.success("Course created successfully!");
      return res.data.course;
    } catch (err: any) {
      if (err.response?.status === 401) return rejectWithValue(null);
      const errorMsg = err.response?.data?.message || "Failed to create course";
      toast.error(errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

export const getCourses = createAsyncThunk(
  "course/getCourses",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/courses");
      return res.data.courses;
    } catch (err: any) {
      if (err.response?.status === 401) return rejectWithValue(null);
      const errorMsg = err.response?.data?.message || "Failed to fetch courses";
      toast.error(errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

export const updateCourse = createAsyncThunk(
  "course/updateCourse",
  async ({ id, data }: { id: number; data: any }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`/api/admin/courses/${id}`, data);
      toast.success("Course updated successfully!");
      return res.data.course;
    } catch (err: any) {
      if (err.response?.status === 401) return rejectWithValue(null);
      const errorMsg = err.response?.data?.message || "Failed to update course";
      toast.error(errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

export const deleteCourse = createAsyncThunk(
  "course/deleteCourse",
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/admin/courses/${id}`);
      toast.success("Course deleted successfully!");
      return id;
    } catch (err: any) {
      if (err.response?.status === 401) return rejectWithValue(null);
      const errorMsg = err.response?.data?.message || "Failed to delete course";
      toast.error(errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

const courseSlice = createSlice({
  name: "course",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createCourse.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(createCourse.fulfilled, (state, action: PayloadAction<Course>) => {
      state.loading = false;
      state.courses.push(action.payload);
    });
    builder.addCase(createCourse.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(getCourses.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(getCourses.fulfilled, (state, action: PayloadAction<Course[]>) => {
      state.loading = false;
      state.courses = action.payload;
    });
    builder.addCase(getCourses.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(updateCourse.pending, (state) => { state.loading = true; });
    builder.addCase(updateCourse.fulfilled, (state, action: PayloadAction<Course>) => {
      state.loading = false;
      state.courses = state.courses.map(c => c.id === action.payload.id ? action.payload : c);
    });

    builder.addCase(deleteCourse.pending, (state) => { state.loading = true; });
    builder.addCase(deleteCourse.fulfilled, (state, action: PayloadAction<number>) => {
      state.loading = false;
      state.courses = state.courses.filter(c => c.id !== action.payload);
    });
  },
});

export default courseSlice.reducer;
