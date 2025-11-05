import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FormPreviewPage from '../FormPreviewPage';

// Mock NavigationBar component
jest.mock('../../components/Common/NavigationBar', () => {
  return function NavigationBar({ pageName }) {
    return <div>NavigationBar - {pageName}</div>;
  };
});

describe('FormPreviewPage', () => {
  test('renders FormPreviewPage with NavigationBar', () => {
    render(
      <BrowserRouter>
        <FormPreviewPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('NavigationBar - Form Preview')).toBeInTheDocument();
  });

  test('has correct CSS class', () => {
    const { container } = render(
      <BrowserRouter>
        <FormPreviewPage />
      </BrowserRouter>
    );
    
    expect(container.querySelector('.form-preview-page')).toBeInTheDocument();
  });
});
