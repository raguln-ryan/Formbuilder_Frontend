import React from 'react';
import FieldsSidebar from './FieldsSidebar';
import FormBuilderCanvas from './FormBuilderCanvas';
import '../../styles/components/FormBuilder/SectionEditor.css';

const SectionEditor = ({ questions, onQuestionsChange, formTitle, formDescription }) => {
  return (
    <div className="section-editor">
      <div className="section-editor-left">
        <FieldsSidebar />
      </div>
      <div className="section-editor-right">
        <FormBuilderCanvas
          questions={questions}
          onQuestionsChange={onQuestionsChange}
          formTitle={formTitle}
          formDescription={formDescription}
        />
      </div>
    </div>
  );
};

export default SectionEditor;
