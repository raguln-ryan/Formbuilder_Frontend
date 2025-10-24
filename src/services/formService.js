import api from './api';

const formService = {
  // Get all forms
  getAllForms: async (offset = 0, limit = 10) => {
    try {
      const response = await api.get(`/Form?offset=${offset}&limit=${limit}`);
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
  updateForm: async (id, layoutData) => {
    try {
      const response = await api.put(`/Form/Layout/${id}`, layoutData);
      return response.data;
    } catch (error) {
      console.error('Error updating form layout:', error);
      throw error;
    }
  },

  // Delete form
  deleteForm: async (id) => {
    try {
      const response = await api.delete(`/Form/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting form:', error);
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
  }
};

// THIS LINE IS CRITICAL - MUST BE AT THE END!
export default formService;
