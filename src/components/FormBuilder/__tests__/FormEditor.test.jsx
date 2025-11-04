import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FormEditor from '../FormEditor';
import { useAuth } from '../../../contexts/AuthContext';
import formService from '../../../services/formService';
import toast from 'react-hot-toast';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../../services/formService', () => ({
  createForm: jest.fn(),
  updateFormConfig: jest.fn(),
  updateForm: jest.fn(),
  publishForm: jest.fn(),
  getFormById: jest.fn()
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ formId: null })
}));

describe('FormEditor Component', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: { role: 'Admin' },
      isAuthenticated: true
    });
    mockNavigate.mockClear();
    formService.createForm.mockClear();
    formService.updateFormConfig.mockClear();
    formService.updateForm.mockClear();
    formService.publishForm.mockClear();
    formService.getFormById.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
    localStorage.clear();
  });

  describe('Authentication and Authorization', () => {
    test('redirects to login if not authenticated', () => {
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false
      });

      render(
        <BrowserRouter>
          <FormEditor />
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
          <FormEditor />
        </BrowserRouter>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('allows access for Admin users', () => {
      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(screen.getByText('Form Configuration')).toBeInTheDocument();
    });
  });

  describe('Form Configuration Tab', () => {
    test('renders form configuration tab by default', () => {
      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      expect(screen.getByText('Form Configuration')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Form Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Summarize the form's purpose for internal reference.")).toBeInTheDocument();
    });

    test('handles form title input', () => {
      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      const titleInput = screen.getByPlaceholderText('Enter Form Name');
      fireEvent.change(titleInput, { target: { value: 'Test Form Title' } });

      expect(titleInput.value).toBe('Test Form Title');
    });

    test('handles form description input', () => {
      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      const descInput = screen.getByPlaceholderText("Summarize the form's purpose for internal reference.");
      fireEvent.change(descInput, { target: { value: 'This is a test form description' } });

      expect(descInput.value).toBe('This is a test form description');
    });

    test('validates empty title', () => {
      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(screen.getByText('Form name is required')).toBeInTheDocument();
    });

    test('validates short title', () => {
      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      const titleInput = screen.getByPlaceholderText('Enter Form Name');
      fireEvent.change(titleInput, { target: { value: 'ab' } });

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(screen.getByText('Form name must be at least 3 characters')).toBeInTheDocument();
    });

    test('validates empty description', () => {
      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      const titleInput = screen.getByPlaceholderText('Enter Form Name');
      fireEvent.change(titleInput, { target: { value: 'Valid Title' } });

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(screen.getByText('Form description is required')).toBeInTheDocument();
    });

    test('validates short description', () => {
      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      const titleInput = screen.getByPlaceholderText('Enter Form Name');
      const descInput = screen.getByPlaceholderText("Summarize the form's purpose for internal reference.");
      
      fireEvent.change(titleInput, { target: { value: 'Valid Title' } });
      fireEvent.change(descInput, { target: { value: 'Short' } });

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(screen.getByText('Form description must be at least 10 characters')).toBeInTheDocument();
    });

    test('clears validation errors when input becomes valid', () => {
      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      expect(screen.getByText('Form name is required')).toBeInTheDocument();

      const titleInput = screen.getByPlaceholderText('Enter Form Name');
      fireEvent.change(titleInput, { target: { value: 'Valid Title' } });

      expect(screen.queryByText('Form name is required')).not.toBeInTheDocument();
    });
  });

  describe('Form Saving', () => {
    test('saves new form as draft', async () => {
      formService.createForm.mockResolvedValue({ formId: '123' });
      formService.updateForm.mockResolvedValue({});

      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      const titleInput = screen.getByPlaceholderText('Enter Form Name');
      const descInput = screen.getByPlaceholderText("Summarize the form's purpose for internal reference.");
      
      fireEvent.change(titleInput, { target: { value: 'Test Form' } });
      fireEvent.change(descInput, { target: { value: 'Test Description for the form' } });

      const saveButton = screen.getByText('Save as Draft');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(formService.createForm).toHaveBeenCalledWith({
          title: 'Test Form',
          description: 'Test Description for the form',
          status: 'draft'
        });
        expect(toast.success).toHaveBeenCalledWith('Form saved as draft successfully!');
      });
    });

    test('disables save button when form is invalid', () => {
      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      const saveButton = screen.getByText('Save as Draft');
      expect(saveButton).toBeDisabled();
    });

    test('enables save button when form is valid', () => {
      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      const titleInput = screen.getByPlaceholderText('Enter Form Name');
      const descInput = screen.getByPlaceholderText("Summarize the form's purpose for internal reference.");
      
      fireEvent.change(titleInput, { target: { value: 'Valid Title' } });
      fireEvent.change(descInput, { target: { value: 'Valid Description Text' } });

      const saveButton = screen.getByText('Save as Draft');
      expect(saveButton).not.toBeDisabled();
    });

    test('handles save error', async () => {
      formService.createForm.mockRejectedValue(new Error('Save failed'));

      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      const titleInput = screen.getByPlaceholderText('Enter Form Name');
      const descInput = screen.getByPlaceholderText("Summarize the form's purpose for internal reference.");
      
      fireEvent.change(titleInput, { target: { value: 'Test Form' } });
      fireEvent.change(descInput, { target: { value: 'Test Description for the form' } });

      const saveButton = screen.getByText('Save as Draft');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('Tab Navigation', () => {
    test('switches to layout tab after clicking next', async () => {
      formService.createForm.mockResolvedValue({ formId: '123' });

      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      const titleInput = screen.getByPlaceholderText('Enter Form Name');
      const descInput = screen.getByPlaceholderText("Summarize the form's purpose for internal reference.");
      
      fireEvent.change(titleInput, { target: { value: 'Valid Title' } });
      fireEvent.change(descInput, { target: { value: 'Valid Description Text' } });

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        const layoutTab = screen.getByRole('button', { name: /form layout/i });
        expect(layoutTab).toHaveClass('tab-active');
      });
    });

    test('can switch between tabs when form is saved', async () => {
      formService.createForm.mockResolvedValue({ formId: '123' });

      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      const titleInput = screen.getByPlaceholderText('Enter Form Name');
      const descInput = screen.getByPlaceholderText("Summarize the form's purpose for internal reference.");
      
      fireEvent.change(titleInput, { target: { value: 'Valid Title' } });
      fireEvent.change(descInput, { target: { value: 'Valid Description Text' } });

      const saveButton = screen.getByText('Save as Draft');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(formService.createForm).toHaveBeenCalled();
      });

      const layoutTab = screen.getByRole('button', { name: /form layout/i });
      fireEvent.click(layoutTab);

      expect(layoutTab).toHaveClass('tab-active');
    });

    test('disables layout tab when form is not saved', () => {
      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      const layoutTab = screen.getByRole('button', { name: /form layout/i });
      expect(layoutTab).toHaveClass('tab-disabled');
      expect(layoutTab).toBeDisabled();
    });
  });

  describe('Character Limits', () => {
    test('enforces title character limit', () => {
      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      const titleInput = screen.getByPlaceholderText('Enter Form Name');
      const longTitle = 'a'.repeat(100);
      
      fireEvent.change(titleInput, { target: { value: longTitle } });
      
      expect(titleInput.value.length).toBeLessThanOrEqual(80);
    });

    test('enforces description character limit', () => {
      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      const descInput = screen.getByPlaceholderText("Summarize the form's purpose for internal reference.");
      const longDesc = 'a'.repeat(300);
      
      fireEvent.change(descInput, { target: { value: longDesc } });
      
      expect(descInput.value.length).toBeLessThanOrEqual(200);
    });

    test('shows character count for inputs', () => {
      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      const titleInput = screen.getByPlaceholderText('Enter Form Name');
      fireEvent.change(titleInput, { target: { value: 'Test' } });

      expect(screen.getByText('4/80')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('shows saving state during form save', async () => {
      formService.createForm.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ formId: '123' }), 100))
      );

      render(
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      );

      const titleInput = screen.getByPlaceholderText('Enter Form Name');
      const descInput = screen.getByPlaceholderText("Summarize the form's purpose for internal reference.");
      
      fireEvent.change(titleInput, { target: { value: 'Test Form' } });
      fireEvent.change(descInput, { target: { value: 'Test Description for the form' } });

      const saveButton = screen.getByText('Save as Draft');
      fireEvent.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Save as Draft')).toBeInTheDocument();
      });
    });
  });
});
