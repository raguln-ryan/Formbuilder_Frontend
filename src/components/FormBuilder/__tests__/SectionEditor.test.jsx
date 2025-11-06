import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SectionEditor from '../SectionEditor';
import formBuilderReducer from '../../../store/slices/formBuilderSlice';

// Mock the child components
jest.mock('../FieldsSidebar', () => {
  return function FieldsSidebar({ formId }) {
    return <div data-testid="fields-sidebar">FieldsSidebar - formId: {formId}</div>;
  };
});

jest.mock('../FormBuilderCanvas', () => {
  return function FormBuilderCanvas({ formId }) {
    return <div data-testid="form-builder-canvas">FormBuilderCanvas - formId: {formId}</div>;
  };
});

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      formBuilder: formBuilderReducer
    },
    preloadedState: {
      formBuilder: {
        formData: {},
        questions: [],
        ...initialState
      }
    }
  });
};

describe('SectionEditor Component', () => {
  const originalConsoleLog = console.log;

  beforeEach(() => {
    console.log = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    jest.clearAllMocks();
  });

  test('renders SectionEditor with both child components', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <SectionEditor />
      </Provider>
    );

    expect(screen.getByTestId('fields-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('form-builder-canvas')).toBeInTheDocument();
  });

  test('passes formId to child components', () => {
    const store = createMockStore();
    const formId = 'test-form-123';
    
    render(
      <Provider store={store}>
        <SectionEditor formId={formId} />
      </Provider>
    );

    expect(screen.getByText(`FieldsSidebar - formId: ${formId}`)).toBeInTheDocument();
    expect(screen.getByText(`FormBuilderCanvas - formId: ${formId}`)).toBeInTheDocument();
  });

  test('logs questions from Redux store', () => {
    const mockQuestions = [
      { _id: '1', type: 'short_text', question: 'Question 1' },
      { _id: '2', type: 'number', question: 'Question 2' }
    ];
    
    const store = createMockStore({
      formBuilder: {
        formData: {},
        questions: mockQuestions
      }
    });
    
    render(
      <Provider store={store}>
        <SectionEditor />
      </Provider>
    );

    expect(console.log).toHaveBeenCalledWith('SECTION EDITOR - Questions from Redux:', mockQuestions);
  });

  test('renders without formId prop', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <SectionEditor />
      </Provider>
    );

    expect(screen.getByText('FieldsSidebar - formId:')).toBeInTheDocument();
    expect(screen.getByText('FormBuilderCanvas - formId:')).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const store = createMockStore();
    
    const { container } = render(
      <Provider store={store}>
        <SectionEditor />
      </Provider>
    );

    expect(container.querySelector('.section-editor')).toBeInTheDocument();
    expect(container.querySelector('.section-editor-left')).toBeInTheDocument();
    expect(container.querySelector('.section-editor-right')).toBeInTheDocument();
  });
});
