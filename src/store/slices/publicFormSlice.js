import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchPublicForm = createAsyncThunk(
  'publicForm/fetchForm',
  async (formId) => {
    const response = await api.get(`/response/published`);
    const forms = response.data;
    return forms.find(f => f.formId === formId) || null;
  }
);

export const submitPublicForm = createAsyncThunk(
  'publicForm/submit',
  async ({ formId, answers }) => {
    const submissionData = {
      formId: formId,
      answers: Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer: Array.isArray(answer) ? answer.join(', ') : answer
      }))
    };
    
    return await api.post('/response', submissionData);
  }
);

const publicFormSlice = createSlice({
  name: 'publicForm',
  initialState: {
    form: null,
    answers: {},
    submitted: false,
    loading: false,
    submitting: false,
    errors: {}
  },
  reducers: {
    updatePublicFormAnswer: (state, action) => {
      const { questionId, value } = action.payload;
      state.answers[questionId] = value;
    },
    setPublicFormError: (state, action) => {
      const { questionId, error } = action.payload;
      if (error) {
        state.errors[questionId] = error;
      } else {
        delete state.errors[questionId];
      }
    },
    resetPublicForm: (state) => {
      state.form = null;
      state.answers = {};
      state.submitted = false;
      state.errors = {};
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicForm.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPublicForm.fulfilled, (state, action) => {
        state.loading = false;
        state.form = action.payload;
      })
      .addCase(fetchPublicForm.rejected, (state) => {
        state.loading = false;
        state.form = null;
      })
      .addCase(submitPublicForm.pending, (state) => {
        state.submitting = true;
      })
      .addCase(submitPublicForm.fulfilled, (state) => {
        state.submitting = false;
        state.submitted = true;
      })
      .addCase(submitPublicForm.rejected, (state) => {
        state.submitting = false;
      });
  }
});

export const {
  updatePublicFormAnswer,
  setPublicFormError,
  resetPublicForm
} = publicFormSlice.actions;

export default publicFormSlice.reducer;