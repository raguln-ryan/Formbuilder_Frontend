import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import responseService from '../../services/responseService';
import toast from 'react-hot-toast';

// Async thunks for API calls
export const fetchPublishedForms = createAsyncThunk(
  'learner/fetchPublishedForms',
  async ({ page, size, search }, { rejectWithValue }) => {
    try {
      const response = await responseService.getPublishedForms(page, size, search);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch published forms');
    }
  }
);

export const fetchMySubmissions = createAsyncThunk(
  'learner/fetchMySubmissions',
  async ({ page, size, search }, { rejectWithValue }) => {
    try {
      const response = await responseService.getMySubmissions(page, size, search);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch submissions');
    }
  }
);

export const fetchFormDetails = createAsyncThunk(
  'learner/fetchFormDetails',
  async (formId, { rejectWithValue }) => {
    try {
      const response = await responseService.getFormById(formId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch form details');
    }
  }
);

export const submitFormResponse = createAsyncThunk(
  'learner/submitFormResponse',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await responseService.submitResponse(formData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to submit form'
      );
    }
  }
);

export const fetchResponseDetails = createAsyncThunk(
  'learner/fetchResponseDetails',
  async (responseId, { rejectWithValue }) => {
    try {
      const response = await responseService.getResponseDetails(responseId);
      return response;
    } catch (error) {
      // Don't reject on 403 as we might have partial data
      if (error.response?.status === 403) {
        return { limited: true };
      }
      return rejectWithValue(error.message || 'Failed to fetch response details');
    }
  }
);

export const checkExistingSubmission = createAsyncThunk(
  'learner/checkExistingSubmission',
  async (formId, { rejectWithValue }) => {
    try {
      const submissions = await responseService.getMySubmissions(1, 100, '');
      const submissionsList = submissions.data || submissions || [];
      
      const existingSubmission = submissionsList.find(
        submission => (submission.formId === formId ||
          submission.form_id === formId ||
          submission.form?.id === formId ||
          submission.form?.formId === formId)
      );
      
      return existingSubmission || null;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to check submissions');
    }
  }
);

const initialState = {
  // Published forms state
  publishedForms: {
    data: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0
    },
    searchTerm: ''
  },
  
  // My submissions state
  mySubmissions: {
    data: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0
    },
    searchTerm: '',
    filter: 'External Training Completion'
  },
  
  // Current form being submitted/viewed
  currentForm: {
    data: null,
    loading: false,
    error: null
  },
  
  // Current submission being viewed
  currentSubmission: {
    data: null,
    responseDetails: null,
    loading: false,
    error: null
  },
  
  // Form submission state
  formSubmission: {
    submitting: false,
    success: false,
    error: null,
    submissionDetails: null
  },
  
  // UI state
  activeTab: 'published',
  
  // Existing submission check
  existingSubmissionCheck: {
    checking: false,
    submission: null,
    error: null
  }
};

const learnerSlice = createSlice({
  name: 'learner',
  initialState,
  reducers: {
    // UI actions
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    
    // Published forms actions
    setPublishedFormsPage: (state, action) => {
      state.publishedForms.pagination.page = action.payload;
    },
    
    setPublishedFormsPageSize: (state, action) => {
      state.publishedForms.pagination.pageSize = action.payload;
      state.publishedForms.pagination.page = 1; // Reset to first page
    },
    
    setPublishedFormsSearchTerm: (state, action) => {
      state.publishedForms.searchTerm = action.payload;
    },
    
    // My submissions actions
    setSubmissionsPage: (state, action) => {
      state.mySubmissions.pagination.page = action.payload;
    },
    
    setSubmissionsPageSize: (state, action) => {
      state.mySubmissions.pagination.pageSize = action.payload;
      state.mySubmissions.pagination.page = 1; // Reset to first page
    },
    
    setSubmissionsSearchTerm: (state, action) => {
      state.mySubmissions.searchTerm = action.payload;
    },
    
    setSubmissionsFilter: (state, action) => {
      state.mySubmissions.filter = action.payload;
    },
    
    // Reset submission state after successful submission
    resetFormSubmission: (state) => {
      state.formSubmission = initialState.formSubmission;
    },
    
    // Set current submission for viewing
    setCurrentSubmission: (state, action) => {
      state.currentSubmission.data = action.payload;
    },
    
    // Clear states
    clearCurrentForm: (state) => {
      state.currentForm = initialState.currentForm;
    },
    
    clearCurrentSubmission: (state) => {
      state.currentSubmission = initialState.currentSubmission;
    },
    
    // Reset entire learner state
    resetLearnerState: () => initialState
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch published forms
      .addCase(fetchPublishedForms.pending, (state) => {
        state.publishedForms.loading = true;
        state.publishedForms.error = null;
      })
      .addCase(fetchPublishedForms.fulfilled, (state, action) => {
        state.publishedForms.loading = false;
        
        if (action.payload && action.payload.data) {
          state.publishedForms.data = action.payload.data;
          state.publishedForms.pagination.totalCount = action.payload.totalCount || 0;
          state.publishedForms.pagination.totalPages = 
            action.payload.totalPages || Math.ceil(action.payload.totalCount / state.publishedForms.pagination.pageSize);
        } else if (Array.isArray(action.payload)) {
          // Fallback for array response
          state.publishedForms.data = action.payload;
          state.publishedForms.pagination.totalCount = action.payload.length;
          state.publishedForms.pagination.totalPages = 1;
        } else {
          state.publishedForms.data = [];
          state.publishedForms.pagination.totalCount = 0;
          state.publishedForms.pagination.totalPages = 0;
        }
      })
      .addCase(fetchPublishedForms.rejected, (state, action) => {
        state.publishedForms.loading = false;
        state.publishedForms.error = action.payload;
        state.publishedForms.data = [];
        toast.error('Failed to load published forms');
      })
      
      // Fetch my submissions
      .addCase(fetchMySubmissions.pending, (state) => {
        state.mySubmissions.loading = true;
        state.mySubmissions.error = null;
      })
      .addCase(fetchMySubmissions.fulfilled, (state, action) => {
        state.mySubmissions.loading = false;
        
        if (action.payload && action.payload.data) {
          state.mySubmissions.data = action.payload.data;
          state.mySubmissions.pagination.totalCount = action.payload.totalCount || 0;
          state.mySubmissions.pagination.totalPages = 
            action.payload.totalPages || Math.ceil(action.payload.totalCount / state.mySubmissions.pagination.pageSize);
        } else if (Array.isArray(action.payload)) {
          // Fallback for array response
          state.mySubmissions.data = action.payload;
          state.mySubmissions.pagination.totalCount = action.payload.length;
          state.mySubmissions.pagination.totalPages = 1;
        } else {
          state.mySubmissions.data = [];
          state.mySubmissions.pagination.totalCount = 0;
          state.mySubmissions.pagination.totalPages = 0;
        }
      })
      .addCase(fetchMySubmissions.rejected, (state, action) => {
        state.mySubmissions.loading = false;
        state.mySubmissions.error = action.payload;
        state.mySubmissions.data = [];
      })
      
      // Fetch form details
      .addCase(fetchFormDetails.pending, (state) => {
        state.currentForm.loading = true;
        state.currentForm.error = null;
      })
      .addCase(fetchFormDetails.fulfilled, (state, action) => {
        state.currentForm.loading = false;
        state.currentForm.data = action.payload;
      })
      .addCase(fetchFormDetails.rejected, (state, action) => {
        state.currentForm.loading = false;
        state.currentForm.error = action.payload;
        toast.error('Failed to load form details');
      })
      
      // Submit form response
      .addCase(submitFormResponse.pending, (state) => {
        state.formSubmission.submitting = true;
        state.formSubmission.error = null;
        state.formSubmission.success = false;
      })
      .addCase(submitFormResponse.fulfilled, (state, action) => {
        state.formSubmission.submitting = false;
        state.formSubmission.success = true;
        state.formSubmission.submissionDetails = action.payload;
        toast.success('Form submitted successfully!');
      })
      .addCase(submitFormResponse.rejected, (state, action) => {
        state.formSubmission.submitting = false;
        state.formSubmission.error = action.payload;
        state.formSubmission.success = false;
        toast.error(action.payload || 'Failed to submit form');
      })
      
      // Fetch response details
      .addCase(fetchResponseDetails.pending, (state) => {
        state.currentSubmission.loading = true;
        state.currentSubmission.error = null;
      })
      .addCase(fetchResponseDetails.fulfilled, (state, action) => {
        state.currentSubmission.loading = false;
        if (action.payload.limited) {
          // Limited access, but we can still use submission.details
          state.currentSubmission.responseDetails = null;
        } else {
          state.currentSubmission.responseDetails = action.payload;
        }
      })
      .addCase(fetchResponseDetails.rejected, (state, action) => {
        state.currentSubmission.loading = false;
        state.currentSubmission.error = action.payload;
      })
      
      // Check existing submission
      .addCase(checkExistingSubmission.pending, (state) => {
        state.existingSubmissionCheck.checking = true;
        state.existingSubmissionCheck.error = null;
      })
      .addCase(checkExistingSubmission.fulfilled, (state, action) => {
        state.existingSubmissionCheck.checking = false;
        state.existingSubmissionCheck.submission = action.payload;
      })
      .addCase(checkExistingSubmission.rejected, (state, action) => {
        state.existingSubmissionCheck.checking = false;
        state.existingSubmissionCheck.error = action.payload;
      });
  }
});

// Export actions
export const {
  setActiveTab,
  setPublishedFormsPage,
  setPublishedFormsPageSize,
  setPublishedFormsSearchTerm,
  setSubmissionsPage,
  setSubmissionsPageSize,
  setSubmissionsSearchTerm,
  setSubmissionsFilter,
  resetFormSubmission,
  setCurrentSubmission,
  clearCurrentForm,
  clearCurrentSubmission,
  resetLearnerState
} = learnerSlice.actions;

// Selectors
export const selectPublishedForms = (state) => state.learner.publishedForms;
export const selectMySubmissions = (state) => state.learner.mySubmissions;
export const selectCurrentForm = (state) => state.learner.currentForm;
export const selectCurrentSubmission = (state) => state.learner.currentSubmission;
export const selectFormSubmission = (state) => state.learner.formSubmission;
export const selectActiveTab = (state) => state.learner.activeTab;
export const selectExistingSubmissionCheck = (state) => state.learner.existingSubmissionCheck;

export default learnerSlice.reducer;
