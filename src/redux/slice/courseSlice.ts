"use client";

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import toast from "react-hot-toast";

export interface Course {
  id: number;
  name: string;
  description: string;
  price: number;
  durationMonths: number;
  category: string;
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
      const res = await axios.get("/api/public/courses");
      return res.data.courses;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to fetch courses";
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
  },
});

export default courseSlice.reducer;
