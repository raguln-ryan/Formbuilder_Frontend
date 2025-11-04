import { configureStore } from '@reduxjs/toolkit';
import formReducer from './slices/formSlice';
import responseReducer from './slices/responseSlice';

export const store = configureStore({
  reducer: {
    forms: formReducer,
    responses: responseReducer,
  },
});