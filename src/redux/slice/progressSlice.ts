"use client";

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import toast from "react-hot-toast";

// ✅ TYPES
export interface Lesson {
  id: number;
  title: string;
  videoUrl: string;
  order: number;
}

interface ProgressState {
  nextLesson: Lesson | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProgressState = {
  nextLesson: null,
  loading: false,
  error: null,
};

// ✅ MARK LESSON COMPLETE
export const markLessonComplete = createAsyncThunk(
  "progress/markLessonComplete",
  async (data: { courseId: number; lessonId: number }, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/user/progress", data);
      toast.success("Lesson marked as complete!");
      return res.data.progress;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to mark complete";
      toast.error(errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

// ✅ GET NEXT LESSON
export const getNextLesson = createAsyncThunk(
  "progress/getNextLesson",
  async (enrollmentId: number, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/user/progress?enrollmentId=${enrollmentId}`);
      return res.data.nextLesson;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to fetch next lesson";
      toast.error(errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

// ✅ SLICE
const progressSlice = createSlice({
  name: "progress",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // MARK LESSON COMPLETE
    builder.addCase(markLessonComplete.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(markLessonComplete.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(markLessonComplete.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // GET NEXT LESSON
    builder.addCase(getNextLesson.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getNextLesson.fulfilled, (state, action: PayloadAction<Lesson | null>) => {
      state.loading = false;
      state.nextLesson = action.payload;
    });
    builder.addCase(getNextLesson.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export default progressSlice.reducer;
