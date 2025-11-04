import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import responseService from '../../services/responseService';
import toast from 'react-hot-toast';

// Async thunks for published forms
export const fetchPublishedForms = createAsyncThunk(
  'submissions/fetchPublished',
  async ({ page, pageSize, search }, { rejectWithValue }) => {
    try {
      const response = await responseService.getPublishedForms(page, pageSize, search);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch forms');
    }
  }
);

// Fetch form details for submission
export const fetchFormForSubmission = createAsyncThunk(
  'submissions/fetchFormForSubmission',
  async (formId, { rejectWithValue }) => {
    try {
      const forms = await responseService.getPublishedForms();
      const currentForm = forms.find(f => f.formId === formId);
      if (!currentForm) {
        throw new Error('Form not found');
      }
      return currentForm;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch form');
    }
  }
);

// Fetch user's submissions
export const fetchMySubmissions = createAsyncThunk(
  'submissions/fetchMy',
  async ({ page, pageSize, search }, { rejectWithValue }) => {
    try {
      const response = await responseService.getMySubmissions(page, pageSize, search);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch submissions');
    }
  }
);

// Fetch submissions for a specific form
export const fetchMyFormSubmissions = createAsyncThunk(
  'submissions/fetchMyFormSubmissions',
  async (formId, { rejectWithValue }) => {
    try {
      const response = await responseService.getMySubmissions(1, 100);
      const formSubmissions = (response.data || []).filter(
        sub => sub.formId === formId
      );
      return formSubmissions;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch submissions');
    }
  }
);

// Submit form
export const submitForm = createAsyncThunk(
  'submissions/submit',
  async ({ formId, answers, fileUploads }, { rejectWithValue }) => {
    try {
      const formData = {
        formId: formId,
        answers: Object.entries(answers)
          .filter(([_, value]) => value)
          .map(([questionId, answer]) => ({
            questionId,
            answer: Array.isArray(answer) ? answer.join(', ') : answer
          })),
        fileUploads: Object.values(fileUploads)
      };
      
      const response = await responseService.submitResponse(formData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit form');
    }
  }
);

// Fetch form responses (for admin)
export const fetchFormResponses = createAsyncThunk(
  'submissions/fetchResponses',
  async ({ formId, page, pageSize, search }, { rejectWithValue }) => {
    try {
      const response = await responseService.getFormResponses(formId, page, pageSize, search);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch responses');
    }
  }
);

const submissionsSlice = createSlice({
  name: 'submissions',
  initialState: {
    // Published forms for learners
    publishedForms: [],
    publishedTotalCount: 0,
    publishedPage: 1,
    publishedPageSize: 10,
    publishedSearch: '',
    
    // Current form being filled
    currentForm: null,
    answers: {},
    fileUploads: {},
    
    // My submissions for learners
    mySubmissions: [],
    submissionsTotalCount: 0,
    submissionsPage: 1,
    submissionsPageSize: 10,
    submissionsSearch: '',
    
    // Form responses for admin
    formResponses: [],
    responsesTotalCount: 0,
    responsesPage: 1,
    responsesPageSize: 10,
    responsesSearch: '',
    selectedResponse: null,
    
    // Common states
    activeTab: 'published',
    loading: false,
    submitting: false,
    error: null,
    responseView: 'summary',
    
    // Modal states
    showSubmittedModal: false,
    lastSubmissionDate: null
  },
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setPublishedPage: (state, action) => {
      state.publishedPage = action.payload;
    },
    setPublishedPageSize: (state, action) => {
      state.publishedPageSize = action.payload;
      state.publishedPage = 1;
    },
    setPublishedSearch: (state, action) => {
      state.publishedSearch = action.payload;
      state.publishedPage = 1;
    },
    setSubmissionsPage: (state, action) => {
      state.submissionsPage = action.payload;
    },
    setSubmissionsPageSize: (state, action) => {
      state.submissionsPageSize = action.payload;
      state.submissionsPage = 1;
    },
    setSubmissionsSearch: (state, action) => {
      state.submissionsSearch = action.payload;
      state.submissionsPage = 1;
    },
    setResponsesPage: (state, action) => {
      state.responsesPage = action.payload;
    },
    setResponsesPageSize: (state, action) => {
      state.responsesPageSize = action.payload;
      state.responsesPage = 1;
    },
    setResponsesSearch: (state, action) => {
      state.responsesSearch = action.payload;
      state.responsesPage = 1;
    },
    setSelectedResponse: (state, action) => {
      state.selectedResponse = action.payload;
    },
    setResponseView: (state, action) => {
      state.responseView = action.payload;
    },
    // Form filling actions
    updateAnswer: (state, action) => {
      const { questionId, value } = action.payload;
      state.answers[questionId] = value;
    },
    updateFileUpload: (state, action) => {
      const { questionId, fileData } = action.payload;
      state.fileUploads[questionId] = fileData;
    },
    resetSubmissionForm: (state) => {
      state.answers = {};
      state.fileUploads = {};
      state.currentForm = null;
    },
    // Modal actions
    openSubmittedModal: (state, action) => {
      state.showSubmittedModal = true;
      state.lastSubmissionDate = action.payload;
    },
    closeSubmittedModal: (state) => {
      state.showSubmittedModal = false;
      state.lastSubmissionDate = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch published forms
      .addCase(fetchPublishedForms.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPublishedForms.fulfilled, (state, action) => {
        state.loading = false;
        state.publishedForms = action.payload.data || [];
        state.publishedTotalCount = action.payload.totalCount || 0;
      })
      .addCase(fetchPublishedForms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch form for submission
      .addCase(fetchFormForSubmission.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFormForSubmission.fulfilled, (state, action) => {
        state.loading = false;
        state.currentForm = action.payload;
        // Initialize answers
        const initialAnswers = {};
        if (action.payload.questions && Array.isArray(action.payload.questions)) {
          action.payload.questions.forEach(question => {
            if (question.multiple_choice === true || question.type === 'checkbox') {
              initialAnswers[question.id] = [];
            } else if (question.type?.toLowerCase() !== 'file_upload' && question.type?.toLowerCase() !== 'file') {
              initialAnswers[question.id] = '';
            }
          });
        }
        state.answers = initialAnswers;
        state.fileUploads = {};
      })
      .addCase(fetchFormForSubmission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch my submissions
      .addCase(fetchMySubmissions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMySubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.mySubmissions = action.payload.data || [];
        state.submissionsTotalCount = action.payload.totalCount || 0;
      })
      .addCase(fetchMySubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch my form submissions
      .addCase(fetchMyFormSubmissions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyFormSubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.mySubmissions = action.payload || [];
      })
      .addCase(fetchMyFormSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Submit form
      .addCase(submitForm.pending, (state) => {
        state.submitting = true;
      })
      .addCase(submitForm.fulfilled, (state) => {
        state.submitting = false;
        state.answers = {};
        state.fileUploads = {};
        toast.success('Form submitted successfully!');
      })
      .addCase(submitForm.rejected, (state, action) => {
        state.submitting = false;
        toast.error(action.payload);
      })
      // Fetch form responses
      .addCase(fetchFormResponses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFormResponses.fulfilled, (state, action) => {
        state.loading = false;
        state.formResponses = action.payload.data || [];
        state.responsesTotalCount = action.payload.totalCount || 0;
      })
      .addCase(fetchFormResponses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setActiveTab,
  setPublishedPage,
  setPublishedPageSize,
  setPublishedSearch,
  setSubmissionsPage,
  setSubmissionsPageSize,
  setSubmissionsSearch,
  setResponsesPage,
  setResponsesPageSize,
  setResponsesSearch,
  setSelectedResponse,
  setResponseView,
  updateAnswer,
  updateFileUpload,
  resetSubmissionForm,
  openSubmittedModal,
  closeSubmittedModal
} = submissionsSlice.actions;

export default submissionsSlice.reducer;