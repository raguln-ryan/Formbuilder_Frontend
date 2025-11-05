import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import FormList from '../FormList';
import formService from '../../../services/formService';
import toast from 'react-hot-toast';
import * as AuthContext from '../../../contexts/AuthContext';
import { debounce } from 'lodash';

// Mock dependencies
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

jest.mock('react-hot-toast');
jest.mock('../../../services/formService');
jest.mock('../../../styles/components/FormBuilder/FormList.css', () => ({}));
jest.mock('../../../assets/Ellipse.png', () => 'search-icon');

// Mock lodash debounce
jest.mock('lodash', () => ({
  debounce: jest.fn((fn) => {
    const debounced = (...args) => fn(...args);
    debounced.cancel = jest.fn();
    return debounced;
  })
}));

// Mock child components
jest.mock('../../Common/Button', () => {
  return function MockButton({ children, onClick, ...props }) {
    return <button onClick={onClick} {...props}>{children}</button>;
  };
});

jest.mock('../../Common/LoadingSpinner', () => {
  return function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

jest.mock('../../Common/Modal', () => {
  return function MockModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <div>{title}</div>
        <div>{message}</div>
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    );
  };
});

describe('FormList', () => {
  const mockUseAuth = {
    user: { role: 'Admin' },
    isAuthenticated: true
  };

  const mockFormsResponse = {
    data: [
      {
        formId: 'form-1',
        title: 'Test Form 1',
        description: 'Description 1',
        status: 0,
        createdBy: 'Admin',
        createdAt: '2024-01-01T00:00:00Z',
        isEnabled: false
      },
      {
        formId: 'form-2',
        title: 'Published Form',
        description: 'Description 2',
        status: 1,
        publishedBy: 'Admin',
        publishedAt: '2024-01-02T00:00:00Z',
        isEnabled: true
      }
    ],
    totalCount: 2,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AuthContext, 'useAuth').mockImplementation(() => mockUseAuth);
    formService.getAllForms.mockResolvedValue(mockFormsResponse);
    formService.deleteForm.mockResolvedValue({ success: true, message: 'Form deleted' });
    formService.getFormResponses.mockResolvedValue({ data: [], totalCount: 0 });
  });

  test('renders form list with forms', async () => {
    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
      expect(screen.getByText('Published Form')).toBeInTheDocument();
    });
  });

  test('redirects when not authenticated', () => {
    jest.spyOn(AuthContext, 'useAuth').mockImplementation(() => ({
      user: null,
      isAuthenticated: false
    }));

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('redirects when user is not admin', () => {
    jest.spyOn(AuthContext, 'useAuth').mockImplementation(() => ({
      user: { role: 'User' },
      isAuthenticated: true
    }));

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('handles search input change', async () => {
    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(searchInput.value).toBe('test search');
  });

  test('handles clear search', async () => {
    formService.getAllForms
      .mockResolvedValueOnce(mockFormsResponse) // Initial load
      .mockResolvedValueOnce({ data: [], totalCount: 0, totalPages: 0 }); // After search

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText(/No forms match your search/)).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Clear Search');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(searchInput.value).toBe('');
    });
  });

  test('handles page change', async () => {
    const multiPageResponse = {
      ...mockFormsResponse,
      totalCount: 25,
      totalPages: 3
    };

    formService.getAllForms.mockResolvedValue(multiPageResponse);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    // Page numbers are rendered
    const page2Button = screen.getByText('2');
    fireEvent.click(page2Button);

    await waitFor(() => {
      expect(formService.getAllForms).toHaveBeenCalledWith(2, 10, '');
    });
  });

  test('handles page size change', async () => {
    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const pageSizeSelect = screen.getByRole('combobox');
    fireEvent.change(pageSizeSelect, { target: { value: '25' } });

    await waitFor(() => {
      expect(formService.getAllForms).toHaveBeenCalledWith(1, 25, '');
    });
  });

  test('handles previous page navigation', async () => {
    const multiPageResponse = {
      ...mockFormsResponse,
      pageNumber: 2,
      totalPages: 3
    };

    formService.getAllForms.mockResolvedValue(multiPageResponse);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    // Set page to 2 first
    act(() => {
      const page2Button = screen.getByText('2');
      fireEvent.click(page2Button);
    });

    await waitFor(() => {
      const prevButton = screen.getByText('‹');
      fireEvent.click(prevButton);
    });
  });

  test('handles next page navigation', async () => {
    const multiPageResponse = {
      ...mockFormsResponse,
      totalCount: 25,
      totalPages: 3
    };

    formService.getAllForms.mockResolvedValue(multiPageResponse);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('›');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(formService.getAllForms).toHaveBeenCalledWith(2, 10, '');
    });
  });

  test('disables navigation at boundaries', async () => {
    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const prevButton = screen.getByText('‹');
    const nextButton = screen.getByText('›');

    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled(); // Only 1 page
  });

  test('renders page numbers correctly for many pages', async () => {
    const manyPagesResponse = {
      ...mockFormsResponse,
      totalCount: 100,
      totalPages: 10,
      pageNumber: 5
    };

    formService.getAllForms.mockResolvedValue(manyPagesResponse);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    // Should show 1 ... 4 5 6 ... 10
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getAllByText('...')).toHaveLength(2);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  test('renders page numbers at end correctly', async () => {
    const endPagesResponse = {
      ...mockFormsResponse,
      totalCount: 100,
      totalPages: 10,
      pageNumber: 9
    };

    formService.getAllForms.mockResolvedValue(endPagesResponse);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    // Navigate to page 9
    act(() => {
      const page9 = screen.getByText('9');
      fireEvent.click(page9);
    });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  test('handles API error', async () => {
    formService.getAllForms.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error loading forms: Network error');
      expect(screen.getByText('Failed to load forms. Please try again.')).toBeInTheDocument();
    });
  });

  test('handles API error with response data', async () => {
    formService.getAllForms.mockRejectedValue({
      response: { data: { message: 'Custom error message' } }
    });

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error loading forms: Custom error message');
    });
  });

  test('handles retry after error', async () => {
    formService.getAllForms
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockFormsResponse);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load forms. Please try again.')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });
  });

  test('toggles menu for form', async () => {
    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const menuButtons = screen.getAllByLabelText('More options');
    fireEvent.click(menuButtons[0]);

    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  test('closes menu when clicking outside', async () => {
    const { container } = render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const menuButtons = screen.getAllByLabelText('More options');
    fireEvent.click(menuButtons[0]);

    expect(screen.getByText('Edit')).toBeInTheDocument();

    // Click outside
    fireEvent.click(container.firstChild);

    await waitFor(() => {
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  test('handles edit form', async () => {
    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const menuButtons = screen.getAllByLabelText('More options');
    fireEvent.click(menuButtons[0]);

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(mockNavigate).toHaveBeenCalledWith('/form/form-1/edit');
  });

  test('handles view responses', async () => {
    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Published Form')).toBeInTheDocument();
    });

    const viewResponsesButtons = screen.getAllByText('View Responses');
    fireEvent.click(viewResponsesButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/form/form-2/view', { state: { activeTab: 'responses' } });
  });

  test('disables view responses for draft forms', async () => {
    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const viewResponsesButtons = screen.getAllByText('View Responses');
    expect(viewResponsesButtons[0]).toBeDisabled();
    expect(viewResponsesButtons[0]).toHaveAttribute('title', 'Publish form to view responses');
  });

  test('handles view form', async () => {
    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Published Form')).toBeInTheDocument();
    });

    const menuButtons = screen.getAllByLabelText('More options');
    fireEvent.click(menuButtons[1]); // Published form menu

    const viewButton = screen.getByText('View Form');
    fireEvent.click(viewButton);

    expect(mockNavigate).toHaveBeenCalledWith('/form/form-2/view', { state: { activeTab: 'configuration' } });
  });

  test('handles toggle enable/disable', async () => {
    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Published Form')).toBeInTheDocument();
    });

    const toggleSwitches = screen.getAllByRole('checkbox');
    fireEvent.click(toggleSwitches[0]);

    expect(toast.success).toHaveBeenCalledWith('Form disabled');
  });

  test('handles delete draft form', async () => {
    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const menuButtons = screen.getAllByLabelText('More options');
    fireEvent.click(menuButtons[0]);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete this draft form/)).toBeInTheDocument();
  });

  test('handles delete published form with responses', async () => {
    formService.getFormResponses.mockResolvedValue({ 
      data: [{ id: 1 }], 
      totalCount: 5 
    });

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Published Form')).toBeInTheDocument();
    });

    const menuButtons = screen.getAllByLabelText('More options');
    fireEvent.click(menuButtons[1]);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText(/This form has 5 submission/)).toBeInTheDocument();
    });
  });

  test('confirms delete', async () => {
    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const menuButtons = screen.getAllByLabelText('More options');
    fireEvent.click(menuButtons[0]);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Form deleted successfully');
    });
  });

  test('handles delete error', async () => {
    formService.deleteForm.mockRejectedValue(new Error('Delete failed'));

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const menuButtons = screen.getAllByLabelText('More options');
    fireEvent.click(menuButtons[0]);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Delete failed');
    });
  });

  test('prevents multiple delete operations', async () => {
    let deletePromiseResolve;
    const deletePromise = new Promise(resolve => {
      deletePromiseResolve = resolve;
    });
    
    formService.deleteForm.mockReturnValue(deletePromise);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const menuButtons = screen.getAllByLabelText('More options');
    fireEvent.click(menuButtons[0]);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    // Try to click again while deleting
    fireEvent.click(confirmButton);

    // Should only call delete once
    expect(formService.deleteForm).toHaveBeenCalledTimes(1);

    // Resolve the promise
    deletePromiseResolve({ success: true, message: 'Deleted' });
  });

  test('adjusts page after delete when on last item of page', async () => {
    const twoPageResponse = {
      data: [mockFormsResponse.data[0]],
      totalCount: 11,
      pageNumber: 2,
      pageSize: 10,
      totalPages: 2
    };

    formService.getAllForms.mockResolvedValue(twoPageResponse);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const menuButtons = screen.getAllByLabelText('More options');
    fireEvent.click(menuButtons[0]);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  test('handles publish form', async () => {
    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const menuButtons = screen.getAllByLabelText('More options');
    fireEvent.click(menuButtons[0]);

    const publishButton = screen.getByText('Publish');
    fireEvent.click(publishButton);

    expect(screen.queryByText('Edit')).not.toBeInTheDocument(); // Menu should close
  });

  test('handles create form button', async () => {
    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const createButtons = screen.getAllByText('Create Form');
    fireEvent.click(createButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/form/new');
  });

  test('renders empty state', async () => {
    formService.getAllForms.mockResolvedValue({
      data: [],
      totalCount: 0,
      totalPages: 0
    });

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No forms found')).toBeInTheDocument();
      expect(screen.getByText('Create your first form to get started')).toBeInTheDocument();
    });
  });

  test('renders empty search state', async () => {
    formService.getAllForms
      .mockResolvedValueOnce(mockFormsResponse)
      .mockResolvedValueOnce({ data: [], totalCount: 0, totalPages: 0 });

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No forms found')).toBeInTheDocument();
      expect(screen.getByText(/No forms match your search/)).toBeInTheDocument();
    });
  });

  test('handles response structure as direct array', async () => {
    formService.getAllForms.mockResolvedValue([
      mockFormsResponse.data[0],
      mockFormsResponse.data[1]
    ]);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
      expect(screen.getByText('Published Form')).toBeInTheDocument();
    });
  });

  test('handles unexpected response structure', async () => {
    formService.getAllForms.mockResolvedValue({ unexpected: 'structure' });

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No forms found')).toBeInTheDocument();
    });
  });

  test('handles no response', async () => {
    formService.getAllForms.mockResolvedValue(null);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No forms found')).toBeInTheDocument();
    });
  });

  test('handles missing form data fields', async () => {
    const incompleteResponse = {
      data: [
        { formId: 'form-3' }, // Missing most fields
        {
          formId: 'form-4',
          title: null,
          status: 1,
          publishedBy: null,
          publishedAt: null
        }
      ],
      totalCount: 2,
      totalPages: 1
    };

    formService.getAllForms.mockResolvedValue(incompleteResponse);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Untitled Form')).toBeInTheDocument();
      expect(screen.getAllByText('N/A')).toHaveLength(2); // For missing dates
    });
  });

  test('renders loading spinner initially', () => {
    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders search loading state', async () => {
    formService.getAllForms.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockFormsResponse), 100))
    );

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'searching' } });

    expect(screen.getByText('Searching for "searching"...')).toBeInTheDocument();
  });

  test('handles error checking responses', async () => {
    formService.getFormResponses.mockRejectedValue(new Error('Failed to get responses'));

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Published Form')).toBeInTheDocument();
    });

    const menuButtons = screen.getAllByLabelText('More options');
    fireEvent.click(menuButtons[1]);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
            expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  test('handles delete with custom message', async () => {
    formService.deleteForm.mockResolvedValue({ 
      success: true, 
      message: 'Custom delete message' 
    });

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const menuButtons = screen.getAllByLabelText('More options');
    fireEvent.click(menuButtons[0]);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Custom delete message');
    });
  });

  test('handles response data without totalCount', async () => {
    const responseWithoutCount = {
      data: mockFormsResponse.data
    };

    formService.getAllForms.mockResolvedValue(responseWithoutCount);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });
  });

  test('handles response with undefined totalPages', async () => {
    const responseWithoutTotalPages = {
      data: mockFormsResponse.data,
      totalCount: 20
    };

    formService.getAllForms.mockResolvedValue(responseWithoutTotalPages);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });
  });

  test('initializes enabled status for forms without formId', async () => {
    const responseWithoutFormId = {
      data: [
        { title: 'Form without ID', status: 1 }
      ],
      totalCount: 1,
      totalPages: 1
    };

    formService.getAllForms.mockResolvedValue(responseWithoutFormId);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Form without ID')).toBeInTheDocument();
    });
  });

  test('handles page change with invalid page number', async () => {
    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    // handlePageChange with page 0
    // This is tested indirectly through the disabled prev button
    const prevButton = screen.getByText('‹');
    expect(prevButton).toBeDisabled();
  });

  test('cancels delete operation', async () => {
    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const menuButtons = screen.getAllByLabelText('More options');
    fireEvent.click(menuButtons[0]);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(formService.deleteForm).not.toHaveBeenCalled();
  });

  test('handles menu dots click with stopPropagation', async () => {
    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const menuButtons = screen.getAllByLabelText('More options');
    const event = { stopPropagation: jest.fn() };
    
    fireEvent.click(menuButtons[0], event);
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  test('handles page numbers with ellipsis at start', async () => {
    const manyPagesResponse = {
      ...mockFormsResponse,
      totalCount: 100,
      totalPages: 10,
      pageNumber: 1
    };

    formService.getAllForms.mockResolvedValue(manyPagesResponse);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    // Should show 1 2 3 4 ... 10 for page 1
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('...')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  test('unmounts and cleans up event listeners', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });
});

