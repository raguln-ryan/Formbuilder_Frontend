import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    modals: {
      delete: { isOpen: false, data: null },
      publish: { isOpen: false, data: null },
      clear: { isOpen: false, data: null },
      submitted: { isOpen: false, data: null }
    },
    activeMenu: null,
    draggedQuestionIndex: null,
    dragOverIndex: null,
    showPreview: false
  },
  reducers: {
    openModal: (state, action) => {
      const { type, data } = action.payload;
      state.modals[type] = { isOpen: true, data };
    },
    closeModal: (state, action) => {
      const type = action.payload;
      state.modals[type] = { isOpen: false, data: null };
    },
    setActiveMenu: (state, action) => {
      state.activeMenu = action.payload;
    },
    setDraggedQuestionIndex: (state, action) => {
      state.draggedQuestionIndex = action.payload;
    },
    setDragOverIndex: (state, action) => {
      state.dragOverIndex = action.payload;
    },
    togglePreview: (state) => {
      state.showPreview = !state.showPreview;
    }
  }
});

export const {
  openModal,
  closeModal,
  setActiveMenu,
  setDraggedQuestionIndex,
  setDragOverIndex,
  togglePreview
} = uiSlice.actions;

export default uiSlice.reducer;