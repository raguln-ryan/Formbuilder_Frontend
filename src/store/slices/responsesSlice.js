import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import responseService from '../../services/responseService';

// Async thunks
export const fetchFormResponses = createAsyncThunk(
  'responses/fetchFormResponses',
  async ({ formId, page, pageSize, search }) => {
    return await responseService.getFormResponses(formId, page, pageSize, search);
  }
);

export const exportResponses = createAsyncThunk(
  'responses/exportResponses',
  async (formId) => {
    return await responseService.exportToCSV(formId);
  }
);

const responsesSlice = createSlice({
  name: 'responses',
  initialState: {
    responses: [],
    responsesTotalCount: 0,
    responsesPage: 1,
    responsesPageSize: 10,
    responsesSearch: '',
    selectedResponse: null,
    responseView: 'summary',
    sortField: 'submittedAt',
    sortDirection: 'desc',
    loading: false,
    error: null
  },
  reducers: {
    setResponsesPage: (state, action) => {
      state.responsesPage = action.payload;
    },
    setResponsesPageSize: (state, action) => {
      state.responsesPageSize = action.payload;
      state.responsesPage = 1;
    },
    setResponsesSearch: (state, action) => {
      state.responsesSearch = action.payload;
    },
    setSelectedResponse: (state, action) => {
      state.selectedResponse = action.payload;
    },
    setResponseView: (state, action) => {
      state.responseView = action.payload;
    },
    setSortField: (state, action) => {
      state.sortField = action.payload;
    },
    setSortDirection: (state, action) => {
      state.sortDirection = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFormResponses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFormResponses.fulfilled, (state, action) => {
        state.loading = false;
        state.responses = action.payload.data || [];
        state.responsesTotalCount = action.payload.totalCount || 0;
      })
      .addCase(fetchFormResponses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const {
  setResponsesPage,
  setResponsesPageSize,
  setResponsesSearch,
  setSelectedResponse,
  setResponseView,
  setSortField,
  setSortDirection
} = responsesSlice.actions;

export default responsesSlice.reducer;