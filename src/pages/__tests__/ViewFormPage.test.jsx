import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ViewFormPage from '../ViewFormPage';
import formService from '../../services/formService';
import responseService from '../../services/responseService';

jest.mock('../../services/formService');
jest.mock('../../services/responseService');

jest.mock('../../components/Common/NavigationBar', () => {
  return function MockNavigationBar() {
    return <div>NavigationBar</div>;
  };
});

jest.mock('../../components/FormBuilder/FormConfig', () => {
  return function MockFormConfig({ formData, onInputChange, onNext }) {
    return (
      <div>
        FormConfig - {formData.title}
        <button onClick={onNext}>Next</button>
      </div>
    );
  };
});

jest.mock('../../components/FormBuilder/SectionEditor', () => {
  return function MockSectionEditor({ questions, formTitle }) {
    return <div>SectionEditor - {formTitle} - {questions.length} questions</div>;
  };
});

jest.mock('../../components/FormBuilder/QuestionPreview', () => {
  return function MockQuestionPreview({ formTitle }) {
    return <div>QuestionPreview - {formTitle}</div>;
  };
});

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ formId: 'test-form-123' }),
  useLocation: () => ({ state: { activeTab: 'configuration' } })
}));

describe('ViewFormPage', () => {
  const mockFormData = {
    data: {
      title: 'Test Form',
      description: 'Test Description',
      isVisible: true,
      status: 'draft',
      questions: [
        {
          id: 'q1',
          type: 'text',
          text: 'Question 1',
          required: true
        }
      ]
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    formService.getFormById.mockResolvedValue(mockFormData);
    responseService.getFormResponses.mockResolvedValue([]);
  });

  test('renders navigation bar', async () => {
    render(
      <BrowserRouter>
        <ViewFormPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('NavigationBar')).toBeInTheDocument();
    });
  });

  test('renders all tabs', async () => {
    render(
      <BrowserRouter>
        <ViewFormPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Form Configuration')).toBeInTheDocument();
      expect(screen.getByText('Form Layout')).toBeInTheDocument();
      expect(screen.getByText('Responses')).toBeInTheDocument();
    });
  });

  test('loads form data on mount', async () => {
    render(
      <BrowserRouter>
        <ViewFormPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(formService.getFormById).toHaveBeenCalledWith('test-form-123');
      expect(screen.getByText(/Test Form/)).toBeInTheDocument();
    });
  });

  test('switches between tabs', async () => {
    render(
      <BrowserRouter>
        <ViewFormPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/FormConfig/)).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Form Layout'));
    
    await waitFor(() => {
      expect(screen.getByText(/SectionEditor/)).toBeInTheDocument();
    });
  });

  test('fetches responses when responses tab is clicked', async () => {
    render(
      <BrowserRouter>
        <ViewFormPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/FormConfig/)).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Responses'));
    
    await waitFor(() => {
      expect(responseService.getFormResponses).toHaveBeenCalledWith('test-form-123');
    });
  });

  test('saves form when save button is clicked', async () => {
    formService.updateForm.mockResolvedValue({ success: true });
    
    render(
      <BrowserRouter>
        <ViewFormPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/FormConfig/)).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Form Layout'));
    
    await waitFor(() => {
      expect(screen.getByText(/SectionEditor/)).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(formService.updateForm).toHaveBeenCalled();
    });
  });

  test('opens preview modal', async () => {
    render(
      <BrowserRouter>
        <ViewFormPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/FormConfig/)).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Form Layout'));
    
    const previewButton = screen.getByText('Preview Form');
    fireEvent.click(previewButton);
    
    await waitFor(() => {
      expect(screen.getByText(/QuestionPreview/)).toBeInTheDocument();
    });
  });

  test('shows empty state for responses', async () => {
    render(
      <BrowserRouter>
        <ViewFormPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/FormConfig/)).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Responses'));
    
    await waitFor(() => {
      expect(screen.getByText('No responses yet')).toBeInTheDocument();
    });
  });
});