import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import FormFillPage from '../FormFillPage';

// Mock useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ formId: 'test-form-123' })
}));

describe('FormFillPage', () => {
  test('renders FormFillPage with formId from params', () => {
    render(
      <BrowserRouter>
        <FormFillPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Fill Form test-form-123')).toBeInTheDocument();
  });

  test('renders div container', () => {
    const { container } = render(
      <BrowserRouter>
        <FormFillPage />
      </BrowserRouter>
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  test('renders h2 heading', () => {
    render(
      <BrowserRouter>
        <FormFillPage />
      </BrowserRouter>
    );
    
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
  });
});