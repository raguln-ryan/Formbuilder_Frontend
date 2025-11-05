import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FormResponsesPage from '../FormResponsesPage';

// Mock NavigationBar component
jest.mock('../../components/Common/NavigationBar', () => {
  return function NavigationBar({ pageName }) {
    return <div>NavigationBar - {pageName}</div>;
  };
});

describe('FormResponsesPage', () => {
  test('renders FormResponsesPage with NavigationBar', () => {
    render(
      <BrowserRouter>
        <FormResponsesPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('NavigationBar - Form Responses')).toBeInTheDocument();
  });

  test('has correct CSS class', () => {
    const { container } = render(
      <BrowserRouter>
        <FormResponsesPage />
      </BrowserRouter>
    );
    
    expect(container.querySelector('.form-responses-page')).toBeInTheDocument();
  });
});
