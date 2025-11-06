import React from 'react';
import { useSelector } from 'react-redux';
import FieldsSidebar from './FieldsSidebar';
import FormBuilderCanvas from './FormBuilderCanvas';
import '../../styles/components/FormBuilder/SectionEditor.css';

const SectionEditor = ({ formId = '' }) => {
  // GET DATA FROM REDUX
  const { formData, questions } = useSelector(state => state.formBuilder);
  
  console.log('SECTION EDITOR - Questions from Redux:', questions);

  return (
    <div className={`section-editor`}>
      <div className="section-editor-left">
        <FieldsSidebar formId={formId}/>
      </div>
      <div className="section-editor-right">
        <FormBuilderCanvas formId={formId} />  {/* NO PROPS NEEDED */}
      </div>
    </div>
  );
};

export default SectionEditor;
