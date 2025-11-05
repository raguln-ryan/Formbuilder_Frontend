import reducer, {
  clearResponses,
  fetchResponses
} from '../responseSlice';

describe('responseSlice', () => {
  const initialState = {
    responses: [],
    totalItems: 0,
    loading: false,
    error: null,
    currentFormId: null
  };

  describe('reducers', () => {
    it('should clear responses', () => {
      const modifiedState = {
        ...initialState,
        responses: [{ id: 1 }],
        totalItems: 10,
        currentFormId: 'form123'
      };
      const state = reducer(modifiedState, clearResponses());
      expect(state.responses).toEqual([]);
      expect(state.totalItems).toBe(0);
      expect(state.currentFormId).toBe(null);
    });
  });

  describe('fetchResponses thunk', () => {
    it('should handle fetchResponses.pending', () => {
      const action = { type: fetchResponses.pending.type };
      const state = reducer(initialState, action);
      expect(state.loading).toBe(true);
    });

    it('should handle fetchResponses.fulfilled', () => {
      const payload = {
        data: [
          {
            id: 'r1',
            submittedBy: 'John Doe',
            userId: 'u1',
            email: 'john@example.com',
            submittedAt: '2024-01-01',
            details: []
          }
        ],
        totalCount: 1,
        formId: 'form123'
      };
      
      const action = { 
        type: fetchResponses.fulfilled.type,
        payload
      };
      
      const state = reducer(initialState, action);
      expect(state.loading).toBe(false);
      expect(state.responses).toEqual(payload.data);
      expect(state.totalItems).toBe(1);
      expect(state.currentFormId).toBe('form123');
    });

    it('should handle fetchResponses.rejected', () => {
      const action = { 
        type: fetchResponses.rejected.type,
        error: { message: 'Failed to fetch' }
      };
      
      const state = reducer(initialState, action);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch');
      expect(state.responses).toEqual([]);
      expect(state.totalItems).toBe(0);
    });
  });
});