import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import FormList from '../FormList';
import { useAuth } from '../../../contexts/AuthContext';
import * as formListSlice from '../../../store/slices/formListSlice';
import { debounce } from 'lodash';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn()
}));

jest.mock('../../../contexts/AuthContext');

jest.mock('lodash', () => ({
  debounce: jest.fn((fn) => {
    const debounced = (...args) => fn(...args);
    debounced.cancel = jest.fn();
    return debounced;
  })
}));

jest.mock('../../Common/LoadingSpinner', () => {
  return function LoadingSpinner() {
    return <div>Loading...</div>;
  };
});

jest.mock('../../Common/Button', () => {
  return function Button({ children, onClick, ...props }) {
    return <button onClick={onClick} {...props}>{children}</button>;
  };
});

jest.mock('../../Common/Modal', () => {
  return function Modal({ isOpen, onClose, onConfirm, title, message, confirmText }) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <div>{title}</div>
        <div>{message}</div>
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm}>{confirmText || 'Confirm'}</button>
      </div>
    );
  };
});

// Create mock reducer
const createMockReducer = (initialState) => {
  return (state = initialState, action) => {
    if (action.type === 'formList/setActiveMenu') {
      return { ...state, activeMenu: action.payload };
    }
    if (action.type === 'formList/setSearchTerm') {
      return { ...state, searchTerm: action.payload };
    }
    if (action.type === 'formList/setPage') {
      return { ...state, pagination: { ...state.pagination, page: action.payload } };
    }
    if (action.type === 'formList/setPageSize') {
      return { ...state, pagination: { ...state.pagination, pageSize: action.payload } };
    }
    if (action.type === 'formList/closeDeleteModal') {
      return { ...state, deleteModal: { ...state.deleteModal, isOpen: false } };
    }
    if (action.type === 'formList/openDeleteModal') {
      return { ...state, deleteModal: { ...state.deleteModal, isOpen: true, ...action.payload } };
    }
    return state;
  };
};

describe('FormList', () => {
  let mockStore;
  let mockNavigate;
  let mockDispatch;
  let initialState;

  beforeEach(() => {
    mockNavigate = jest.fn();
    mockDispatch = jest.fn((action) => {
      if (typeof action === 'function') {
        return action(mockDispatch);
      }
      return action;
    });
    
    useNavigate.mockReturnValue(mockNavigate);
    useAuth.mockReturnValue({
      user: { role: 'Admin' },
      isAuthenticated: true
    });

    initialState = {
      forms: [],
      searchTerm: '',
      loading: false,
      error: null,
      deleteModal: {
        isOpen: false,
        formId: null,
        formTitle: '',
        formStatus: null,
        hasResponses: false,
        responseCount: 0
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

    // Setup all action creators
    Object.keys(formListSlice).forEach(key => {
      if (typeof formListSlice[key] === 'function') {
        formListSlice[key] = jest.fn((payload) => ({
          type: `formList/${key}`,
          payload
        }));
      }
    });

    // Setup async action matchers
    formListSlice.checkFormResponses.fulfilled = { match: jest.fn(() => false) };
    formListSlice.deleteForm.fulfilled = { match: jest.fn(() => false) };

    mockStore = configureStore({
      reducer: {
        formList: createMockReducer(initialState)
      }
    });
    mockStore.dispatch = mockDispatch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (customState = {}) => {
    const state = { ...initialState, ...customState };
    mockStore = configureStore({
      reducer: {
        formList: createMockReducer(state)
      }
    });
    mockStore.dispatch = mockDispatch;

    return render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormList />
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

    test('redirects to login when user is not Admin', () => {
      useAuth.mockReturnValue({
        user: { role: 'Learner' },
        isAuthenticated: true
      });

      renderComponent();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('does not redirect when authenticated as Admin', () => {
      renderComponent();
      expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    });
  });

  describe('Component Lifecycle', () => {
    test('dispatches resetFormList on unmount', () => {
      const { unmount } = renderComponent();
      
      unmount();
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/resetFormList'
      });
    });

    test('fetches forms on mount', () => {
      renderComponent();

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/fetchForms',
        payload: { page: 1, pageSize: 10, searchTerm: '' }
      });
    });

    test('fetches forms when page changes', () => {
      renderComponent({ 
        pagination: { page: 2, pageSize: 10, totalItems: 20, totalPages: 2 }
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/fetchForms',
        payload: { page: 2, pageSize: 10, searchTerm: '' }
      });
    });

    test('fetches forms when pageSize changes', () => {
      renderComponent({ 
        pagination: { page: 1, pageSize: 20, totalItems: 50, totalPages: 3 }
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/fetchForms',
        payload: { page: 1, pageSize: 20, searchTerm: '' }
      });
    });
  });

  describe('Search Functionality', () => {
    test('handles search input change', async () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/setSearchTerm',
        payload: 'test'
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'formList/setPage',
          payload: 1
        });
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'formList/fetchForms',
          payload: { page: 1, pageSize: 10, searchTerm: 'test' }
        });
      });
    });

    test('handles clear search', () => {
      renderComponent({ searchTerm: 'test' });

      const clearButton = screen.getByText('Clear Search');
      fireEvent.click(clearButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/setSearchTerm',
        payload: ''
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/setPage',
        payload: 1
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/fetchForms',
        payload: { page: 1, pageSize: 10, searchTerm: '' }
      });
    });
  });

  describe('Loading and Error States', () => {
    test('shows loading spinner when loading without search', () => {
      renderComponent({ loading: true, searchTerm: '' });
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('shows search loading when loading with search', () => {
      renderComponent({ loading: true, searchTerm: 'test' });
      expect(screen.getByText('Searching for "test"...')).toBeInTheDocument();
    });

    test('shows error state with retry', () => {
      renderComponent({ error: 'Failed to load forms' });

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load forms')).toBeInTheDocument();

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/fetchForms',
        payload: { page: 1, pageSize: 10, searchTerm: '' }
      });
    });
  });

  describe('Empty States', () => {
    test('shows empty state without search', () => {
      renderComponent({ forms: [] });

      expect(screen.getByText('No forms found')).toBeInTheDocument();
      expect(screen.getByText('Create your first form to get started')).toBeInTheDocument();
      
      const createButton = screen.getAllByText('Create Form')[1];
      fireEvent.click(createButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/form/new');
    });

    test('shows empty state with search', () => {
      renderComponent({ forms: [], searchTerm: 'test' });

      expect(screen.getByText('No forms found')).toBeInTheDocument();
      expect(screen.getByText('No forms match your search "test"')).toBeInTheDocument();
    });
  });

  describe('Form Display', () => {
    const mockForms = [
      {
        formId: '1',
        title: 'Test Form 1',
        status: 0,
        createdBy: 'Admin',
        createdAt: '2024-01-01',
        isEnabled: false
      },
      {
        formId: '2',
        title: 'Published Form',
        status: 1,
        publishedBy: 'Admin',
        publishedAt: '2024-01-02',
        isEnabled: true
      }
    ];

    test('displays draft forms correctly', () => {
      renderComponent({ forms: [mockForms[0]] });

      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Created by:')).toBeInTheDocument();
      expect(screen.getByText('1/1/2024')).toBeInTheDocument();
    });

    test('displays published forms correctly', () => {
      renderComponent({ forms: [mockForms[1]] });

      expect(screen.getByText('Published Form')).toBeInTheDocument();
      expect(screen.getByText('Published')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Published by:')).toBeInTheDocument();
      expect(screen.getByText('Enabled')).toBeInTheDocument();
    });

    test('handles form without title', () => {
      renderComponent({ 
        forms: [{ ...mockForms[0], title: null }] 
      });

      expect(screen.getByText('Untitled Form')).toBeInTheDocument();
    });

    test('handles form without dates', () => {
      renderComponent({ 
        forms: [{ ...mockForms[0], createdAt: null }] 
      });

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Menu Actions', () => {
    const mockForms = [
      {
        formId: '1',
        title: 'Draft Form',
        status: 0,
        isEnabled: false
      },
      {
        formId: '2',
        title: 'Published Form',
        status: 1,
        isEnabled: true
      }
    ];

    test('toggles menu on click', () => {
      renderComponent({ forms: mockForms });

      const menuButton = screen.getAllByLabelText('More options')[0];
      fireEvent.click(menuButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/setActiveMenu',
        payload: '1'
      });
    });

    test('closes menu when clicking same button', () => {
      renderComponent({ forms: mockForms, activeMenu: '1' });

      const menuButton = screen.getAllByLabelText('More options')[0];
      fireEvent.click(menuButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/setActiveMenu',
        payload: null
      });
    });

    test('shows draft menu options', () => {
      renderComponent({ forms: mockForms, activeMenu: '1' });

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Publish')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    test('shows published menu options', () => {
      renderComponent({ forms: mockForms, activeMenu: '2' });

      expect(screen.getByText('View Form')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    test('handles edit action', () => {
      renderComponent({ forms: mockForms, activeMenu: '1' });

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(mockNavigate).toHaveBeenCalledWith('/form/1/edit');
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/setActiveMenu',
        payload: null
      });
    });

    test('handles view form action', () => {
      renderComponent({ forms: mockForms, activeMenu: '2' });

      const viewButton = screen.getByText('View Form');
      fireEvent.click(viewButton);

      expect(mockNavigate).toHaveBeenCalledWith(
        '/form/2/view',
        { state: { activeTab: 'configuration' } }
      );
    });

    test('handles publish action', () => {
      renderComponent({ forms: mockForms, activeMenu: '1' });

      const publishButton = screen.getByText('Publish');
      fireEvent.click(publishButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/setActiveMenu',
        payload: null
      });
    });

    test('closes menu on outside click', () => {
      renderComponent({ forms: mockForms, activeMenu: '1' });

      // Simulate clicking outside
      fireEvent.click(document.body);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/setActiveMenu',
        payload: null
      });
    });

    test('does not close menu when clicking inside menu', () => {
      const { container } = renderComponent({ forms: mockForms, activeMenu: '1' });

      const menuContainer = container.querySelector('.menu-container');
      fireEvent.click(menuContainer);

      expect(mockDispatch).not.toHaveBeenCalledWith({
        type: 'formList/setActiveMenu',
        payload: null
      });
    });
  });

  describe('Toggle Enable/Disable', () => {
    test('handles toggle enable for published form', () => {
      const mockForms = [{
        formId: '1',
        title: 'Published Form',
        status: 1,
        isEnabled: false
      }];

      renderComponent({ forms: mockForms });

      const toggleSwitch = screen.getByRole('checkbox');
      fireEvent.change(toggleSwitch, { target: { checked: true } });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/toggleFormEnabled',
        payload: { formId: '1', currentStatus: false }
      });
    });

    test('handles toggle disable for published form', () => {
      const mockForms = [{
        formId: '1',
        title: 'Published Form',
        status: 1,
        isEnabled: true
      }];

      renderComponent({ forms: mockForms });

      const toggleSwitch = screen.getByRole('checkbox');
      fireEvent.change(toggleSwitch, { target: { checked: false } });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/toggleFormEnabled',
        payload: { formId: '1', currentStatus: true }
      });
    });
  });

  describe('View Responses', () => {
    test('handles view responses for published form', () => {
      const mockForms = [{
        formId: '1',
        title: 'Published Form',
        status: 1
      }];

      renderComponent({ forms: mockForms });

      const viewResponsesBtn = screen.getByText('View Responses');
      fireEvent.click(viewResponsesBtn);

      expect(mockNavigate).toHaveBeenCalledWith(
        '/form/1/view',
        { state: { activeTab: 'responses' } }
      );
    });

    test('disables view responses for draft form', () => {
      const mockForms = [{
        formId: '1',
        title: 'Draft Form',
        status: 0
      }];

      renderComponent({ forms: mockForms });

      const viewResponsesBtn = screen.getByText('View Responses');
      expect(viewResponsesBtn).toBeDisabled();
      expect(viewResponsesBtn).toHaveAttribute('title', 'Publish form to view responses');
    });

    test('does not navigate when clicking disabled view responses', () => {
      const mockForms = [{
        formId: '1',
        title: 'Draft Form',
        status: 0
      }];

      renderComponent({ forms: mockForms });

      const viewResponsesBtn = screen.getByText('View Responses');
      fireEvent.click(viewResponsesBtn);

      expect(mockNavigate).not.toHaveBeenCalledWith(
        '/form/1/view',
        expect.any(Object)
      );
    });
  });

  describe('Delete Flow', () => {
    test('handles delete click for draft form', async () => {
      const mockForms = [{
        formId: '1',
        title: 'Draft Form',
        status: 0
      }];

      renderComponent({ forms: mockForms, activeMenu: '1' });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/openDeleteModal',
        payload: {
          formId: '1',
          formTitle: 'Draft Form',
          formStatus: 0
        }
      });
    });

    test('checks responses before delete for published form', async () => {
      const mockForms = [{
        formId: '2',
        title: 'Published Form',
        status: 1
      }];

      mockDispatch.mockResolvedValue({ 
        payload: { hasResponses: true, responseCount: 5 } 
      });
      formListSlice.checkFormResponses.fulfilled.match.mockReturnValue(true);

      renderComponent({ forms: mockForms, activeMenu: '2' });

      const deleteButton = screen.getByText('Delete');
      await act(async () => {
        fireEvent.click(deleteButton);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/checkFormResponses',
        payload: { formId: '2' }
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/openDeleteModal',
        payload: {
          formId: '2',
          formTitle: 'Published Form',
          formStatus: 1,
          hasResponses: true,
          responseCount: 5
        }
      });
    });

    test('confirms delete with responses', async () => {
      mockDispatch.mockResolvedValue({ type: 'formList/deleteForm/fulfilled' });
      formListSlice.deleteForm.fulfilled.match.mockReturnValue(true);

      renderComponent({ 
        deleteModal: {
          isOpen: true,
          formId: '1',
          formTitle: 'Test Form',
          hasResponses: true,
          responseCount: 3
        },
        pagination: { page: 1, pageSize: 10, totalItems: 11, totalPages: 2 }
      });

      const modal = screen.getByTestId('modal');
      expect(modal).toBeInTheDocument();
      expect(screen.getByText(/This form has 3 submission/)).toBeInTheDocument();

      const confirmButton = screen.getByText('Yes, Delete');
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/closeDeleteModal'
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/deleteForm',
        payload: { formId: '1', formTitle: 'Test Form' }
      });
    });

    test('handles delete with page adjustment', async () => {
      mockDispatch.mockResolvedValue({ type: 'formList/deleteForm/fulfilled' });
      formListSlice.deleteForm.fulfilled.match.mockReturnValue(true);

      renderComponent({ 
        deleteModal: {
          isOpen: true,
          formId: '1',
          formTitle: 'Test Form'
        },
        pagination: { page: 2, pageSize: 10, totalItems: 11, totalPages: 2 }
      });

      jest.useFakeTimers();

      const confirmButton = screen.getByText('Yes, Delete');
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/fetchForms',
        payload: { page: 1, pageSize: 10, searchTerm: '' }
      });

      jest.useRealTimers();
    });

    test('prevents delete while deleting', async () => {
      renderComponent({ 
        deleteModal: {
          isOpen: true,
          formId: '1',
          formTitle: 'Test Form'
        },
        isDeleting: true
      });

      const confirmButton = screen.getByText('Yes, Delete');
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      expect(mockDispatch).not.toHaveBeenCalledWith({
        type: 'formList/deleteForm',
        payload: expect.any(Object)
      });
    });

    test('cancels delete modal', () => {
      renderComponent({ 
        deleteModal: {
          isOpen: true,
          formId: '1',
          formTitle: 'Test Form'
        }
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/closeDeleteModal'
      });
    });
  });

  describe('Pagination', () => {
    test('shows pagination when totalPages > 1', () => {
      renderComponent({
        forms: [{ formId: '1', title: 'Form 1' }],
        pagination: { page: 1, pageSize: 10, totalItems: 25, totalPages: 3 }
      });

      expect(screen.getByText('Showing 1 to 10 of 25 forms')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    test('handles next page navigation', () => {
      window.scrollTo = jest.fn();
      
      renderComponent({
        forms: [{ formId: '1', title: 'Form 1' }],
        pagination: { page: 1, pageSize: 10, totalItems: 25, totalPages: 3 }
      });

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/setPage',
        payload: 2
      });
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    test('handles previous page navigation', () => {
      window.scrollTo = jest.fn();

      renderComponent({
        forms: [{ formId: '1', title: 'Form 1' }],
        pagination: { page: 2, pageSize: 10, totalItems: 25, totalPages: 3 }
      });

      const prevButton = screen.getByText('Previous');
      fireEvent.click(prevButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/setPage',
        payload: 1
      });
    });

    test('disables previous on first page', () => {
      renderComponent({
        forms: [{ formId: '1', title: 'Form 1' }],
        pagination: { page: 1, pageSize: 10, totalItems: 25, totalPages: 3 }
      });

      const prevButton = screen.getByText('Previous');
      expect(prevButton).toBeDisabled();
    });

    test('disables next on last page', () => {
      renderComponent({
        forms: [{ formId: '1', title: 'Form 1' }],
        pagination: { page: 3, pageSize: 10, totalItems: 25, totalPages: 3 }
      });

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    test('handles page number click', () => {
      window.scrollTo = jest.fn();

      renderComponent({
        forms: [{ formId: '1', title: 'Form 1' }],
        pagination: { page: 1, pageSize: 10, totalItems: 25, totalPages: 3 }
      });

      const page2Button = screen.getByText('2');
      fireEvent.click(page2Button);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/setPage',
        payload: 2
      });
    });

    test('handles page size change', () => {
      renderComponent({
        forms: [{ formId: '1', title: 'Form 1' }],
        pagination: { page: 1, pageSize: 10, totalItems: 50, totalPages: 5 }
      });

      const pageSizeSelect = screen.getByDisplayValue('10 per page');
      fireEvent.change(pageSizeSelect, { target: { value: '20' } });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'formList/setPageSize',
        payload: 20
      });
    });

    test('does not show pagination when totalPages <= 1', () => {
      renderComponent({
        forms: [{ formId: '1', title: 'Form 1' }],
        pagination: { page: 1, pageSize: 10, totalItems: 5, totalPages: 1 }
      });

      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    test('prevents navigation to invalid page', () => {
      renderComponent({
        forms: [{ formId: '1', title: 'Form 1' }],
        pagination: { page: 3, pageSize: 10, totalItems: 25, totalPages: 3 }
      });

      // Try to navigate beyond last page
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(mockDispatch).not.toHaveBeenCalledWith({
        type: 'formList/setPage',
        payload: 4
      });
    });

    test('shows correct page info for last page', () => {
      renderComponent({
        forms: [{ formId: '1', title: 'Form 1' }],
        pagination: { page: 3, pageSize: 10, totalItems: 25, totalPages: 3 }
      });

      expect(screen.getByText('Showing 21 to 25 of 25 forms')).toBeInTheDocument();
    });
  });

  describe('Page Number Display', () => {
    test('shows all pages when totalPages <= 5', () => {
      renderComponent({
        forms: [{ formId: '1', title: 'Form 1' }],
        pagination: { page: 1, pageSize: 10, totalItems: 40, totalPages: 4 }
      });

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    test('shows ellipsis at end when page <= 3', () => {
      renderComponent({
        forms: [{ formId: '1', title: 'Form 1' }],
        pagination: { page: 2, pageSize: 10, totalItems: 100, totalPages: 10 }
      });

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    test('shows ellipsis at start when page >= totalPages - 2', () => {
      renderComponent({
        forms: [{ formId: '1', title: 'Form 1' }],
        pagination: { page: 9, pageSize: 10, totalItems: 100, totalPages: 10 }
      });

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    test('shows ellipsis on both sides for middle pages', () => {
      renderComponent({
        forms: [{ formId: '1', title: 'Form 1' }],
        pagination: { page: 5, pageSize: 10, totalItems: 100, totalPages: 10 }
      });

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getAllByText('...').length).toBe(2);
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  describe('Create Form Navigation', () => {
    test('navigates to create form from header', () => {
      renderComponent();

      const createButton = screen.getAllByText('Create Form')[0];
      fireEvent.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/form/new');
    });
  });
});

