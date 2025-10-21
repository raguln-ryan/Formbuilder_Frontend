import api from './api';

export const responseService = {
  // Get published forms for learners
  getPublishedForms: async () => {
    return await api.get('/Response/published');
  },

  // Submit response
  submitResponse: async (data) => {
    return await api.post('/Response', data);
  },

  // Get responses by form
  getResponsesByForm: async (formId) => {
    return await api.get(`/Response/form/${formId}/responses`);
  },

  // Get response by ID
  getResponseById: async (responseId) => {
    return await api.get(`/Response/${responseId}`);
  },

  // Download file attachment
  downloadFile: async (responseId, questionId) => {
    const response = await api.get(`/Response/${responseId}/file/${questionId}`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `file_${responseId}_${questionId}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Get response with file details
  getResponseWithDetails: async (responseId) => {
    return await api.get(`/Response/${responseId}/details`);
  }
};
