import { configureStore } from '@reduxjs/toolkit';
import formBuilderReducer from './slices/formBuilderSlice';
import formReducer from './slices/formSlice';
import responseReducer from './slices/responseSlice';

export const store = configureStore({
  reducer: {
    formBuilder: formBuilderReducer,
    forms: formReducer,
    responses: responseReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['formBuilder/setDraggedQuestionIndex'],
        ignoredActionPaths: ['payload.navigate'],
      },
    }),
});