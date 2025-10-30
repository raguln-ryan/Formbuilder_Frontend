import api from './api';

const responseService = {
  // Get all responses for a form (Admin only)
  getFormResponses: async (formId) => {
    try {
      const response = await api.get(`/response/form/${formId}/responses`);
      return response.data;
    } catch (error) {
      console.error('Error fetching form responses:', error);
      return [];
    }
  },

  // Get published forms (Learner)
  getPublishedForms: async () => {
    try {
      const response = await api.get('/response/published');
      return response.data;
    } catch (error) {
      console.error('Error fetching published forms:', error);
      throw error;
    }
  },

  // Get a specific form by ID for submission
  getFormById: async (formId) => {
    try {
      const response = await api.get(`/response/form/${formId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching form details:', error);
      throw error;
    }
  },

  // Submit form response (Learner)
  submitResponse: async (formData) => {
    try {
      const response = await api.post('/response', formData);
      return response.data;
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
    }
  },

  // Get my submissions (Learner)
  getMySubmissions: async () => {
    try {
      const response = await api.get('/response/my-submissions');
      console.log('My submissions from API:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching my submissions:', error);
      return [];
    }
  },

  // Get response details with attachments
  getResponseDetails: async (responseId) => {
    try {
      const response = await api.get(`/response/${responseId}/details`);
      return response.data;
    } catch (error) {
      console.error('Error fetching response details:', error);
      throw error;
    }
  },

  // Export responses to CSV (Admin)
  exportToCSV: async (formId) => {
    try {
      const responses = await responseService.getFormResponses(formId);
      
      if (!responses || responses.length === 0) {
        alert('No responses to export');
        return;
      }

      // Generate CSV content
      const headers = ['Response ID', 'User ID', 'Submitted At', 'Status'];
      const rows = responses.map(r => [
        r.id,
        r.userId,
        new Date(r.submittedAt).toLocaleString(),
        r.status || 'Completed'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `responses-${formId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting responses:', error);
      alert('Failed to export responses');
    }
  },

  // Add this function to your existing responseService
  downloadFile: async (responseId, questionId) => {
    try {
      const response = await api.get(
        `/Response/${responseId}/file/${questionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          responseType: 'blob', // Important for file download
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
};

export default responseService;
