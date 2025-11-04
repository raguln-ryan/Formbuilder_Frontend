// Mock version of constants for testing
export const API_ENDPOINTS = {
  BASE_URL: 'http://localhost:5150/api',
  FORM: '/Form',
  RESPONSE: '/Response'
};

export const QUESTION_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox (Multiple Choice)' },
  { value: 'radio', label: 'Radio (Single Choice)' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'file', label: 'File Upload' }
];

export const FORM_STATUS = {
  DRAFT: 0,
  PUBLISHED: 1
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export default {
  API_ENDPOINTS,
  QUESTION_TYPES,
  FORM_STATUS,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES
};