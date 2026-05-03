"use client";

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import toast from "react-hot-toast";

export interface Lesson {
  id: number;
  title: string;
  videoType: "UPLOAD" | "URL";
  videoUrl: string;
  order: number;
  courseId: number;
  unlocked?: boolean;
  completed?: boolean;
}

interface LessonState {
  lessons: Lesson[];
  loading: boolean;
  error: string | null;
}

const initialState: LessonState = {
  lessons: [],
  loading: false,
  error: null,
};

export const createLesson = createAsyncThunk(
  "lesson/createLesson",
  async (data: any, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/admin/lessons", data);
      toast.success("Lesson created successfully!");
      return res.data.lesson;
    } catch (err: any) {
      if (err.response?.status === 401) return rejectWithValue(null);
      const errorMsg = err.response?.data?.message || "Failed to create lesson";
      toast.error(errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

export const getLessonsByCourse = createAsyncThunk(
  "lesson/getLessonsByCourse",
  async (courseId: number, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/user/lessons${courseId ? `?courseId=${courseId}` : ""}`);
      return res.data.lessons;
    } catch (err: any) {
      if (err.response?.status === 401) return rejectWithValue(null);
      const errorMsg = err.response?.data?.message || "Failed to fetch lessons";
      toast.error(errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

export const updateLesson = createAsyncThunk(
  "lesson/updateLesson",
  async ({ id, data }: { id: number; data: any }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`/api/admin/lessons/${id}`, data);
      toast.success("Lesson updated successfully!");
      return res.data.lesson;
    } catch (err: any) {
      if (err.response?.status === 401) return rejectWithValue(null);
      const errorMsg = err.response?.data?.message || "Failed to update lesson";
      toast.error(errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

export const deleteLesson = createAsyncThunk(
  "lesson/deleteLesson",
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/admin/lessons/${id}`);
      toast.success("Lesson deleted successfully!");
      return id;
    } catch (err: any) {
      if (err.response?.status === 401) return rejectWithValue(null);
      const errorMsg = err.response?.data?.message || "Failed to delete lesson";
      toast.error(errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

const lessonSlice = createSlice({
  name: "lesson",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createLesson.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(createLesson.fulfilled, (state, action: PayloadAction<Lesson>) => {
      state.loading = false;
      state.lessons.push(action.payload);
    });
    builder.addCase(createLesson.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(getLessonsByCourse.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(getLessonsByCourse.fulfilled, (state, action: PayloadAction<Lesson[]>) => {
      state.loading = false;
      state.lessons = action.payload;
    });
    builder.addCase(getLessonsByCourse.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(updateLesson.pending, (state) => { state.loading = true; });
    builder.addCase(updateLesson.fulfilled, (state, action: PayloadAction<Lesson>) => {
      state.loading = false;
      state.lessons = state.lessons.map(l => l.id === action.payload.id ? action.payload : l);
    });

    builder.addCase(deleteLesson.pending, (state) => { state.loading = true; });
    builder.addCase(deleteLesson.fulfilled, (state, action: PayloadAction<number>) => {
      state.loading = false;
      state.lessons = state.lessons.filter(l => l.id !== action.payload);
    });
  },
});

export default lessonSlice.reducer;
