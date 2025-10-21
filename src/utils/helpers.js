export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateForm = (formConfig, questions) => {
  const errors = [];

  if (!formConfig.title?.trim()) {
    errors.push('Form title is required');
  }

  if (questions.length === 0) {
    errors.push('At least one question is required');
  }

  questions.forEach((question, index) => {
    if (!question.text?.trim()) {
      errors.push(`Question ${index + 1} text is required`);
    }

    if (['checkbox', 'radio', 'dropdown'].includes(question.type)) {
      if (!question.options || question.options.length === 0) {
        errors.push(`Question ${index + 1} requires at least one option`);
      }
    }
  });

  return errors;
};

export const sortQuestions = (questions) => {
  return [...questions].sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const generateUniqueId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
