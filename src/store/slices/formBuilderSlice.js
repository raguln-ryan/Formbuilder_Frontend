import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import formService from '../../services/formService';
import toast from 'react-hot-toast';

export const fetchFormById = createAsyncThunk(
  'formBuilder/fetchForm',
  async (formId, { rejectWithValue }) => {
    try {
      const response = await formService.getFormById(formId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch form');
    }
  }
);

export const saveFormConfig = createAsyncThunk(
  'formBuilder/saveConfig',
  async ({ formId, formData }, { rejectWithValue }) => {
    try {
      if (!formId) {
        const response = await formService.createForm(formData);
        return { formId: response.formId, ...formData };
      } else {
        await formService.updateFormConfig(formId, formData);
        return { formId, ...formData };
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save form');
    }
  }
);

export const saveFormLayout = createAsyncThunk(
  'formBuilder/saveLayout',
  async ({ formId, questions }, { rejectWithValue }) => {
    try {
      const response = await formService.updateForm(formId, { questions });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save layout');
    }
  }
);

export const publishForm = createAsyncThunk(
  'formBuilder/publish',
  async (formId, { getState, rejectWithValue }) => {
    try {
      const { questions } = getState().formBuilder;
      await formService.updateForm(formId, { questions });
      const response = await formService.publishForm(formId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to publish');
    }
  }
);

const formBuilderSlice = createSlice({
  name: 'formBuilder',
  initialState: {
    formData: {
      title: '',
      description: '',
      isVisible: true
    },
    questions: [],
    currentFormId: null,
    activeTab: 'config',
    loading: false,
    saving: false,
    error: null,
    showPreview: false
  },
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    updateFormConfig: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    setQuestions: (state, action) => {
      state.questions = action.payload;
    },
    addQuestion: (state, action) => {
      state.questions.push(action.payload);
      toast.success('Question added successfully!');
    },
    updateQuestion: (state, action) => {
      const index = state.questions.findIndex(q => q._id === action.payload.id);
      if (index !== -1) {
        state.questions[index] = action.payload.data;
      }
    },
    deleteQuestion: (state, action) => {
      state.questions = state.questions.filter(q => q._id !== action.payload);
      toast.success('Question deleted');
    },
    duplicateQuestion: (state, action) => {
      const newQuestion = {
        ...action.payload,
        _id: `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        question: `${action.payload.question} (Copy)`
      };
      state.questions.push(newQuestion);
      toast.success('Question duplicated');
    },
    reorderQuestions: (state, action) => {
      state.questions = action.payload;
    },
    togglePreview: (state) => {
      state.showPreview = !state.showPreview;
    },
    resetFormBuilder: (state) => {
      state.formData = { title: '', description: '', isVisible: true };
      state.questions = [];
      state.currentFormId = null;
      state.activeTab = 'config';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch form
      .addCase(fetchFormById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFormById.fulfilled, (state, action) => {
        state.loading = false;
        state.formData = {
          title: action.payload.title || '',
          description: action.payload.description || '',
          isVisible: action.payload.isVisible !== undefined ? action.payload.isVisible : true
        };
        state.questions = action.payload.questions || [];
        state.currentFormId = action.payload.formId;
      })
      .addCase(fetchFormById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Save config
      .addCase(saveFormConfig.pending, (state) => {
        state.saving = true;
      })
      .addCase(saveFormConfig.fulfilled, (state, action) => {
        state.saving = false;
        state.currentFormId = action.payload.formId;
        toast.success('Form configuration saved!');
      })
      .addCase(saveFormConfig.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      // Publish
      .addCase(publishForm.fulfilled, (state) => {
        toast.success('Form published successfully!');
      })
      .addCase(publishForm.rejected, (state, action) => {
        toast.error(action.payload);
      });
  }
});

export const {
  setActiveTab,
  updateFormConfig,
  setQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  reorderQuestions,
  togglePreview,
  resetFormBuilder
} = formBuilderSlice.actions;

export default formBuilderSlice.reducer;