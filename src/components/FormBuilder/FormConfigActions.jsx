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
      <Button 
        variant="secondary"
        onClick={onSaveAsDraft}
        loading={saving}
        disabled={!isValid}
      >
        Save as Draft
      </Button>
      <Button 
        variant="primary"
        onClick={onNext}
        loading={saving}
        disabled={!isValid}
      >
        Next
      </Button>
    </div>
  );
};

export default FormConfigActions;
