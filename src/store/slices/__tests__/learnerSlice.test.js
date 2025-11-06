import { configureStore } from '@reduxjs/toolkit';
import learnerReducer, {
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
  resetLearnerState,
  fetchPublishedForms,
  fetchMySubmissions,
  fetchFormDetails,
  submitFormResponse,
  fetchResponseDetails,
  checkExistingSubmission,
  selectPublishedForms,
  selectMySubmissions,
  selectCurrentForm,
  selectCurrentSubmission,
  selectFormSubmission,
  selectActiveTab,
  selectExistingSubmissionCheck
} from '../learnerSlice';
import responseService from '../../../services/responseService';
import toast from 'react-hot-toast';

jest.mock('../../../services/responseService');
jest.mock('react-hot-toast');

describe('learnerSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: { learner: learnerReducer }
    });
    jest.clearAllMocks();
  });

  describe('reducers', () => {
    test('setActiveTab should update active tab', () => {
      store.dispatch(setActiveTab('submissions'));
      expect(store.getState().learner.activeTab).toBe('submissions');
    });

    test('setPublishedFormsPage should update page', () => {
      store.dispatch(setPublishedFormsPage(3));
      expect(store.getState().learner.publishedForms.pagination.page).toBe(3);
    });

    test('setPublishedFormsPageSize should update page size and reset page', () => {
      store.dispatch(setPublishedFormsPage(3));
      store.dispatch(setPublishedFormsPageSize(20));
      expect(store.getState().learner.publishedForms.pagination.pageSize).toBe(20);
      expect(store.getState().learner.publishedForms.pagination.page).toBe(1);
    });

    test('setPublishedFormsSearchTerm should update search term', () => {
      store.dispatch(setPublishedFormsSearchTerm('test'));
      expect(store.getState().learner.publishedForms.searchTerm).toBe('test');
    });

    test('setSubmissionsPage should update page', () => {
      store.dispatch(setSubmissionsPage(2));
      expect(store.getState().learner.mySubmissions.pagination.page).toBe(2);
    });

    test('setSubmissionsPageSize should update page size and reset page', () => {
      store.dispatch(setSubmissionsPage(3));
      store.dispatch(setSubmissionsPageSize(15));
      expect(store.getState().learner.mySubmissions.pagination.pageSize).toBe(15);
      expect(store.getState().learner.mySubmissions.pagination.page).toBe(1);
    });

    test('setSubmissionsSearchTerm should update search term', () => {
      store.dispatch(setSubmissionsSearchTerm('search'));
      expect(store.getState().learner.mySubmissions.searchTerm).toBe('search');
    });

    test('setSubmissionsFilter should update filter', () => {
      store.dispatch(setSubmissionsFilter('All'));
      expect(store.getState().learner.mySubmissions.filter).toBe('All');
    });

    test('resetFormSubmission should reset submission state', () => {
      store.dispatch(resetFormSubmission());
      const state = store.getState().learner.formSubmission;
      expect(state.submitting).toBe(false);
      expect(state.success).toBe(false);
      expect(state.error).toBe(null);
      expect(state.submissionDetails).toBe(null);
    });

    test('setCurrentSubmission should set submission data', () => {
      const submission = { id: 1, formId: '123' };
      store.dispatch(setCurrentSubmission(submission));
      expect(store.getState().learner.currentSubmission.data).toEqual(submission);
    });

    test('clearCurrentForm should clear form state', () => {
      store.dispatch(clearCurrentForm());
      const state = store.getState().learner.currentForm;
      expect(state.data).toBe(null);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });

    test('clearCurrentSubmission should clear submission state', () => {
      store.dispatch(clearCurrentSubmission());
      const state = store.getState().learner.currentSubmission;
      expect(state.data).toBe(null);
      expect(state.responseDetails).toBe(null);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });

    test('resetLearnerState should reset entire state', () => {
      store.dispatch(setActiveTab('submissions'));
      store.dispatch(setPublishedFormsPage(3));
      store.dispatch(resetLearnerState());
      const state = store.getState().learner;
      expect(state.activeTab).toBe('published');
      expect(state.publishedForms.pagination.page).toBe(1);
    });
  });

  describe('fetchPublishedForms thunk', () => {
    test('fetchPublishedForms.pending should set loading state', async () => {
      responseService.getPublishedForms.mockImplementation(() => new Promise(() => {}));
      
      const promise = store.dispatch(fetchPublishedForms({ page: 1, size: 10, search: '' }));
      
      const state = store.getState().learner.publishedForms;
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
      
      promise.abort();
    });

    test('fetchPublishedForms.fulfilled should handle paginated response', async () => {
      const mockResponse = {
        data: [{ id: 1, title: 'Form 1' }],
        totalCount: 50,
        totalPages: 5
      };
      responseService.getPublishedForms.mockResolvedValue(mockResponse);

      await store.dispatch(fetchPublishedForms({ page: 1, size: 10, search: '' }));
      
      const state = store.getState().learner.publishedForms;
      expect(state.loading).toBe(false);
      expect(state.data).toEqual(mockResponse.data);
      expect(state.pagination.totalCount).toBe(50);
      expect(state.pagination.totalPages).toBe(5);
    });

    test('fetchPublishedForms.fulfilled should handle array response', async () => {
      const mockResponse = [{ id: 1 }, { id: 2 }];
      responseService.getPublishedForms.mockResolvedValue(mockResponse);

      await store.dispatch(fetchPublishedForms({ page: 1, size: 10, search: '' }));
      
      const state = store.getState().learner.publishedForms;
      expect(state.data).toEqual(mockResponse);
      expect(state.pagination.totalCount).toBe(2);
      expect(state.pagination.totalPages).toBe(1);
    });

    test('fetchPublishedForms.fulfilled should handle empty/invalid response', async () => {
      responseService.getPublishedForms.mockResolvedValue(null);

      await store.dispatch(fetchPublishedForms({ page: 1, size: 10, search: '' }));
      
      const state = store.getState().learner.publishedForms;
      expect(state.data).toEqual([]);
      expect(state.pagination.totalCount).toBe(0);
      expect(state.pagination.totalPages).toBe(0);
    });

    test('fetchPublishedForms.fulfilled should calculate totalPages when missing', async () => {
      const mockResponse = {
        data: [{ id: 1 }],
        totalCount: 25
      };
      responseService.getPublishedForms.mockResolvedValue(mockResponse);

      await store.dispatch(fetchPublishedForms({ page: 1, size: 10, search: '' }));
      
      expect(store.getState().learner.publishedForms.pagination.totalPages).toBe(3);
    });

    test('fetchPublishedForms.rejected should handle error', async () => {
      responseService.getPublishedForms.mockRejectedValue(new Error('Network error'));

      await store.dispatch(fetchPublishedForms({ page: 1, size: 10, search: '' }));
      
      const state = store.getState().learner.publishedForms;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
      expect(state.data).toEqual([]);
      expect(toast.error).toHaveBeenCalledWith('Failed to load published forms');
    });

    test('fetchPublishedForms.rejected should handle error without message', async () => {
      responseService.getPublishedForms.mockRejectedValue({});

      await store.dispatch(fetchPublishedForms({ page: 1, size: 10, search: '' }));
      
      expect(store.getState().learner.publishedForms.error).toBe('Failed to fetch published forms');
    });
  });

  describe('fetchMySubmissions thunk', () => {
    test('fetchMySubmissions.pending should set loading state', async () => {
      responseService.getMySubmissions.mockImplementation(() => new Promise(() => {}));
      
      const promise = store.dispatch(fetchMySubmissions({ page: 1, size: 10, search: '' }));
      
      const state = store.getState().learner.mySubmissions;
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
      
      promise.abort();
    });

    test('fetchMySubmissions.fulfilled should handle paginated response', async () => {
      const mockResponse = {
        data: [{ id: 1, formId: '123' }],
        totalCount: 30,
        totalPages: 3
      };
      responseService.getMySubmissions.mockResolvedValue(mockResponse);

      await store.dispatch(fetchMySubmissions({ page: 1, size: 10, search: '' }));
      
      const state = store.getState().learner.mySubmissions;
      expect(state.loading).toBe(false);
      expect(state.data).toEqual(mockResponse.data);
      expect(state.pagination.totalCount).toBe(30);
      expect(state.pagination.totalPages).toBe(3);
    });

    test('fetchMySubmissions.fulfilled should handle array response', async () => {
      const mockResponse = [{ id: 1 }, { id: 2 }, { id: 3 }];
      responseService.getMySubmissions.mockResolvedValue(mockResponse);

      await store.dispatch(fetchMySubmissions({ page: 1, size: 10, search: '' }));
      
      const state = store.getState().learner.mySubmissions;
      expect(state.data).toEqual(mockResponse);
      expect(state.pagination.totalCount).toBe(3);
      expect(state.pagination.totalPages).toBe(1);
    });

    test('fetchMySubmissions.fulfilled should handle empty response', async () => {
      responseService.getMySubmissions.mockResolvedValue({});

      await store.dispatch(fetchMySubmissions({ page: 1, size: 10, search: '' }));
      
      const state = store.getState().learner.mySubmissions;
      expect(state.data).toEqual([]);
      expect(state.pagination.totalCount).toBe(0);
      expect(state.pagination.totalPages).toBe(0);
    });

    test('fetchMySubmissions.fulfilled should calculate totalPages', async () => {
      const mockResponse = {
        data: [{ id: 1 }],
        totalCount: 45
      };
      responseService.getMySubmissions.mockResolvedValue(mockResponse);

      await store.dispatch(fetchMySubmissions({ page: 1, size: 10, search: '' }));
      
      expect(store.getState().learner.mySubmissions.pagination.totalPages).toBe(5);
    });

    test('fetchMySubmissions.rejected should handle error', async () => {
      responseService.getMySubmissions.mockRejectedValue(new Error('API error'));

      await store.dispatch(fetchMySubmissions({ page: 1, size: 10, search: '' }));
      
      const state = store.getState().learner.mySubmissions;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('API error');
      expect(state.data).toEqual([]);
    });

    test('fetchMySubmissions.rejected should handle error without message', async () => {
      responseService.getMySubmissions.mockRejectedValue({});

      await store.dispatch(fetchMySubmissions({ page: 1, size: 10, search: '' }));
      
      expect(store.getState().learner.mySubmissions.error).toBe('Failed to fetch submissions');
    });
  });

  describe('fetchFormDetails thunk', () => {
    test('fetchFormDetails.pending should set loading state', async () => {
      responseService.getFormById.mockImplementation(() => new Promise(() => {}));
      
      const promise = store.dispatch(fetchFormDetails('123'));
      
      const state = store.getState().learner.currentForm;
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
      
      promise.abort();
    });

    test('fetchFormDetails.fulfilled should set form data', async () => {
      const mockForm = { id: '123', title: 'Test Form' };
      responseService.getFormById.mockResolvedValue(mockForm);

      await store.dispatch(fetchFormDetails('123'));
      
      const state = store.getState().learner.currentForm;
      expect(state.loading).toBe(false);
      expect(state.data).toEqual(mockForm);
    });

    test('fetchFormDetails.rejected should handle error', async () => {
      responseService.getFormById.mockRejectedValue(new Error('Not found'));

      await store.dispatch(fetchFormDetails('123'));
      
      const state = store.getState().learner.currentForm;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Not found');
      expect(toast.error).toHaveBeenCalledWith('Failed to load form details');
    });

    test('fetchFormDetails.rejected should handle error without message', async () => {
      responseService.getFormById.mockRejectedValue({});

      await store.dispatch(fetchFormDetails('123'));
      
      expect(store.getState().learner.currentForm.error).toBe('Failed to fetch form details');
    });
  });

  describe('submitFormResponse thunk', () => {
    test('submitFormResponse.pending should set submitting state', async () => {
      responseService.submitResponse.mockImplementation(() => new Promise(() => {}));
      
      const promise = store.dispatch(submitFormResponse({ formId: '123' }));
      
      const state = store.getState().learner.formSubmission;
      expect(state.submitting).toBe(true);
      expect(state.error).toBe(null);
      expect(state.success).toBe(false);
      
      promise.abort();
    });

    test('submitFormResponse.fulfilled should handle success', async () => {
      const mockResponse = { id: '456', formId: '123' };
      responseService.submitResponse.mockResolvedValue(mockResponse);

      await store.dispatch(submitFormResponse({ formId: '123' }));
      
      const state = store.getState().learner.formSubmission;
      expect(state.submitting).toBe(false);
      expect(state.success).toBe(true);
      expect(state.submissionDetails).toEqual(mockResponse);
      expect(toast.success).toHaveBeenCalledWith('Form submitted successfully!');
    });

    test('submitFormResponse.rejected should handle error with response data', async () => {
      const error = new Error();
      error.response = { data: { message: 'Validation failed' } };
      responseService.submitResponse.mockRejectedValue(error);

      await store.dispatch(submitFormResponse({ formId: '123' }));
      
      const state = store.getState().learner.formSubmission;
      expect(state.submitting).toBe(false);
      expect(state.success).toBe(false);
      expect(state.error).toBe('Validation failed');
      expect(toast.error).toHaveBeenCalledWith('Validation failed');
    });

    test('submitFormResponse.rejected should handle error without response', async () => {
      responseService.submitResponse.mockRejectedValue({});

      await store.dispatch(submitFormResponse({ formId: '123' }));
      
      const state = store.getState().learner.formSubmission;
      expect(state.error).toBe('Failed to submit form');
      expect(toast.error).toHaveBeenCalledWith('Failed to submit form');
    });
  });

  describe('fetchResponseDetails thunk', () => {
    test('fetchResponseDetails.pending should set loading state', async () => {
      responseService.getResponseDetails.mockImplementation(() => new Promise(() => {}));
      
      const promise = store.dispatch(fetchResponseDetails('123'));
      
      const state = store.getState().learner.currentSubmission;
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
      
      promise.abort();
    });

    test('fetchResponseDetails.fulfilled should set response details', async () => {
      const mockResponse = { id: '123', answers: [] };
      responseService.getResponseDetails.mockResolvedValue(mockResponse);

      await store.dispatch(fetchResponseDetails('123'));
      
      const state = store.getState().learner.currentSubmission;
      expect(state.loading).toBe(false);
      expect(state.responseDetails).toEqual(mockResponse);
    });

    test('fetchResponseDetails.fulfilled should handle 403 status', async () => {
      const error = new Error('Forbidden');
      error.response = { status: 403 };
      responseService.getResponseDetails.mockRejectedValue(error);

      await store.dispatch(fetchResponseDetails('123'));
      
      const state = store.getState().learner.currentSubmission;
      expect(state.loading).toBe(false);
      expect(state.responseDetails).toBe(null);
    });

    test('fetchResponseDetails.rejected should handle other errors', async () => {
      responseService.getResponseDetails.mockRejectedValue(new Error('Server error'));

      await store.dispatch(fetchResponseDetails('123'));
      
      const state = store.getState().learner.currentSubmission;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Server error');
    });

    test('fetchResponseDetails.rejected should handle error without message', async () => {
      responseService.getResponseDetails.mockRejectedValue({});

      await store.dispatch(fetchResponseDetails('123'));
      
      expect(store.getState().learner.currentSubmission.error).toBe('Failed to fetch response details');
    });
  });

  describe('checkExistingSubmission thunk', () => {
    test('checkExistingSubmission.pending should set checking state', async () => {
      responseService.getMySubmissions.mockImplementation(() => new Promise(() => {}));
      
      const promise = store.dispatch(checkExistingSubmission('123'));
      
      const state = store.getState().learner.existingSubmissionCheck;
      expect(state.checking).toBe(true);
      expect(state.error).toBe(null);
      
      promise.abort();
    });

    test('checkExistingSubmission.fulfilled should find submission by formId', async () => {
      const mockSubmissions = {
        data: [
          { id: '1', formId: '123', title: 'Submission 1' },
          { id: '2', formId: '456', title: 'Submission 2' }
        ]
      };
      responseService.getMySubmissions.mockResolvedValue(mockSubmissions);

      await store.dispatch(checkExistingSubmission('123'));
      
      const state = store.getState().learner.existingSubmissionCheck;
      expect(state.checking).toBe(false);
      expect(state.submission).toEqual(mockSubmissions.data[0]);
    });

    test('checkExistingSubmission.fulfilled should find submission by form_id', async () => {
      const mockSubmissions = [
        { id: '1', form_id: '123', title: 'Submission 1' }
      ];
      responseService.getMySubmissions.mockResolvedValue(mockSubmissions);

      await store.dispatch(checkExistingSubmission('123'));
      
      const state = store.getState().learner.existingSubmissionCheck;
      expect(state.submission).toEqual(mockSubmissions[0]);
    });

    test('checkExistingSubmission.fulfilled should find submission by form.id', async () => {
      const mockSubmissions = [
        { id: '1', form: { id: '123' }, title: 'Submission 1' }
      ];
      responseService.getMySubmissions.mockResolvedValue(mockSubmissions);

      await store.dispatch(checkExistingSubmission('123'));
      
      const state = store.getState().learner.existingSubmissionCheck;
      expect(state.submission).toEqual(mockSubmissions[0]);
    });

    test('checkExistingSubmission.fulfilled should find submission by form.formId', async () => {
      const mockSubmissions = [
        { id: '1', form: { formId: '123' }, title: 'Submission 1' }
      ];
      responseService.getMySubmissions.mockResolvedValue(mockSubmissions);

      await store.dispatch(checkExistingSubmission('123'));
      
      const state = store.getState().learner.existingSubmissionCheck;
      expect(state.submission).toEqual(mockSubmissions[0]);
    });

    test('checkExistingSubmission.fulfilled should return null when no submission found', async () => {
      const mockSubmissions = [
        { id: '1', formId: '456', title: 'Other submission' }
      ];
      responseService.getMySubmissions.mockResolvedValue(mockSubmissions);

      await store.dispatch(checkExistingSubmission('123'));
      
      const state = store.getState().learner.existingSubmissionCheck;
      expect(state.submission).toBe(null);
    });

    test('checkExistingSubmission.fulfilled should handle empty submissions', async () => {
      responseService.getMySubmissions.mockResolvedValue([]);

      await store.dispatch(checkExistingSubmission('123'));
      
      const state = store.getState().learner.existingSubmissionCheck;
      expect(state.submission).toBe(null);
    });

    test('checkExistingSubmission.rejected should handle error', async () => {
      responseService.getMySubmissions.mockRejectedValue(new Error('API error'));

      await store.dispatch(checkExistingSubmission('123'));
      
      const state = store.getState().learner.existingSubmissionCheck;
      expect(state.checking).toBe(false);
      expect(state.error).toBe('API error');
    });

    test('checkExistingSubmission.rejected should handle error without message', async () => {
      responseService.getMySubmissions.mockRejectedValue({});

      await store.dispatch(checkExistingSubmission('123'));
      
      expect(store.getState().learner.existingSubmissionCheck.error).toBe('Failed to check submissions');
    });
  });

  describe('selectors', () => {
    test('selectPublishedForms should return published forms state', () => {
      const state = { learner: store.getState().learner };
      expect(selectPublishedForms(state)).toEqual(state.learner.publishedForms);
    });

    test('selectMySubmissions should return my submissions state', () => {
      const state = { learner: store.getState().learner };
      expect(selectMySubmissions(state)).toEqual(state.learner.mySubmissions);
    });

    test('selectCurrentForm should return current form state', () => {
      const state = { learner: store.getState().learner };
      expect(selectCurrentForm(state)).toEqual(state.learner.currentForm);
    });

    test('selectCurrentSubmission should return current submission state', () => {
      const state = { learner: store.getState().learner };
      expect(selectCurrentSubmission(state)).toEqual(state.learner.currentSubmission);
    });

    test('selectFormSubmission should return form submission state', () => {
      const state = { learner: store.getState().learner };
      expect(selectFormSubmission(state)).toEqual(state.learner.formSubmission);
    });

    test('selectActiveTab should return active tab', () => {
      const state = { learner: store.getState().learner };
      expect(selectActiveTab(state)).toBe('published');
    });

    test('selectExistingSubmissionCheck should return existing submission check state', () => {
      const state = { learner: store.getState().learner };
      expect(selectExistingSubmissionCheck(state)).toEqual(state.learner.existingSubmissionCheck);
    });
  });

  describe('edge cases and combined scenarios', () => {
    test('should handle multiple async operations correctly', async () => {
      // Setup mock responses
      responseService.getPublishedForms.mockResolvedValue({
        data: [{ id: 1, title: 'Form 1' }],
        totalCount: 1,
        totalPages: 1
      });
      responseService.getMySubmissions.mockResolvedValue({
        data: [{ id: 1, formId: '123' }],
        totalCount: 1,
        totalPages: 1
      });

      // Execute multiple async operations
      await Promise.all([
        store.dispatch(fetchPublishedForms({ page: 1, size: 10, search: '' })),
        store.dispatch(fetchMySubmissions({ page: 1, size: 10, search: '' }))
      ]);

      const state = store.getState().learner;
      expect(state.publishedForms.data.length).toBe(1);
      expect(state.mySubmissions.data.length).toBe(1);
    });

    test('should maintain state consistency after multiple operations', () => {
      // Perform multiple synchronous operations
      store.dispatch(setActiveTab('submissions'));
      store.dispatch(setPublishedFormsPage(2));
      store.dispatch(setSubmissionsPage(3));
      store.dispatch(setPublishedFormsSearchTerm('search1'));
      store.dispatch(setSubmissionsSearchTerm('search2'));
      
      const state = store.getState().learner;
      expect(state.activeTab).toBe('submissions');
      expect(state.publishedForms.pagination.page).toBe(2);
      expect(state.mySubmissions.pagination.page).toBe(3);
      expect(state.publishedForms.searchTerm).toBe('search1');
      expect(state.mySubmissions.searchTerm).toBe('search2');
    });

    test('should handle form submission flow end-to-end', async () => {
      // Setup mock responses
      const mockForm = { id: '123', title: 'Test Form' };
      const mockSubmission = { id: '456', formId: '123' };
      
      responseService.getFormById.mockResolvedValue(mockForm);
      responseService.submitResponse.mockResolvedValue(mockSubmission);
      responseService.getMySubmissions.mockResolvedValue([]);

      // Check for existing submission
      await store.dispatch(checkExistingSubmission('123'));
      expect(store.getState().learner.existingSubmissionCheck.submission).toBe(null);

      // Fetch form details
      await store.dispatch(fetchFormDetails('123'));
      expect(store.getState().learner.currentForm.data).toEqual(mockForm);

      // Submit form
      await store.dispatch(submitFormResponse({ formId: '123' }));
      expect(store.getState().learner.formSubmission.success).toBe(true);

      // Reset submission state
      store.dispatch(resetFormSubmission());
      expect(store.getState().learner.formSubmission.success).toBe(false);
    });

    test('should handle pagination edge cases', async () => {
      // Test with zero total count
      responseService.getPublishedForms.mockResolvedValue({
        data: [],
        totalCount: 0
      });

      await store.dispatch(fetchPublishedForms({ page: 1, size: 10, search: '' }));
      
      const state = store.getState().learner.publishedForms;
      expect(state.pagination.totalPages).toBe(0);
      expect(state.data).toEqual([]);
    });

    test('should handle clearing operations correctly', () => {
      // Set some data first
      store.dispatch(setCurrentSubmission({ id: '123' }));
      expect(store.getState().learner.currentSubmission.data).toEqual({ id: '123' });
      
      // Clear the data
      store.dispatch(clearCurrentSubmission());
      expect(store.getState().learner.currentSubmission.data).toBe(null);
      
      // Clear form
      store.dispatch(clearCurrentForm());
      expect(store.getState().learner.currentForm.data).toBe(null);
    });

    test('should handle state reset correctly', () => {
      // Modify multiple parts of state
      store.dispatch(setActiveTab('submissions'));
      store.dispatch(setPublishedFormsPage(5));
      store.dispatch(setSubmissionsFilter('All'));
      
      // Reset entire state
      store.dispatch(resetLearnerState());
      
      const state = store.getState().learner;
      expect(state.activeTab).toBe('published');
      expect(state.publishedForms.pagination.page).toBe(1);
      expect(state.mySubmissions.filter).toBe('External Training Completion');
    });
  });
});