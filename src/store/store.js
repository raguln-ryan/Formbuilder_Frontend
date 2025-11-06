import { configureStore } from '@reduxjs/toolkit';
import formBuilderReducer from './slices/formBuilderSlice';
import formReducer from './slices/formSlice';
import responseReducer from './slices/responseSlice';
import formListReducer from './slices/formListSlice';
import learnerReducer from './slices/learnerSlice';

export const store = configureStore({
  reducer: {
    formBuilder: formBuilderReducer,
    forms: formReducer,
    formList: formListReducer,
    responses: responseReducer,
    learner: learnerReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'formBuilder/setDraggedQuestionIndex',
          'formList/openDeleteModal',
        ],
        ignoredActionPaths: ['payload.navigate'],
      },
    }),
});