import React from 'react';
import Button from '../Common/Button';
import '../../styles/components/FormBuilder/FormConfigActions.css';

const FormConfigActions = ({
  onSaveAsDraft,
  onNext,
  saving,
  isValid
}) => {
  return (
    <div className="form-config-actions-floating">
      <button
        className="save-draft-btn"
        onClick={onSaveAsDraft}
        disabled={!isValid || saving}
      >
        Save as Draft
      </button>
      <button
        className="next-btn"
        onClick={onNext}
        disabled={!isValid || saving}
      >
        Next
      </button>
    </div>

  );
};

export default FormConfigActions;
