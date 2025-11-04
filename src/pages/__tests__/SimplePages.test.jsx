import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FormFillPage from '../FormFillPage';
import FormPreviewPage from '../FormPreviewPage';
import FormResponsesPage from '../FormResponsesPage';

jest.mock('../../components/Common/NavigationBar', () => {
  return function MockNavigationBar({ pageName }) {
    return <div>NavigationBar - {pageName}</div>;
  };
});

describe('FormFillPage', () => {
  test('renders form fill content with formId', () => {
    render(
      <BrowserRouter initialEntries={['/fill/123']}>
        <Routes>
          <Route path="/fill/:formId" element={<FormFillPage />} />
        </Routes>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Fill Form 123')).toBeInTheDocument();
  });
});

describe('FormPreviewPage', () => {
  test('renders NavigationBar with Form Preview pageName', () => {
    render(
      <BrowserRouter>
        <FormPreviewPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('NavigationBar - Form Preview')).toBeInTheDocument();
  });

  test('has form-preview-page class', () => {
    const { container } = render(
      <BrowserRouter>
        <FormPreviewPage />
      </BrowserRouter>
    );
    
    expect(container.firstChild).toHaveClass('form-preview-page');
  });
});

describe('FormResponsesPage', () => {
  test('renders NavigationBar with Form Responses pageName', () => {
    render(
      <BrowserRouter>
        <FormResponsesPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('NavigationBar - Form Responses')).toBeInTheDocument();
  });

  test('has form-responses-page class', () => {
    const { container } = render(
      <BrowserRouter>
        <FormResponsesPage />
      </BrowserRouter>
    );
    
    expect(container.firstChild).toHaveClass('form-responses-page');
  });
});