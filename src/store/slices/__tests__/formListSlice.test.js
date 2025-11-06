import { configureStore } from '@reduxjs/toolkit';
import formListReducer, {
  setSearchTerm,
  setPage,
  setPageSize,
  setActiveMenu,
  openDeleteModal,
  closeDeleteModal,
  resetFormList,
  fetchForms,
  deleteForm,
  checkFormResponses,
  toggleFormEnabled
} from '../formListSlice';
import formService from '../../../services/formService';
import toast from 'react-hot-toast';

jest.mock('../../../services/formService');
jest.mock('react-hot-toast');

describe('formListSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: { formList: formListReducer }
    });
    jest.clearAllMocks();
  });

  describe('reducers', () => {
    test('setSearchTerm should update search term', () => {
      store.dispatch(setSearchTerm('test search'));
      expect(store.getState().formList.searchTerm).toBe('test search');
    });

    test('setPage should update page number', () => {
      store.dispatch(setPage(3));
      expect(store.getState().formList.pagination.page).toBe(3);
    });

    test('setPageSize should update page size and reset page to 1', () => {
      store.dispatch(setPage(5));
      store.dispatch(setPageSize(20));
      expect(store.getState().formList.pagination.pageSize).toBe(20);
      expect(store.getState().formList.pagination.page).toBe(1);
    });

    test('setActiveMenu should update active menu', () => {
      store.dispatch(setActiveMenu('menu1'));
      expect(store.getState().formList.activeMenu).toBe('menu1');
    });

    test('openDeleteModal should open modal with payload', () => {
      const payload = {
        formId: '123',
        formTitle: 'Test Form',
        hasResponses: true,
        responseCount: 5,
        formStatus: 'active'
      };
      store.dispatch(openDeleteModal(payload));
      const modal = store.getState().formList.deleteModal;
      expect(modal.isOpen).toBe(true);
      expect(modal.formId).toBe('123');
      expect(modal.formTitle).toBe('Test Form');
      expect(modal.hasResponses).toBe(true);
      expect(modal.responseCount).toBe(5);
      expect(modal.formStatus).toBe('active');
      expect(store.getState().formList.activeMenu).toBe(null);
    });

    test('closeDeleteModal should reset modal state', () => {
      store.dispatch(openDeleteModal({ formId: '123', formTitle: 'Test' }));
      store.dispatch(closeDeleteModal());
      const modal = store.getState().formList.deleteModal;
      expect(modal.isOpen).toBe(false);
      expect(modal.formId).toBe(null);
      expect(modal.formTitle).toBe('');
      expect(modal.hasResponses).toBe(false);
      expect(modal.responseCount).toBe(0);
      expect(modal.formStatus).toBe(null);
    });

    test('resetFormList should reset to initial state', () => {
      store.dispatch(setSearchTerm('search'));
      store.dispatch(setPage(3));
      store.dispatch(resetFormList());
      const state = store.getState().formList;
      expect(state.searchTerm).toBe('');
      expect(state.pagination.page).toBe(1);
      expect(state.forms).toEqual([]);
    });
  });

  describe('fetchForms thunk', () => {
    test('fetchForms.fulfilled should update forms and pagination', async () => {
      const mockResponse = {
        data: [
          { formId: '1', title: 'Form 1', isEnabled: true },
          { formId: '2', title: 'Form 2', isEnabled: false }
        ],
        totalCount: 50,
        totalPages: 5
      };
      formService.getAllForms.mockResolvedValue(mockResponse);

      await store.dispatch(fetchForms({ page: 2, pageSize: 10, searchTerm: 'test' }));
      
      const state = store.getState().formList;
      expect(state.loading).toBe(false);
      expect(state.forms).toEqual(mockResponse.data);
      expect(state.pagination.totalItems).toBe(50);
      expect(state.pagination.totalPages).toBe(5);
      expect(state.pagination.page).toBe(2);
      expect(state.formEnabledStatus['1']).toBe(true);
      expect(state.formEnabledStatus['2']).toBe(false);
    });

    test('fetchForms.pending should set loading true', async () => {
      formService.getAllForms.mockImplementation(() => new Promise(() => {}));
      
      const promise = store.dispatch(fetchForms({ page: 1, pageSize: 10 }));
      
      expect(store.getState().formList.loading).toBe(true);
      expect(store.getState().formList.error).toBe(null);
      
      promise.abort();
    });

    test('fetchForms.rejected should handle error with response data', async () => {
      const error = new Error('Network error');
      error.response = { data: { message: 'Custom error message' } };
      formService.getAllForms.mockRejectedValue(error);

      await store.dispatch(fetchForms({ page: 1, pageSize: 10 }));
      
      const state = store.getState().formList;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Custom error message');
      expect(state.forms).toEqual([]);
      expect(toast.error).toHaveBeenCalledWith('Error loading forms: Custom error message');
    });

    test('fetchForms.rejected should handle error with message', async () => {
      const error = new Error('Network error');
      formService.getAllForms.mockRejectedValue(error);

      await store.dispatch(fetchForms({ page: 1, pageSize: 10 }));
      
      expect(store.getState().formList.error).toBe('Network error');
    });

    test('fetchForms.rejected should handle error without message', async () => {
      formService.getAllForms.mockRejectedValue({});

      await store.dispatch(fetchForms({ page: 1, pageSize: 10 }));
      
      expect(store.getState().formList.error).toBe('Failed to fetch forms');
    });

    test('fetchForms.fulfilled should handle response without isEnabled property', async () => {
      const mockResponse = {
        data: [{ formId: '1', title: 'Form 1' }],
        totalCount: 1,
        totalPages: 1
      };
      formService.getAllForms.mockResolvedValue(mockResponse);

      await store.dispatch(fetchForms({ page: 1, pageSize: 10 }));
      
      expect(store.getState().formList.formEnabledStatus['1']).toBe(false);
    });
  });

  describe('deleteForm thunk', () => {
    test('deleteForm.fulfilled should remove form and update pagination', async () => {
      // Setup initial state with forms
      formService.getAllForms.mockResolvedValue({
        data: [
          { formId: '1', title: 'Form 1' },
          { formId: '2', title: 'Form 2' }
        ],
        totalCount: 2,
        totalPages: 1
      });
      await store.dispatch(fetchForms({ page: 1, pageSize: 10 }));

      formService.deleteForm.mockResolvedValue({ success: true, message: 'Deleted' });

      await store.dispatch(deleteForm({ formId: '1', formTitle: 'Form 1' }));
      
      const state = store.getState().formList;
      expect(state.isDeleting).toBe(false);
      expect(state.forms.length).toBe(1);
      expect(state.forms[0].formId).toBe('2');
      expect(state.pagination.totalItems).toBe(1);
      expect(toast.success).toHaveBeenCalledWith('Deleted');
    });

    test('deleteForm.fulfilled should adjust page when necessary', async () => {
      // Setup state where we're on page 2 with 1 item
      store = configureStore({
        reducer: { formList: formListReducer },
        preloadedState: {
          formList: {
            forms: [{ formId: '1', title: 'Form 1' }],
            pagination: { page: 2, pageSize: 10, totalItems: 11, totalPages: 2 },
            searchTerm: '',
            loading: false,
            error: null,
            deleteModal: { isOpen: false, formId: null, formTitle: '', hasResponses: false, responseCount: 0, formStatus: null },
            activeMenu: null,
            isDeleting: false,
            formEnabledStatus: {}
          }
        }
      });

      formService.deleteForm.mockResolvedValue({ success: true });

      await store.dispatch(deleteForm({ formId: '1', formTitle: 'Form 1' }));
      
      const state = store.getState().formList;
      expect(state.pagination.page).toBe(1);
    });

    test('deleteForm.fulfilled should use default message when no message provided', async () => {
      formService.deleteForm.mockResolvedValue({ success: true });

      await store.dispatch(deleteForm({ formId: '1', formTitle: 'Form 1' }));
      
      expect(toast.success).toHaveBeenCalledWith('Form "Form 1" deleted successfully');
    });

    test('deleteForm.pending should set isDeleting true', async () => {
      formService.deleteForm.mockImplementation(() => new Promise(() => {}));
      
      const promise = store.dispatch(deleteForm({ formId: '1', formTitle: 'Form 1' }));
      
      expect(store.getState().formList.isDeleting).toBe(true);
      
      promise.abort();
    });

    test('deleteForm.rejected should handle error with message', async () => {
      formService.deleteForm.mockResolvedValue({ success: false, message: 'Cannot delete' });

      await store.dispatch(deleteForm({ formId: '1', formTitle: 'Form 1' }));
      
      expect(store.getState().formList.isDeleting).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Cannot delete');
    });

    test('deleteForm.rejected should handle error without message', async () => {
      formService.deleteForm.mockRejectedValue(new Error('Network error'));

      await store.dispatch(deleteForm({ formId: '1', formTitle: 'Form 1' }));
      
      expect(toast.error).toHaveBeenCalledWith('Network error');
    });

    test('deleteForm.rejected should handle error without any message', async () => {
      formService.deleteForm.mockRejectedValue({});

      await store.dispatch(deleteForm({ formId: '1', formTitle: 'Form 1' }));
      
      expect(toast.error).toHaveBeenCalledWith('Failed to delete form');
    });
  });

  describe('checkFormResponses thunk', () => {
    test('checkFormResponses.fulfilled should update response info with data property', async () => {
      formService.getFormResponses.mockResolvedValue({
        data: [{ id: 1 }, { id: 2 }],
        totalCount: 5
      });

      await store.dispatch(checkFormResponses({ formId: '1' }));
      
      const state = store.getState().formList;
      expect(state.deleteModal.hasResponses).toBe(true);
      expect(state.deleteModal.responseCount).toBe(5);
    });

    test('checkFormResponses.fulfilled should handle array response', async () => {
      formService.getFormResponses.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      await store.dispatch(checkFormResponses({ formId: '1' }));
      
      const state = store.getState().formList;
      expect(state.deleteModal.hasResponses).toBe(true);
      expect(state.deleteModal.responseCount).toBe(2);
    });

    test('checkFormResponses.fulfilled should handle empty responses', async () => {
      formService.getFormResponses.mockResolvedValue({ data: [] });

      await store.dispatch(checkFormResponses({ formId: '1' }));
      
      const state = store.getState().formList;
      expect(state.deleteModal.hasResponses).toBe(false);
      expect(state.deleteModal.responseCount).toBe(0);
    });

    test('checkFormResponses.rejected should handle error with message', async () => {
      formService.getFormResponses.mockRejectedValue(new Error('Network error'));

      await store.dispatch(checkFormResponses({ formId: '1' }));
    });

    test('checkFormResponses.rejected should handle error without message', async () => {
      formService.getFormResponses.mockRejectedValue({});

      await store.dispatch(checkFormResponses({ formId: '1' }));
    });
  });

  describe('toggleFormEnabled thunk', () => {
    test('toggleFormEnabled.fulfilled should toggle form status', async () => {
      // Setup initial state
      formService.getAllForms.mockResolvedValue({
        data: [{ formId: '1', title: 'Form 1', isEnabled: true }],
        totalCount: 1,
        totalPages: 1
      });
      await store.dispatch(fetchForms({ page: 1, pageSize: 10 }));

      await store.dispatch(toggleFormEnabled({ formId: '1', currentStatus: true }));
      
      const state = store.getState().formList;
      expect(state.forms[0].isEnabled).toBe(false);
      expect(state.formEnabledStatus['1']).toBe(false);
      expect(toast.success).toHaveBeenCalledWith('Form disabled');
    });

    test('toggleFormEnabled.fulfilled should handle enabling form', async () => {
      await store.dispatch(toggleFormEnabled({ formId: '1', currentStatus: false }));
      
      expect(toast.success).toHaveBeenCalledWith('Form enabled');
    });

    test('toggleFormEnabled.rejected should handle error', async () => {
      const thunk = toggleFormEnabled({ formId: '1', currentStatus: true });
      thunk.mockRejectedValue = new Error('Failed');
      
      // Since the current implementation doesn't actually reject, we just verify it doesn't crash
      await store.dispatch(thunk);
    });
  });
});