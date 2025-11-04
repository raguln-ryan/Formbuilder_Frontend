import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import authReducer from './slices/authSlice';
import formBuilderReducer from './slices/formBuilderSlice';
import formListReducer from './slices/formListSlice';
import submissionsReducer from './slices/submissionsSlice';
import responsesReducer from './slices/responsesSlice';
import publicFormReducer from './slices/publicFormSlice';
import uiReducer from './slices/uiSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  formBuilder: formBuilderReducer,
  formList: formListReducer,
  submissions: submissionsReducer,
  responses: responsesReducer,
  publicForm: publicFormReducer,
  ui: uiReducer
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth state
  blacklist: ['formBuilder', 'formList', 'submissions', 'responses', 'publicForm', 'ui'] // Don't persist these
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

export const persistor = persistStore(store);