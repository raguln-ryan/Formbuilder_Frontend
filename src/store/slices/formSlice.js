import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import formService from '../../services/formService';

// Async thunks for API calls
export const fetchFormDetails = createAsyncThunk(
  'forms/fetchFormDetails',
  async (formId) => {
    const response = await formService.getFormById(formId);
    return response.data || response;
  }
);

export const updateForm = createAsyncThunk(
  'forms/updateForm',
  async ({ formId, updateData }) => {
    const response = await formService.updateForm(formId, updateData);
    return response;
  }
);

const formSlice = createSlice({
  name: 'forms',
  initialState: {
    currentForm: null,
    formData: {
      title: '',
      description: '',
      isVisible: true,
      status: 'draft'
    },
    questions: [],
    loading: false,
    saving: false,
    error: null,
    lastFetchedFormId: null
  },
  reducers: {
    updateFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    updateQuestions: (state, action) => {
      state.questions = action.payload;
    },
    clearFormData: (state) => {
      state.currentForm = null;
      state.formData = {
        title: '',
        description: '',
        isVisible: true,
        status: 'draft'
      };
      state.questions = [];
      state.lastFetchedFormId = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch form details
      .addCase(fetchFormDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFormDetails.fulfilled, (state, action) => {
        console.log('Raw API Response:', action.payload); // Debug log
        
        state.loading = false;
        state.currentForm = action.payload;
        
        // Extract form configuration
        state.formData = {
          title: action.payload.title || '',
          description: action.payload.description || '',
          isVisible: action.payload.isVisible !== undefined ? action.payload.isVisible : true,
          status: action.payload.status || 'draft'
        };
        
        // Format questions - with detailed logging
        let questionsData = action.payload.questions || [];
        console.log('Questions from API:', questionsData); // Debug log
        
        if (Array.isArray(questionsData) && questionsData.length > 0) {
          state.questions = questionsData.map((q, index) => {
            const formattedQuestion = {
              _id: q.id || q.questionId || q._id || `q_${Date.now()}_${index}`,
              type: q.type || 'short_text',
              question: q.text || q.question || q.questionText || '',
              description_enabled: q.descriptionEnabled || false,
              description: q.description || '',
              required: q.required || false,
              order: q.order !== undefined ? q.order : index,
              enabled: q.enabled !== undefined ? q.enabled : true,
              format: q.format || null,
              maxLength: q.maxLength || null,
              options: q.options || [],
              single_choice: q.singleChoice || false,
              multiple_choice: q.multipleChoice || false
            };
            console.log('Formatted question:', formattedQuestion); // Debug log
            return formattedQuestion;
          });
        } else {
          state.questions = [];
        }
        
        console.log('Final state.questions:', state.questions); // Debug log
        state.lastFetchedFormId = action.meta.arg;
      })
      .addCase(fetchFormDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update form
      .addCase(updateForm.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateForm.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateForm.rejected, (state) => {
        state.saving = false;
      });
  },
});

export const { updateFormData, updateQuestions, clearFormData } = formSlice.actions;
export default formSlice.reducer;