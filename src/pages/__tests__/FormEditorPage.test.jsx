import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import FormEditorPage from '../FormEditorPage';

jest.mock('../../components/FormBuilder/FormEditor', () => {
  return function MockFormEditor({ formId }) {
    return <div>FormEditor - ID: {formId}</div>;
  };
});

jest.mock('../../components/Common/NavigationBar', () => {
  return function MockNavigationBar() {
    return <div>NavigationBar</div>;
  };
});

describe('FormEditorPage', () => {
  test('renders NavigationBar', () => {
    render(
      <MemoryRouter initialEntries={['/form/123']}>
        <Routes>
          <Route path="/form/:id" element={<FormEditorPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByText('NavigationBar')).toBeInTheDocument();
  });

  test('passes formId from params to FormEditor', () => {
    render(
      <MemoryRouter initialEntries={['/form/456']}>
        <Routes>
          <Route path="/form/:id" element={<FormEditorPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByText('FormEditor - ID: 456')).toBeInTheDocument();
  });

  test('has form-editor-page class', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/form/123']}>
        <Routes>
          <Route path="/form/:id" element={<FormEditorPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    const formEditorPage = container.querySelector('.form-editor-page');
    expect(formEditorPage).toBeInTheDocument();
  });
});
