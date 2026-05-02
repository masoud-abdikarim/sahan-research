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
      const res = await axios.get(`/api/user/lessons?courseId=${courseId}`);
      return res.data.lessons;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to fetch lessons";
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
  },
});

export default lessonSlice.reducer;
