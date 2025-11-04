import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import formService from '../../services/formService';
import toast from 'react-hot-toast';

export const fetchForms = createAsyncThunk(
  'formList/fetchForms',
  async ({ page, pageSize, search }, { rejectWithValue }) => {
    try {
      const response = await formService.getAllForms(page, pageSize, search);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch forms');
    }
  }
);

export const deleteForm = createAsyncThunk(
  'formList/deleteForm',
  async (formId, { rejectWithValue }) => {
    try {
      await formService.deleteForm(formId);
      return formId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete form');
    }
  }
);

export const toggleFormStatus = createAsyncThunk(
  'formList/toggleStatus',
  async ({ formId, isEnabled }, { rejectWithValue }) => {
    try {
      await formService.toggleFormStatus(formId, isEnabled);
      return { formId, isEnabled };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle status');
    }
  }
);

const formListSlice = createSlice({
  name: 'formList',
  initialState: {
    forms: [],
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    searchTerm: '',
    loading: false,
    error: null,
    deleteModal: { isOpen: false, formId: null, formTitle: '' },
    publishModal: { isOpen: false, formId: null }
  },
  reducers: {
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload;
      state.currentPage = 1;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
      state.currentPage = 1;
    },
    openDeleteModal: (state, action) => {
      state.deleteModal = { isOpen: true, ...action.payload };
    },
    closeDeleteModal: (state) => {
      state.deleteModal = { isOpen: false, formId: null, formTitle: '' };
    },
    openPublishModal: (state, action) => {
      state.publishModal = { isOpen: true, formId: action.payload };
    },
    closePublishModal: (state) => {
      state.publishModal = { isOpen: false, formId: null };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch forms
      .addCase(fetchForms.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchForms.fulfilled, (state, action) => {
        state.loading = false;
        state.forms = action.payload.data || [];
        state.totalCount = action.payload.totalCount || 0;
      })
      .addCase(fetchForms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete form
      .addCase(deleteForm.fulfilled, (state, action) => {
        state.forms = state.forms.filter(f => f.formId !== action.payload);
        toast.success('Form deleted successfully');
      })
      .addCase(deleteForm.rejected, (state, action) => {
        toast.error(action.payload);
      })
      // Toggle status
      .addCase(toggleFormStatus.fulfilled, (state, action) => {
        const form = state.forms.find(f => f.formId === action.payload.formId);
        if (form) {
          form.isEnabled = action.payload.isEnabled;
        }
        toast.success(`Form ${action.payload.isEnabled ? 'enabled' : 'disabled'}`);
      });
  }
});

export const {
  setCurrentPage,
  setPageSize,
  setSearchTerm,
  openDeleteModal,
  closeDeleteModal,
  openPublishModal,
  closePublishModal
} = formListSlice.actions;

export default formListSlice.reducer;