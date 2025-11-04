import * as helpers from '../helpers';

describe('helpers', () => {
  describe('generateId', () => {
    test('should generate unique IDs', () => {
      const id1 = helpers.generateId();
      const id2 = helpers.generateId();
      
      expect(id1).toMatch(/^id_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^id_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    test('should start with id_ prefix', () => {
      const id = helpers.generateId();
      expect(id).toMatch(/^id_/);
    });
  });

  

  describe('validateEmail', () => {
    test('should validate correct email addresses', () => {
      expect(helpers.validateEmail('test@example.com')).toBe(true);
      expect(helpers.validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(helpers.validateEmail('user+tag@example.org')).toBe(true);
    });

    test('should invalidate incorrect email addresses', () => {
      expect(helpers.validateEmail('invalid')).toBe(false);
      expect(helpers.validateEmail('@example.com')).toBe(false);
      expect(helpers.validateEmail('user@')).toBe(false);
      expect(helpers.validateEmail('user @example.com')).toBe(false);
      expect(helpers.validateEmail('')).toBe(false);
      expect(helpers.validateEmail('user@example')).toBe(false);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = helpers.debounce(mockFn, 300);

      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
    });

    test('should pass arguments correctly', () => {
      const mockFn = jest.fn();
      const debouncedFn = helpers.debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2', 'arg3');
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });
  });

  describe('deepClone', () => {
    test('should clone simple object', () => {
      const obj = { a: 1, b: 'test', c: true };
      const cloned = helpers.deepClone(obj);
      
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
    });

    test('should clone nested object', () => {
      const obj = {
        level1: {
          level2: {
            level3: 'deep value'
          }
        },
        array: [1, 2, 3]
      };
      const cloned = helpers.deepClone(obj);
      
      expect(cloned).toEqual(obj);
      expect(cloned.level1).not.toBe(obj.level1);
      expect(cloned.array).not.toBe(obj.array);
    });

    test('should clone arrays', () => {
      const arr = [1, { a: 2 }, [3, 4]];
      const cloned = helpers.deepClone(arr);
      
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[1]).not.toBe(arr[1]);
    });
  });

  describe('isEmpty', () => {
    test('should return true for empty object', () => {
      expect(helpers.isEmpty({})).toBe(true);
    });

    test('should return false for non-empty object', () => {
      expect(helpers.isEmpty({ a: 1 })).toBe(false);
      expect(helpers.isEmpty({ key: 'value' })).toBe(false);
    });

    test('should handle objects with multiple properties', () => {
      expect(helpers.isEmpty({ a: 1, b: 2, c: 3 })).toBe(false);
    });
  });

  describe('truncateText', () => {
    test('should not truncate text shorter than maxLength', () => {
      const text = 'Short text';
      expect(helpers.truncateText(text, 20)).toBe('Short text');
    });

    test('should truncate text longer than maxLength', () => {
      const text = 'This is a very long text that needs truncation';
      expect(helpers.truncateText(text, 10)).toBe('This is a ...');
    });

    test('should handle exact length', () => {
      const text = '12345';
      expect(helpers.truncateText(text, 5)).toBe('12345');
    });

    test('should handle empty string', () => {
      expect(helpers.truncateText('', 10)).toBe('');
    });
  });

  describe('getDefaultQuestion', () => {
    test('should return defaults for text type', () => {
      const defaults = helpers.getDefaultQuestion('text');
      expect(defaults.placeholder).toBe('Enter your answer');
      expect(defaults.maxLength).toBe(255);
    });

    test('should return defaults for textarea type', () => {
      const defaults = helpers.getDefaultQuestion('textarea');
      expect(defaults.placeholder).toBe('Enter detailed answer');
      expect(defaults.rows).toBe(4);
      expect(defaults.maxLength).toBe(1000);
    });

    test('should return defaults for number type', () => {
      const defaults = helpers.getDefaultQuestion('number');
      expect(defaults.min).toBe(0);
      expect(defaults.max).toBe(999999);
    });

    test('should return defaults for email type', () => {
      const defaults = helpers.getDefaultQuestion('email');
      expect(defaults.placeholder).toBe('email@example.com');
    });

    test('should return defaults for select type', () => {
      const defaults = helpers.getDefaultQuestion('select');
      expect(defaults.placeholder).toBe('Choose an option');
      expect(defaults.options).toEqual(['Option 1', 'Option 2', 'Option 3']);
    });

    test('should return defaults for radio type', () => {
      const defaults = helpers.getDefaultQuestion('radio');
      expect(defaults.options).toEqual(['Option 1', 'Option 2', 'Option 3']);
    });

    test('should return defaults for checkbox type', () => {
      const defaults = helpers.getDefaultQuestion('checkbox');
      expect(defaults.options).toEqual(['Option 1', 'Option 2', 'Option 3']);
    });

    test('should return defaults for date type', () => {
      const defaults = helpers.getDefaultQuestion('date');
      expect(defaults.min).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('should return defaults for file type', () => {
      const defaults = helpers.getDefaultQuestion('file');
      expect(defaults.accept).toBe('.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg');
      expect(defaults.maxSize).toBe(10);
    });

    test('should return empty object for unknown type', () => {
      const defaults = helpers.getDefaultQuestion('unknown');
      expect(defaults).toEqual({});
    });
  });
});