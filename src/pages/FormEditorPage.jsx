import React from 'react';
import { useParams } from 'react-router-dom';
import FormEditor from '../components/FormBuilder/FormEditor';
import '../styles/pages/FormEditorPage.css';

const FormEditorPage = () => {
  const { id } = useParams();
  
  return (
    <div className="form-editor-page">
      <FormEditor formId={id} />
    </div>
  );
};

export default FormEditorPage;
