import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import formService from '../../services/formService';
import toast from 'react-hot-toast';

// Async thunks
export const fetchForms = createAsyncThunk(
  'formList/fetchForms',
  async ({ page = 1, pageSize = 10, searchTerm = '' }, { rejectWithValue }) => {
    try {
      const response = await formService.getAllForms(page, pageSize, searchTerm);
      return {
        forms: response.data || [],
        totalCount: response.totalCount || 0,
        totalPages: response.totalPages || 0,
        page,
        pageSize
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch forms');
    }
  }
);

export const deleteForm = createAsyncThunk(
  'formList/deleteForm',
  async ({ formId, formTitle }, { rejectWithValue }) => {
    try {
      const result = await formService.deleteForm(formId);
      if (result.success) {
        toast.success(result.message || `Form "${formTitle}" deleted successfully`);
        return { formId, success: true };
      }
      return rejectWithValue(result.message || 'Failed to delete form');
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete form');
    }
  }
);

export const checkFormResponses = createAsyncThunk(
  'formList/checkFormResponses',
  async ({ formId }, { rejectWithValue }) => {
    try {
      const responses = await formService.getFormResponses(formId, 1, 100);
      const responseData = responses.data || responses;
      return {
        hasResponses: responseData.length > 0,
        responseCount: responses.totalCount || responseData.length || 0
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to check form responses');
    }
  }
);

export const toggleFormEnabled = createAsyncThunk(
  'formList/toggleFormEnabled',
  async ({ formId, currentStatus }, { rejectWithValue }) => {
    try {
      // Add your API call here if needed to persist the enabled status
      // const result = await formService.toggleFormStatus(formId, !currentStatus);
      
      const newStatus = !currentStatus;
      toast.success(`Form ${newStatus ? 'enabled' : 'disabled'}`);
      return { formId, isEnabled: newStatus };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to toggle form status');
    }
  }
);

const initialState = {
  forms: [],
  searchTerm: '',
  loading: false,
  error: null,
  deleteModal: {
    isOpen: false,
    formId: null,
    formTitle: '',
    hasResponses: false,
    responseCount: 0,
    formStatus: null
  },
  activeMenu: null,
  isDeleting: false,
  formEnabledStatus: {},
  pagination: {
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  }
};

const formListSlice = createSlice({
  name: 'formList',
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setPageSize: (state, action) => {
      state.pagination.pageSize = action.payload;
      state.pagination.page = 1; // Reset to first page when changing page size
    },
    setActiveMenu: (state, action) => {
      state.activeMenu = action.payload;
    },
    openDeleteModal: (state, action) => {
      state.deleteModal = {
        isOpen: true,
        ...action.payload
      };
      state.activeMenu = null;
    },
    closeDeleteModal: (state) => {
      state.deleteModal = {
        isOpen: false,
        formId: null,
        formTitle: '',
        hasResponses: false,
        responseCount: 0,
        formStatus: null
      };
    },
    resetFormList: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch forms
      .addCase(fetchForms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchForms.fulfilled, (state, action) => {
        state.loading = false;
        state.forms = action.payload.forms;
        state.pagination.totalItems = action.payload.totalCount;
        state.pagination.totalPages = action.payload.totalPages;
        state.pagination.page = action.payload.page;
        
        // Initialize enabled status for each form
        const enabledStatus = {};
        action.payload.forms.forEach(form => {
          if (form.formId) {
            enabledStatus[form.formId] = form.isEnabled || false;
          }
        });
        state.formEnabledStatus = enabledStatus;
      })
      .addCase(fetchForms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.forms = [];
        state.pagination.totalItems = 0;
        state.pagination.totalPages = 0;
        toast.error('Error loading forms: ' + action.payload);
      })
      
      // Delete form
      .addCase(deleteForm.pending, (state) => {
        state.isDeleting = true;
      })
      .addCase(deleteForm.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.forms = state.forms.filter(form => form.formId !== action.payload.formId);
        state.pagination.totalItems = state.pagination.totalItems - 1;
        state.pagination.totalPages = Math.ceil((state.pagination.totalItems - 1) / state.pagination.pageSize);
        
        // Adjust page if necessary
        if (state.pagination.page > state.pagination.totalPages && state.pagination.totalPages > 0) {
          state.pagination.page = state.pagination.totalPages;
        }
      })
      .addCase(deleteForm.rejected, (state, action) => {
        state.isDeleting = false;
        toast.error(action.payload);
      })
      
      // Check form responses
      .addCase(checkFormResponses.fulfilled, (state, action) => {
        state.deleteModal.hasResponses = action.payload.hasResponses;
        state.deleteModal.responseCount = action.payload.responseCount;
      })
      
      // Toggle form enabled status
      .addCase(toggleFormEnabled.fulfilled, (state, action) => {
        const { formId, isEnabled } = action.payload;
        const formIndex = state.forms.findIndex(f => f.formId === formId);
        if (formIndex !== -1) {
          state.forms[formIndex].isEnabled = isEnabled;
          state.formEnabledStatus[formId] = isEnabled;
        }
      });
  }
});

export const {
  setSearchTerm,
  setPage,
  setPageSize,
  setActiveMenu,
  openDeleteModal,
  closeDeleteModal,
  resetFormList
} = formListSlice.actions;

export default formListSlice.reducer;