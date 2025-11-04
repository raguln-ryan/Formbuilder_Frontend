import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import responseService from '../../services/responseService';

export const fetchResponses = createAsyncThunk(
  'responses/fetchResponses',
  async ({ formId, page, pageSize, searchTerm }) => {
    const result = await responseService.getFormResponses(formId, page, pageSize, searchTerm);
    console.log('Raw response data:', result); // Debug log
    
    // Format the responses here
    const formattedData = result.data?.map(response => ({
      id: response.id || response.responseId,
      submittedBy: response.submittedBy || response.user?.name || response.userName || 'Anonymous',
      userId: response.userId || response.user?.id || '-',
      email: response.email || response.user?.email || response.userEmail || '-',
      submittedAt: response.submittedAt || response.createdAt,
      details: response.details || response.answers || [],
      // Keep original response for reference
      originalData: response
    })) || [];
    
    return {
      data: formattedData,
      totalCount: result.totalCount || 0,
      formId
    };
  }
);

const responseSlice = createSlice({
  name: 'responses',
  initialState: {
    responses: [],
    totalItems: 0,
    loading: false,
    error: null,
    currentFormId: null
  },
  reducers: {
    clearResponses: (state) => {
      state.responses = [];
      state.totalItems = 0;
      state.currentFormId = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResponses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchResponses.fulfilled, (state, action) => {
        state.loading = false;
        state.responses = action.payload.data;
        state.totalItems = action.payload.totalCount;
        state.currentFormId = action.payload.formId;
      })
      .addCase(fetchResponses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.responses = [];
        state.totalItems = 0;
      });
  },
});

export const { clearResponses } = responseSlice.actions;
export default responseSlice.reducer;