// Generate unique ID
export const generateId = () => {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Format date
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Validate email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

// Truncate text
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

// Generate default question based on type
export const getDefaultQuestion = (type) => {
  const defaults = {
    text: {
      placeholder: 'Enter your answer',
      maxLength: 255
    },
    textarea: {
      placeholder: 'Enter detailed answer',
      rows: 4,
      maxLength: 1000
    },
    number: {
      min: 0,
      max: 999999
    },
    email: {
      placeholder: 'email@example.com'
    },
    select: {
      placeholder: 'Choose an option',
      options: ['Option 1', 'Option 2', 'Option 3']
    },
    radio: {
      options: ['Option 1', 'Option 2', 'Option 3']
    },
    checkbox: {
      options: ['Option 1', 'Option 2', 'Option 3']
    },
    date: {
      min: new Date().toISOString().split('T')[0]
    },
    file: {
      accept: '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg',
      maxSize: 10 // MB
    }
  };

  return defaults[type] || {};
};
