import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ResponsesPage from '../ResponsesPage';

// Mock useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ formId: 'test-form-123' })
}));

// Mock FormResponses component
jest.mock('../../components/Responses/FormResponses', () => {
  return function MockFormResponses({ formId }) {
    return <div data-testid="form-responses">Form Responses for {formId}</div>;
  };
});

// Mock CSS
jest.mock('../../styles/pages/ResponsesPage.css', () => ({}));

describe('ResponsesPage', () => {
  test('renders ResponsesPage with correct className', () => {
    const { container } = render(
      <BrowserRouter>
        <ResponsesPage />
      </BrowserRouter>
    );
    
    expect(container.firstChild).toHaveClass('responses-page');
  });

  test('renders FormResponses component with formId from params', () => {
    render(
      <BrowserRouter>
        <ResponsesPage />
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('form-responses')).toBeInTheDocument();
    expect(screen.getByText('Form Responses for test-form-123')).toBeInTheDocument();
  });

  test('passes formId prop to FormResponses', () => {
    render(
      <BrowserRouter>
        <ResponsesPage />
      </BrowserRouter>
    );
    
    const formResponsesElement = screen.getByTestId('form-responses');
    expect(formResponsesElement).toHaveTextContent('test-form-123');
  });
});
