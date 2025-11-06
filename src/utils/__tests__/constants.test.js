import {
  API_ENDPOINTS,
  QUESTION_TYPES,
  FORM_STATUS,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES
} from '../../utils/constants';

describe('constants.js - 100% Line Coverage', () => {
  // Save original env
  const originalEnv = import.meta.env;

  beforeEach(() => {
    // Reset import.meta.env before each test
    import.meta.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original env
    import.meta.env = originalEnv;
  });

  test('covers lines 1-5: API_ENDPOINTS with VITE_API_URL set', () => {
    // Test with VITE_API_URL defined
    import.meta.env.VITE_API_URL = 'https://test-api.com';
    
    // Re-import to get the new value
    jest.resetModules();
    const { API_ENDPOINTS: endpoints } = require('../../utils/constants');
    
    expect(endpoints.BASE_URL).toBe('https://test-api.com');
    expect(endpoints.FORM).toBe('/Form');
    expect(endpoints.RESPONSE).toBe('/Response');
  });

  test('covers lines 1-5: API_ENDPOINTS with fallback to localhost', () => {
    // Test with VITE_API_URL undefined
    import.meta.env.VITE_API_URL = undefined;
    
    // Re-import to get the fallback value
    jest.resetModules();
    const { API_ENDPOINTS: endpoints } = require('../../utils/constants');
    
    expect(endpoints.BASE_URL).toBe('http://localhost:5150/api');
    expect(endpoints.FORM).toBe('/Form');
    expect(endpoints.RESPONSE).toBe('/Response');
  });

  test('covers lines 7-17: QUESTION_TYPES array', () => {
    expect(QUESTION_TYPES).toBeDefined();
    expect(Array.isArray(QUESTION_TYPES)).toBe(true);
    expect(QUESTION_TYPES.length).toBe(9);
    
    // Access all elements to ensure coverage
    QUESTION_TYPES.forEach(type => {
      expect(type.value).toBeDefined();
      expect(type.label).toBeDefined();
    });
    
    // Verify specific entries
    expect(QUESTION_TYPES[0]).toEqual({ value: 'text', label: 'Text' });
    expect(QUESTION_TYPES[1]).toEqual({ value: 'textarea', label: 'Long Text' });
    expect(QUESTION_TYPES[2]).toEqual({ value: 'number', label: 'Number' });
    expect(QUESTION_TYPES[3]).toEqual({ value: 'email', label: 'Email' });
    expect(QUESTION_TYPES[4]).toEqual({ value: 'date', label: 'Date' });
    expect(QUESTION_TYPES[5]).toEqual({ value: 'checkbox', label: 'Checkbox (Multiple Choice)' });
    expect(QUESTION_TYPES[6]).toEqual({ value: 'radio', label: 'Radio (Single Choice)' });
    expect(QUESTION_TYPES[7]).toEqual({ value: 'dropdown', label: 'Dropdown' });
    expect(QUESTION_TYPES[8]).toEqual({ value: 'file', label: 'File Upload' });
  });

  test('covers lines 19-22: FORM_STATUS object', () => {
    expect(FORM_STATUS).toBeDefined();
    expect(FORM_STATUS.DRAFT).toBe(0);
    expect(FORM_STATUS.PUBLISHED).toBe(1);
    
    // Access all properties
    const statusKeys = Object.keys(FORM_STATUS);
    expect(statusKeys).toContain('DRAFT');
    expect(statusKeys).toContain('PUBLISHED');
  });

  test('covers line 24: MAX_FILE_SIZE constant', () => {
    expect(MAX_FILE_SIZE).toBeDefined();
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
    expect(MAX_FILE_SIZE).toBe(5242880);
  });

  test('covers lines 26-33: ALLOWED_FILE_TYPES array', () => {
    expect(ALLOWED_FILE_TYPES).toBeDefined();
    expect(Array.isArray(ALLOWED_FILE_TYPES)).toBe(true);
    expect(ALLOWED_FILE_TYPES.length).toBe(7);
    
    // Access all elements
    ALLOWED_FILE_TYPES.forEach(type => {
      expect(typeof type).toBe('string');
    });
    
    // Verify specific entries
    expect(ALLOWED_FILE_TYPES).toContain('image/jpeg');
    expect(ALLOWED_FILE_TYPES).toContain('image/jpg');
    expect(ALLOWED_FILE_TYPES).toContain('image/png');
    expect(ALLOWED_FILE_TYPES).toContain('image/gif');
    expect(ALLOWED_FILE_TYPES).toContain('application/pdf');
    expect(ALLOWED_FILE_TYPES).toContain('application/msword');
    expect(ALLOWED_FILE_TYPES).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  });

  test('covers all exports are accessible', () => {
    // Ensure all exports are defined and accessible
    expect(API_ENDPOINTS).toBeDefined();
    expect(QUESTION_TYPES).toBeDefined();
    expect(FORM_STATUS).toBeDefined();
    expect(MAX_FILE_SIZE).toBeDefined();
    expect(ALLOWED_FILE_TYPES).toBeDefined();
  });
});
