import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ResponsesPage from '../ResponsesPage';

jest.mock('../../components/Responses/FormResponses', () => {
  return function MockFormResponses({ formId }) {
    return <div>FormResponses - ID: {formId}</div>;
  };
});

describe('ResponsesPage', () => {
  test('renders FormResponses with formId from params', () => {
    render(
      <BrowserRouter initialEntries={['/responses/789']}>
        <Routes>
          <Route path="/responses/:formId" element={<ResponsesPage />} />
        </Routes>
      </BrowserRouter>
    );
    
    expect(screen.getByText('FormResponses - ID: 789')).toBeInTheDocument();
  });

  test('has responses-page class', () => {
    const { container } = render(
      <BrowserRouter initialEntries={['/responses/123']}>
        <Routes>
          <Route path="/responses/:formId" element={<ResponsesPage />} />
        </Routes>
      </BrowserRouter>
    );
    
    expect(container.firstChild).toHaveClass('responses-page');
  });
});