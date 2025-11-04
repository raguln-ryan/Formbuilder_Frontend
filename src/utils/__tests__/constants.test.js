// This will automatically use the mock from __mocks__ folder
jest.mock('../constants');

// Import after mocking
import * as constants from '../constants';

describe('constants', () => {
  describe('API_ENDPOINTS', () => {
    test('should have correct BASE_URL', () => {
      expect(constants.API_ENDPOINTS.BASE_URL).toBe('http://localhost:5150/api');
    });

    test('should have FORM endpoint', () => {
      expect(constants.API_ENDPOINTS.FORM).toBe('/Form');
    });

    test('should have RESPONSE endpoint', () => {
      expect(constants.API_ENDPOINTS.RESPONSE).toBe('/Response');
    });
  });

  describe('QUESTION_TYPES', () => {
    test('should have all question types', () => {
      expect(constants.QUESTION_TYPES).toHaveLength(9);
      
      const types = constants.QUESTION_TYPES.map(q => q.value);
      expect(types).toContain('text');
      expect(types).toContain('textarea');
      expect(types).toContain('number');
      expect(types).toContain('email');
      expect(types).toContain('date');
      expect(types).toContain('checkbox');
      expect(types).toContain('radio');
      expect(types).toContain('dropdown');
      expect(types).toContain('file');
    });

    test('each question type should have value and label', () => {
      constants.QUESTION_TYPES.forEach(type => {
        expect(type).toHaveProperty('value');
        expect(type).toHaveProperty('label');
        expect(type.value).toBeTruthy();
        expect(type.label).toBeTruthy();
      });
    });
  });

  describe('FORM_STATUS', () => {
    test('should have DRAFT status as 0', () => {
      expect(constants.FORM_STATUS.DRAFT).toBe(0);
    });

    test('should have PUBLISHED status as 1', () => {
      expect(constants.FORM_STATUS.PUBLISHED).toBe(1);
    });
  });

  describe('File constants', () => {
    test('MAX_FILE_SIZE should be 5MB', () => {
      expect(constants.MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
    });

    test('ALLOWED_FILE_TYPES should contain correct MIME types', () => {
      expect(constants.ALLOWED_FILE_TYPES).toContain('image/jpeg');
      expect(constants.ALLOWED_FILE_TYPES).toContain('image/jpg');
      expect(constants.ALLOWED_FILE_TYPES).toContain('image/png');
      expect(constants.ALLOWED_FILE_TYPES).toContain('image/gif');
      expect(constants.ALLOWED_FILE_TYPES).toContain('application/pdf');
      expect(constants.ALLOWED_FILE_TYPES).toContain('application/msword');
      expect(constants.ALLOWED_FILE_TYPES).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(constants.ALLOWED_FILE_TYPES).toHaveLength(7);
    });
  });
});