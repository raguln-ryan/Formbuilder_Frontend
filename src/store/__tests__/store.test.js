import { store } from '../store';

describe('Redux Store', () => {
  it('should have initial state', () => {
    const state = store.getState();
    expect(state).toHaveProperty('formBuilder');
    expect(state).toHaveProperty('forms');
    expect(state).toHaveProperty('responses');
  });

  it('should handle actions', () => {
    const initialState = store.getState();
    store.dispatch({ type: 'formBuilder/setLoading', payload: true });
    const newState = store.getState();
    expect(newState.formBuilder.loading).toBe(true);
  });
});