import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slice/userSlice";
import courseReducer from "./slice/courseSlice";
import lessonReducer from "./slice/lessonSlice";
import enrollmentReducer from "./slice/enrollmentSlice";
import progressReducer from "./slice/progressSlice";
import dashboardReducer from "./slice/dashboardSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    course: courseReducer,
    lesson: lessonReducer,
    enrollment: enrollmentReducer,
    progress: progressReducer,
    dashboard: dashboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
