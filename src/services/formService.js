import api from './api';
import responseService from './responseService';

const formService = {
  // Get all forms with search support
  getAllForms: async (page = 1, size = 10, search = '') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });
      
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      
      const response = await api.get(`/Form?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching forms:', error);
      throw error;
    }
  },

  // Get form by ID
  getFormById: async (id) => {
    try {
      const response = await api.get(`/Form/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching form:', error);
      throw error;
    }
  },

  // Create new form (config only)
  createForm: async (formData) => {
    try {
      const response = await api.post('/Form/FormConfig', formData);
      return response.data;
    } catch (error) {
      console.error('Error creating form:', error);
      throw error;
    }
  },

  // Update form config
  updateFormConfig: async (id, formData) => {
    try {
      const response = await api.put(`/Form/FormConfig/${id}`, formData);
      return response.data;
    } catch (error) {
      console.error('Error updating form config:', error);
      throw error;
    }
  },

  // Update form layout (questions)
  updateForm: async (formId, formData) => {
    console.log('FormService: Data received:', formData);
    console.log('FormService: Questions being sent:', formData.questions);
    
    const response = await api.put(`/Form/Layout/${formId}`, formData);
    
    console.log('FormService: Response from backend:', response.data);
    return response.data;
  },

  // Delete form
  deleteForm: async (formId) => {
    try {
      console.log('🗑️ Attempting to delete form:', formId);
    
      // Remove the /api prefix since it's already in your base URL
      const response = await api.delete(`/Form/${formId}`);  // ← Changed from /api/Form to just /Form
    
      console.log('✅ Delete response:', response);
    
      if (response.status === 200 || response.status === 204) {
        return {
          success: true,
          message: response.data?.message || 'Form deleted successfully'
        };
      }
    
      throw new Error('Unexpected response status');
    } catch (error) {
      console.error('❌ Delete error:', error);
    
      if (error.response?.data) {
        throw new Error(error.response.data.message || error.response.data || 'Failed to delete form');
      }
    
      throw error;
    }
  },

  // Publish form
  publishForm: async (id) => {
    try {
      const response = await api.put(`/Form/${id}/publish`);
      return response.data;
    } catch (error) {
      console.error('Error publishing form:', error);
      throw error;
    }
  },

  // Add this method to your formService
  toggleFormStatus: async (formId, isEnabled) => {
    try {
      const response = await api.put(`/Form/${formId}/toggle`, { isEnabled });
      return response.data;
    } catch (error) {
      console.error('Error toggling form status:', error);
      throw error;
    }
  },

  // Add method to check if form has responses
  getFormResponses: async (formId, page = 1, size = 10, search = '') => {
    try {
      return await responseService.getFormResponses(formId, page, size, search);
    } catch (error) {
      console.error('Error fetching form responses:', error);
      return [];
    }
  }
};

// THIS LINE IS CRITICAL - MUST BE AT THE END!
export default formService;