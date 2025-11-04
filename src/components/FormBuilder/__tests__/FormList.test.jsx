import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FormList from '../FormList';
import { useAuth } from '../../../contexts/AuthContext';
import formService from '../../../services/formService';
import toast from 'react-hot-toast';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../../services/formService', () => ({
  getAllForms: jest.fn(),
  deleteForm: jest.fn(),
  getFormResponses: jest.fn()
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('FormList Component', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: { role: 'Admin' },
      isAuthenticated: true
    });
    mockNavigate.mockClear();
    formService.getAllForms.mockClear();
    formService.deleteForm.mockClear();
    formService.getFormResponses.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
  });

  test('redirects to login if not authenticated', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false
    });

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('redirects to login if user is not Admin', () => {
    useAuth.mockReturnValue({
      user: { role: 'Learner' },
      isAuthenticated: true
    });

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('renders form list header', async () => {
    formService.getAllForms.mockResolvedValue({ data: [] });

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Form List')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search forms...')).toBeInTheDocument();
      expect(screen.getByText('Create Form')).toBeInTheDocument();
    });
  });

  test('displays loading spinner while fetching', () => {
    formService.getAllForms.mockImplementation(() => new Promise(() => {}));

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays empty state when no forms', async () => {
    formService.getAllForms.mockResolvedValue({ data: [] });

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

  test('displays forms when available', async () => {
    const mockForms = {
      data: {
        items: [
          {
            formId: '1',
            title: 'Form 1',
            status: 0,
            createdBy: 'Admin',
            createdDate: new Date().toISOString()
          },
          {
            formId: '2',
            title: 'Form 2',
            status: 1,
            publishedBy: 'Admin',
            publishedDate: new Date().toISOString(),
            isEnabled: true
          }
        ],
        totalCount: 2
      }
    };

    formService.getAllForms.mockResolvedValue(mockForms);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Form 1')).toBeInTheDocument();
      expect(screen.getByText('Form 2')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Published')).toBeInTheDocument();
    });
  });

  test('handles search functionality', async () => {
    const mockForms = {
      data: {
        items: [
          { formId: '1', title: 'Test Form', status: 0 },
          { formId: '2', title: 'Another Form', status: 0 }
        ]
      }
    };

    formService.getAllForms.mockResolvedValue(mockForms);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form')).toBeInTheDocument();
      expect(screen.getByText('Another Form')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search forms...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Test Form')).toBeInTheDocument();
      expect(screen.queryByText('Another Form')).not.toBeInTheDocument();
    });
  });

  test('handles create form button click', async () => {
    formService.getAllForms.mockResolvedValue({ data: [] });

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const createButton = screen.getAllByText('Create Form')[0];
      fireEvent.click(createButton);
      expect(mockNavigate).toHaveBeenCalledWith('/form/new');
    });
  });

  test('toggles dropdown menu for form actions', async () => {
    const mockForms = {
      data: {
        items: [
          { formId: '1', title: 'Form 1', status: 0 }
        ]
      }
    };

    formService.getAllForms.mockResolvedValue(mockForms);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Form 1')).toBeInTheDocument();
    });

    const menuButton = screen.getByLabelText('More options');
    fireEvent.click(menuButton);

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Publish')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  test('handles edit action for draft form', async () => {
    const mockForms = {
      data: {
        items: [
          { formId: '1', title: 'Form 1', status: 0 }
        ]
      }
    };

    formService.getAllForms.mockResolvedValue(mockForms);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const menuButton = screen.getByLabelText('More options');
      fireEvent.click(menuButton);
    });

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(mockNavigate).toHaveBeenCalledWith('/form/1/edit');
  });

  test('handles view form action for published form', async () => {
    const mockForms = {
      data: {
        items: [
          { formId: '1', title: 'Form 1', status: 1 }
        ]
      }
    };

    formService.getAllForms.mockResolvedValue(mockForms);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const menuButton = screen.getByLabelText('More options');
      fireEvent.click(menuButton);
    });

    const viewButton = screen.getByText('View Form');
    fireEvent.click(viewButton);

    expect(mockNavigate).toHaveBeenCalledWith('/form/1/view', expect.any(Object));
  });

  test('handles delete with confirmation modal', async () => {
    const mockForms = {
      data: {
        items: [
          { formId: '1', title: 'Form 1', status: 0 }
        ]
      }
    };

    formService.getAllForms.mockResolvedValue(mockForms);
    formService.deleteForm.mockResolvedValue({ success: true, message: 'Deleted' });

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const menuButton = screen.getByLabelText('More options');
      fireEvent.click(menuButton);
    });

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByText('Yes, Delete');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(formService.deleteForm).toHaveBeenCalledWith('1');
      expect(toast.success).toHaveBeenCalled();
    });
  });

  test('handles delete with responses warning', async () => {
    const mockForms = {
      data: {
        items: [
          { formId: '1', title: 'Form 1', status: 1 }
        ]
      }
    };

    formService.getAllForms.mockResolvedValue(mockForms);
    formService.getFormResponses.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const menuButton = screen.getByLabelText('More options');
      fireEvent.click(menuButton);
    });

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/This form has 2 submission/)).toBeInTheDocument();
    });
  });

  test('handles view responses button click', async () => {
    const mockForms = {
      data: {
        items: [
          { formId: '1', title: 'Form 1', status: 1 }
        ]
      }
    };

    formService.getAllForms.mockResolvedValue(mockForms);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const viewResponsesButton = screen.getByTitle('View form responses');
      fireEvent.click(viewResponsesButton);
      expect(mockNavigate).toHaveBeenCalledWith('/form/1/view', expect.any(Object));
    });
  });

  test('disables view responses for draft forms', async () => {
    const mockForms = {
      data: {
        items: [
          { formId: '1', title: 'Form 1', status: 0 }
        ]
      }
    };

    formService.getAllForms.mockResolvedValue(mockForms);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const viewResponsesButton = screen.getByTitle('Publish form to view responses');
      expect(viewResponsesButton).toBeDisabled();
    });
  });



  test('handles pagination', async () => {
    const mockForms = {
      data: {
        items: Array.from({ length: 10 }, (_, i) => ({
          formId: `${i + 1}`,
          title: `Form ${i + 1}`,
          status: 0
        })),
        totalCount: 25
      }
    };

    formService.getAllForms.mockResolvedValue(mockForms);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Showing 1 - 10 of 25 forms')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous page')).toBeDisabled();
    });

    const nextButton = screen.getByLabelText('Next page');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(formService.getAllForms).toHaveBeenCalledWith(10, 10);
    });
  });

  test('handles items per page change', async () => {
    const mockForms = {
      data: {
        items: [],
        totalCount: 50
      }
    };

    formService.getAllForms.mockResolvedValue(mockForms);

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const select = screen.getByLabelText('Items per page:');
      fireEvent.change(select, { target: { value: '20' } });
      expect(formService.getAllForms).toHaveBeenCalledWith(0, 20);
    });
  });

  test('handles error state', async () => {
    formService.getAllForms.mockRejectedValue(new Error('Failed to load'));

    render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load forms. Please try again.')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    expect(formService.getAllForms).toHaveBeenCalledTimes(2);
  });

  test('closes dropdown when clicking outside', async () => {
    const mockForms = {
      data: {
        items: [
          { formId: '1', title: 'Form 1', status: 0 }
        ]
      }
    };

    formService.getAllForms.mockResolvedValue(mockForms);

    const { container } = render(
      <BrowserRouter>
        <FormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const menuButton = screen.getByLabelText('More options');
      fireEvent.click(menuButton);
    });

    expect(screen.getByText('Edit')).toBeInTheDocument();

    // Click outside
    fireEvent.click(container.querySelector('.form-list-container'));

    await waitFor(() => {
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });
});