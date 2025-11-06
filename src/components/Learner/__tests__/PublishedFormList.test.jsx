import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import PublishedFormList from '../PublishedFormList';
import { useAuth } from '../../../contexts/AuthContext';
import * as learnerSlice from '../../../store/slices/learnerSlice';
import { debounce } from 'lodash';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn()
}));

jest.mock('../../../contexts/AuthContext');

jest.mock('../../../store/slices/learnerSlice', () => ({
  fetchPublishedForms: jest.fn(),
  fetchMySubmissions: jest.fn(),
  checkExistingSubmission: jest.fn(),
  setActiveTab: jest.fn(),
  setPublishedFormsPage: jest.fn(),
  setPublishedFormsPageSize: jest.fn(),
  setPublishedFormsSearchTerm: jest.fn(),
  setSubmissionsPage: jest.fn(),
  setSubmissionsPageSize: jest.fn(),
  setSubmissionsSearchTerm: jest.fn(),
  setSubmissionsFilter: jest.fn(),
  setCurrentSubmission: jest.fn(),
  selectPublishedForms: jest.fn(),
  selectMySubmissions: jest.fn(),
  selectActiveTab: jest.fn(),
  selectExistingSubmissionCheck: jest.fn()
}));

jest.mock('lodash', () => ({
  debounce: jest.fn((fn) => {
    const debounced = (...args) => fn(...args);
    debounced.cancel = jest.fn();
    debounced.flush = jest.fn();
    return debounced;
  })
}));

jest.mock('../../Common/LoadingSpinner', () => {
  return function LoadingSpinner() {
    return <div>Loading...</div>;
  };
});

jest.mock('../../Common/NavigationBar', () => {
  return function NavigationBar() {
    return <div>NavigationBar</div>;
  };
});

jest.mock('../../Common/Modal', () => {
  return function Modal({ isOpen, onClose, onConfirm, type, lastSubmissionDate }) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <div>{type} Modal</div>
        {lastSubmissionDate && <div>Last submitted: {lastSubmissionDate}</div>}
        <button onClick={onClose}>Close</button>
        <button onClick={onConfirm}>Continue</button>
      </div>
    );
  };
});

describe('PublishedFormList', () => {
  let mockStore;
  let mockNavigate;
  let mockDispatch;

  beforeEach(() => {
    mockNavigate = jest.fn();
    mockDispatch = jest.fn();
    
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({ state: null });
    
    useAuth.mockReturnValue({
      user: { role: 'Learner' },
      isAuthenticated: true
    });

    // Default selector values
    learnerSlice.selectActiveTab.mockReturnValue('published');
    learnerSlice.selectPublishedForms.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      pagination: {
        page: 1,
        pageSize: 10,
        totalPages: 1,
        totalCount: 0
      },
      searchTerm: ''
    });
    learnerSlice.selectMySubmissions.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      pagination: {
        page: 1,
        pageSize: 10,
        totalPages: 1,
        totalCount: 0
      },
      searchTerm: '',
      filter: 'External Training Completion'
    });
    learnerSlice.selectExistingSubmissionCheck.mockReturnValue({
      checking: false,
      exists: false
    });

    // Setup mock store
    mockStore = configureStore({
      reducer: {
        learner: () => ({})
      }
    });
    mockStore.dispatch = mockDispatch;

    // Setup action creators
    learnerSlice.fetchPublishedForms.mockImplementation((payload) => ({
      type: 'fetchPublishedForms',
      payload
    }));
    learnerSlice.fetchMySubmissions.mockImplementation((payload) => ({
      type: 'fetchMySubmissions',
      payload
    }));
    learnerSlice.checkExistingSubmission.mockImplementation((formId) => ({
      type: 'checkExistingSubmission',
      payload: formId
    }));
    learnerSlice.checkExistingSubmission.fulfilled = {
      match: jest.fn(() => false)
    };
    learnerSlice.setActiveTab.mockImplementation((tab) => ({
      type: 'setActiveTab',
      payload: tab
    }));
    learnerSlice.setPublishedFormsPage.mockImplementation((page) => ({
      type: 'setPublishedFormsPage',
      payload: page
    }));
    learnerSlice.setPublishedFormsSearchTerm.mockImplementation((term) => ({
      type: 'setPublishedFormsSearchTerm',
      payload: term
    }));
    learnerSlice.setSubmissionsPage.mockImplementation((page) => ({
      type: 'setSubmissionsPage',
      payload: page
    }));
    learnerSlice.setSubmissionsPageSize.mockImplementation((size) => ({
      type: 'setSubmissionsPageSize',
      payload: size
    }));
    learnerSlice.setSubmissionsSearchTerm.mockImplementation((term) => ({
      type: 'setSubmissionsSearchTerm',
      payload: term
    }));
    learnerSlice.setSubmissionsFilter.mockImplementation((filter) => ({
      type: 'setSubmissionsFilter',
      payload: filter
    }));
    learnerSlice.setCurrentSubmission.mockImplementation((submission) => ({
      type: 'setCurrentSubmission',
      payload: submission
    }));
  });

  const renderComponent = () => {
    return render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <PublishedFormList />
        </BrowserRouter>
      </Provider>
    );
  };

  describe('Authentication', () => {
    test('redirects to login when not authenticated', () => {
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false
      });

      renderComponent();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('redirects to login when user role is not Learner', () => {
      useAuth.mockReturnValue({
        user: { role: 'Admin' },
        isAuthenticated: true
      });

      renderComponent();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('does not redirect when authenticated as Learner', () => {
      renderComponent();
      expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    });
  });

  describe('Tab Navigation', () => {
    test('sets active tab from location state', () => {
      useLocation.mockReturnValue({ state: { activeTab: 'submissions' } });
      
      renderComponent();
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setActiveTab',
        payload: 'submissions'
      });
    });

    test('switches to submissions tab when clicked', () => {
      renderComponent();
      
      const submissionsTab = screen.getByText('My Submissions');
      fireEvent.click(submissionsTab);
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setActiveTab',
        payload: 'submissions'
      });
    });

    test('switches to published tab when clicked', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      
      renderComponent();
      
      const publishedTab = screen.getByText('Self-Service Forms');
      fireEvent.click(publishedTab);
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setActiveTab',
        payload: 'published'
      });
    });

    test('shows active tab indicator for published tab', () => {
      renderComponent();
      
      const publishedTab = screen.getByText('Self-Service Forms').parentElement;
      expect(publishedTab.querySelector('.tab-indicator')).toBeInTheDocument();
    });

    test('shows active tab indicator for submissions tab', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      
      renderComponent();
      
      const submissionsTab = screen.getByText('My Submissions').parentElement;
      expect(submissionsTab.querySelector('.tab-indicator')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    test('fetches published forms on mount', () => {
      renderComponent();
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'fetchPublishedForms',
        payload: {
          page: 1,
          size: 10,
          search: ''
        }
      });
    });

    test('fetches submissions when submissions tab is active', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      
      renderComponent();
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'fetchMySubmissions',
        payload: {
          page: 1,
          size: 10,
          search: ''
        }
      });
    });

    test('refetches when pagination changes', () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        pagination: {
          page: 2,
          pageSize: 20,
          totalPages: 3,
          totalCount: 50
        },
        searchTerm: ''
      });

      renderComponent();

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'fetchPublishedForms',
        payload: {
          page: 2,
          size: 20,
          search: ''
        }
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading spinner when published forms are loading', () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [],
        loading: true,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 0 },
        searchTerm: ''
      });

      renderComponent();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('shows loading spinner when submissions are loading', () => {
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [],
        loading: true,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 0 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('handles published forms search input', async () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('Search');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setPublishedFormsSearchTerm',
        payload: 'test'
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'setPublishedFormsPage',
          payload: 1
        });
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'fetchPublishedForms',
          payload: {
            page: 1,
            size: 10,
            search: 'test'
          }
        });
      });
    });

    test('handles submissions search input', async () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [{ id: 1, formTitle: 'Test Form' }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('Search submissions...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setSubmissionsSearchTerm',
        payload: 'test'
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'setSubmissionsPage',
          payload: 1
        });
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'fetchMySubmissions',
          payload: {
            page: 1,
            size: 10,
            search: 'test'
          }
        });
      });
    });
  });

  describe('Published Forms Display', () => {
    test('displays published forms with all details', () => {
      const mockDate = new Date();
      mockDate.setDate(mockDate.getDate() + 5);
      
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [{
          formId: 'form1',
          title: 'Test Form',
          description: 'Test Description',
          dueDate: mockDate.toISOString(),
          createdAt: '2024-01-01T00:00:00Z'
        }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: ''
      });

      renderComponent();

      expect(screen.getByText('Test Form')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText(/Due in \d+ days/)).toBeInTheDocument();
      expect(screen.getByText(/Created: 01\/01\/2024/)).toBeInTheDocument();
    });

    test('displays form with defaults when missing data', () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [{
          id: 'form1'
        }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: ''
      });

      renderComponent();

      expect(screen.getByText('Untitled Form')).toBeInTheDocument();
      expect(screen.getByText('No description available')).toBeInTheDocument();
    });

    test('displays empty state when no forms', () => {
      renderComponent();

      expect(screen.getByText('No forms available')).toBeInTheDocument();
      expect(screen.getByText('No published forms available at the moment')).toBeInTheDocument();
    });

    test('displays search empty state', () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 0 },
        searchTerm: 'search term'
      });

      renderComponent();

      expect(screen.getByText('No forms available')).toBeInTheDocument();
      expect(screen.getByText('No forms match your search')).toBeInTheDocument();
    });

    test('displays error state with retry button', () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [],
        loading: false,
        error: 'Failed to load forms',
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 0 },
        searchTerm: ''
      });

      renderComponent();

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load forms')).toBeInTheDocument();
      
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'fetchPublishedForms',
        payload: {
          page: 1,
          size: 10,
          search: ''
        }
      });
    });
  });

  describe('Form Submission', () => {
    test('navigates to submission when no existing submission', async () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [{ formId: 'form1', title: 'Test Form' }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: ''
      });

      mockDispatch.mockResolvedValue({});
      learnerSlice.checkExistingSubmission.fulfilled.match.mockReturnValue(false);

      renderComponent();

      const submitButton = screen.getByText('Submit Response');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/form/form1/submission');
    });

    test('shows modal when existing submission exists', async () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [{ formId: 'form1', title: 'Test Form' }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: ''
      });

      const mockResult = {
        payload: {
          submittedAt: '2024-01-01T00:00:00Z'
        }
      };
      
      mockDispatch.mockResolvedValue(mockResult);
      learnerSlice.checkExistingSubmission.fulfilled.match.mockReturnValue(true);

      renderComponent();

      const submitButton = screen.getByText('Submit Response');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByText('submitted Modal')).toBeInTheDocument();
      });
    });

    test('handles continue submission from modal', async () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [{ formId: 'form1', title: 'Test Form' }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: ''
      });

      const mockResult = {
        payload: {
          submitted_at: '2024-01-01T00:00:00Z' // Test alternate property name
        }
      };
      
      mockDispatch.mockResolvedValue(mockResult);
      learnerSlice.checkExistingSubmission.fulfilled.match.mockReturnValue(true);

      renderComponent();

      const submitButton = screen.getByText('Submit Response');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      const continueButton = await screen.findByText('Continue');
      fireEvent.click(continueButton);

      expect(mockNavigate).toHaveBeenCalledWith('/form/form1/submission');
    });

    test('closes modal properly', async () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [{ formId: 'form1', title: 'Test Form' }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: ''
      });

      const mockResult = {
        payload: {
          submittedAt: '2024-01-01T00:00:00Z'
        }
      };
      
      mockDispatch.mockResolvedValue(mockResult);
      learnerSlice.checkExistingSubmission.fulfilled.match.mockReturnValue(true);

      renderComponent();

      const submitButton = screen.getByText('Submit Response');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      const closeButton = await screen.findByText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });
    });

    test('disables submit button when checking submission', () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [{ formId: 'form1', title: 'Test Form' }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: ''
      });
      learnerSlice.selectExistingSubmissionCheck.mockReturnValue({
        checking: true,
        exists: false
      });

      renderComponent();

      const submitButton = screen.getByText('Submit Response');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('My Submissions Display', () => {
    test('displays submission table with data', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [{
          id: 'sub1',
          formTitle: 'Training Form',
          submittedAt: '2024-01-15T10:30:00Z',
          status: 'approved'
        }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();

      expect(screen.getByText('Training Form')).toBeInTheDocument();
      expect(screen.getByText('Jan 15, 2024 at 10:30 AM')).toBeInTheDocument();
      expect(screen.getByText('Completion Approved')).toBeInTheDocument();
    });

    test('displays default form title when missing', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [{
          id: 'sub1',
          submittedAt: '2024-01-15T10:30:00Z',
          status: 'submitted'
        }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();

      expect(screen.getByText('External Training')).toBeInTheDocument();
    });

    test('displays rejected status correctly', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [{
          id: 'sub1',
          formTitle: 'Test',
          submittedAt: '2024-01-15T10:30:00Z',
          status: 'rejected'
        }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();

      expect(screen.getByText('Completion Rejected')).toBeInTheDocument();
    });

    test('displays default status when unknown', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [{
          id: 'sub1',
          formTitle: 'Test',
          submittedAt: '2024-01-15T10:30:00Z',
          status: 'pending'
        }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();

      expect(screen.getByText('Completion Submitted')).toBeInTheDocument();
    });

    test('handles null submission date', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [{
          id: 'sub1',
          formTitle: 'Test',
          submittedAt: null,
          status: 'submitted'
        }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();

      expect(screen.getByText('-')).toBeInTheDocument();
    });

    test('displays empty state without search', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      
      renderComponent();

      expect(screen.getByText('No submissions yet')).toBeInTheDocument();
      expect(screen.getByText(/You haven't submitted any forms yet/)).toBeInTheDocument();
      expect(screen.getByText('View Published Forms')).toBeInTheDocument();
    });

    test('displays empty state with search', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 0 },
        searchTerm: 'test search',
        filter: 'External Training Completion'
      });

      renderComponent();

      expect(screen.getByText('No submissions yet')).toBeInTheDocument();
      expect(screen.getByText('No submissions match your search "test search"')).toBeInTheDocument();
      expect(screen.queryByText('View Published Forms')).not.toBeInTheDocument();
    });

    test('navigates to published forms from empty state', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      
      renderComponent();

      const viewFormsButton = screen.getByText('View Published Forms');
      fireEvent.click(viewFormsButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setActiveTab',
        payload: 'published'
      });
    });
  });

  describe('Submission Actions', () => {
    test('handles view submission details', () => {
      const submission = {
        id: 'sub1',
        formTitle: 'Test Form',
        submittedAt: '2024-01-15T10:30:00Z',
        status: 'approved'
      };

      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [submission],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();

      const viewButton = screen.getByTitle('View Details');
      fireEvent.click(viewButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setCurrentSubmission',
        payload: submission
      });
      expect(mockNavigate).toHaveBeenCalledWith(
        '/submission/sub1/view',
        { state: { submission } }
      );
    });

    test('handles filter change', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 0 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();

      const filterSelect = screen.getByDisplayValue('External Training Completion');
      fireEvent.change(filterSelect, { target: { value: 'All Forms' } });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setSubmissionsFilter',
        payload: 'All Forms'
      });
    });
  });

  describe('Pagination - Published Forms', () => {
    test('shows pagination when multiple pages exist', () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 3, totalCount: 30 },
        searchTerm: ''
      });

      renderComponent();

      expect(screen.getByText('1 of 3')).toBeInTheDocument();
      
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    test('handles next page click', () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 3, totalCount: 30 },
        searchTerm: ''
      });

      renderComponent();

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setPublishedFormsPage',
        payload: 2
      });
    });

    test('handles previous page click', () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        pagination: { page: 2, pageSize: 10, totalPages: 3, totalCount: 30 },
        searchTerm: ''
      });

      renderComponent();

      const previousButton = screen.getByText('Previous');
      fireEvent.click(previousButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setPublishedFormsPage',
        payload: 1
      });
    });

    test('disables previous button on first page', () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 3, totalCount: 30 },
        searchTerm: ''
      });

      renderComponent();

      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });

    test('disables next button on last page', () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        pagination: { page: 3, pageSize: 10, totalPages: 3, totalCount: 30 },
        searchTerm: ''
      });

      renderComponent();

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    test('does not show pagination for single page', () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 5 },
        searchTerm: ''
      });

      renderComponent();

      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
  });

  describe('Pagination - Submissions', () => {
    test('shows submissions pagination when multiple pages exist', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [{ id: 1, formTitle: 'Test', submittedAt: '2024-01-01' }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 3, totalCount: 25 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();

      expect(screen.getByText('1 of 3 pages')).toBeInTheDocument();
      expect(screen.getByText('1–10 of 25 items')).toBeInTheDocument();
    });

    test('handles submissions next page', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [{ id: 1, formTitle: 'Test', submittedAt: '2024-01-01' }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 3, totalCount: 25 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();

      const nextButton = screen.getByText('→');
      fireEvent.click(nextButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setSubmissionsPage',
        payload: 2
      });
    });

    test('handles submissions previous page', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [{ id: 1, formTitle: 'Test', submittedAt: '2024-01-01' }],
        loading: false,
        error: null,
        pagination: { page: 2, pageSize: 10, totalPages: 3, totalCount: 25 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();

      const previousButton = screen.getByText('←');
      fireEvent.click(previousButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setSubmissionsPage',
        payload: 1
      });
    });

    test('prevents going below page 1', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [{ id: 1, formTitle: 'Test', submittedAt: '2024-01-01' }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 3, totalCount: 25 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();

      const previousButton = screen.getByText('←');
      expect(previousButton).toBeDisabled();
    });

    test('prevents going above max pages', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [{ id: 1, formTitle: 'Test', submittedAt: '2024-01-01' }],
        loading: false,
        error: null,
        pagination: { page: 3, pageSize: 10, totalPages: 3, totalCount: 25 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();

      const nextButton = screen.getByText('→');
      expect(nextButton).toBeDisabled();
    });

    test('handles page size change', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [{ id: 1, formTitle: 'Test', submittedAt: '2024-01-01' }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 3, totalCount: 25 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();

      const pageSizeSelect = screen.getByDisplayValue('10');
      fireEvent.change(pageSizeSelect, { target: { value: '25' } });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setSubmissionsPageSize',
        payload: 25
      });
    });

    test('displays correct item range on middle page', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [{ id: 1, formTitle: 'Test', submittedAt: '2024-01-01' }],
        loading: false,
        error: null,
        pagination: { page: 2, pageSize: 10, totalPages: 3, totalCount: 25 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();

      expect(screen.getByText('11–20 of 25 items')).toBeInTheDocument();
    });

    test('displays correct item range on last page', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [{ id: 1, formTitle: 'Test', submittedAt: '2024-01-01' }],
        loading: false,
        error: null,
        pagination: { page: 3, pageSize: 10, totalPages: 3, totalCount: 25 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();

      expect(screen.getByText('21–25 of 25 items')).toBeInTheDocument();
    });

    test('does not show submissions pagination for single page', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [{ id: 1, formTitle: 'Test', submittedAt: '2024-01-01' }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 5 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();

      expect(screen.queryByText('1 of 1 pages')).not.toBeInTheDocument();
      expect(screen.queryByText('←')).not.toBeInTheDocument();
      expect(screen.queryByText('→')).not.toBeInTheDocument();
    });
  });

  describe('Due Date Formatting', () => {
    test('displays overdue status', () => {
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 1);
      
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [{
          formId: 'form1',
          title: 'Test Form',
          dueDate: overdueDate.toISOString()
        }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: ''
      });

      renderComponent();

      expect(screen.getByText('Overdue')).toBeInTheDocument();
      const overdueElement = screen.getByText('Overdue');
      expect(overdueElement).toHaveClass('due-date overdue');
    });

    test('displays due today status', () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [{
          formId: 'form1',
          title: 'Test Form',
          dueDate: today.toISOString()
        }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: ''
      });

      renderComponent();

      expect(screen.getByText('Due Today')).toBeInTheDocument();
      const todayElement = screen.getByText('Due Today');
      expect(todayElement).toHaveClass('due-date today');
    });

    test('displays due in 7 days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [{
          formId: 'form1',
          title: 'Test Form',
          dueDate: futureDate.toISOString()
        }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: ''
      });

      renderComponent();

      expect(screen.getByText('Due in 7 days')).toBeInTheDocument();
      const soonElement = screen.getByText('Due in 7 days');
      expect(soonElement).toHaveClass('due-date soon');
    });

    test('displays due in multiple days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [{
          formId: 'form1',
          title: 'Test Form',
          dueDate: futureDate.toISOString()
        }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: ''
      });

      renderComponent();

      expect(screen.getByText('Due in 3 days')).toBeInTheDocument();
    });

    test('displays regular due date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [{
          formId: 'form1',
          title: 'Test Form',
          dueDate: futureDate.toISOString()
        }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: ''
      });

      renderComponent();

      const formattedDate = futureDate.toLocaleDateString();
      expect(screen.getByText(`Due: ${formattedDate}`)).toBeInTheDocument();
    });

    test('handles null due date', () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [{
          formId: 'form1',
          title: 'Test Form',
          dueDate: null
        }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: ''
      });

      renderComponent();

      expect(screen.queryByText(/Due/)).not.toBeInTheDocument();
    });

    test('handles undefined due date', () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [{
          formId: 'form1',
          title: 'Test Form'
        }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: ''
      });

      renderComponent();

      expect(screen.queryByText(/Due/)).not.toBeInTheDocument();
    });

    test('handles empty string due date', () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [{
          formId: 'form1',
          title: 'Test Form',
          dueDate: ''
        }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: ''
      });

      renderComponent();

      expect(screen.queryByText(/Due/)).not.toBeInTheDocument();
    });
  });

  describe('UI Elements', () => {
    test('renders filter button in submissions tab', () => {
      learnerSlice.selectActiveTab.mockReturnValue('submissions');
      learnerSlice.selectMySubmissions.mockReturnValue({
        data: [{ id: 1, formTitle: 'Test', submittedAt: '2024-01-01' }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: '',
        filter: 'External Training Completion'
      });

      renderComponent();

      const filterButton = screen.getByText('Filter');
      expect(filterButton).toBeInTheDocument();
      expect(filterButton.parentElement).toHaveClass('submission-filter-btn');
    });

    test('renders jilo icon in published forms', () => {
      renderComponent();

      const jiloImage = screen.getByAltText('Jilo');
      expect(jiloImage).toBeInTheDocument();
      expect(jiloImage).toHaveClass('jilo-icon');
    });

    test('renders search icon in published forms', () => {
      renderComponent();

      const searchIcon = screen.getByAltText('Search');
      expect(searchIcon).toBeInTheDocument();
      expect(searchIcon).toHaveClass('search-icon');
    });

    test('renders info text in published forms', () => {
      renderComponent();

      expect(screen.getByText('These forms are optional and can be submitted multiple times if needed.')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles form with only id property', () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [{ id: 'form1' }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: ''
      });

      renderComponent();

      const submitButton = screen.getByText('Submit Response');
      fireEvent.click(submitButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'checkExistingSubmission',
        payload: 'form1'
      });
    });

    test('handles debounced search with rapid typing', async () => {
      jest.useFakeTimers();
      
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('Search');
      
      fireEvent.change(searchInput, { target: { value: 'a' } });
      fireEvent.change(searchInput, { target: { value: 'ab' } });
      fireEvent.change(searchInput, { target: { value: 'abc' } });
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setPublishedFormsSearchTerm',
        payload: 'abc'
      });
      
      jest.runAllTimers();
      
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'fetchPublishedForms',
          payload: expect.any(Object)
        });
      });
      
      jest.useRealTimers();
    });

    test('handles location state change', () => {
      const { rerender } = renderComponent();

      useLocation.mockReturnValue({ state: { activeTab: 'submissions' } });

      rerender(
        <Provider store={mockStore}>
          <BrowserRouter>
            <PublishedFormList />
          </BrowserRouter>
        </Provider>
      );

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setActiveTab',
        payload: 'submissions'
      });
    });

    test('handles authentication change', () => {
      const { rerender } = renderComponent();

      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false
      });

      rerender(
        <Provider store={mockStore}>
          <BrowserRouter>
            <PublishedFormList />
          </BrowserRouter>
        </Provider>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('handles null location state', () => {
      useLocation.mockReturnValue({ state: null });
      
      renderComponent();
      
      // Should not crash and should render normally
      expect(screen.getByText('Self-Service Forms')).toBeInTheDocument();
    });

    test('handles empty result from checkExistingSubmission', async () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [{ formId: 'form1', title: 'Test' }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: ''
      });

      mockDispatch.mockResolvedValue({});
      learnerSlice.checkExistingSubmission.fulfilled.match.mockReturnValue(false);

      renderComponent();

      const submitButton = screen.getByText('Submit Response');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/form/form1/submission');
    });

    test('handles createdAt without date', () => {
      learnerSlice.selectPublishedForms.mockReturnValue({
        data: [{
          formId: 'form1',
          title: 'Test Form',
          createdAt: null
        }],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, totalPages: 1, totalCount: 1 },
        searchTerm: ''
      });

      renderComponent();

      expect(screen.queryByText(/Created:/)).not.toBeInTheDocument();
    });
  });

  describe('Component Cleanup', () => {
    test('cleans up on unmount', () => {
      const { unmount } = renderComponent();
      
      unmount();
      
      // Component should unmount without errors
      expect(true).toBe(true);
    });

    test('handles multiple rapid tab switches', () => {
      renderComponent();
      
      const submissionsTab = screen.getByText('My Submissions');
      const publishedTab = screen.getByText('Self-Service Forms');
      
      fireEvent.click(submissionsTab);
      fireEvent.click(publishedTab);
      fireEvent.click(submissionsTab);
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setActiveTab',
        payload: 'submissions'
      });
    });
  });
});
