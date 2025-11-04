import React from 'react';
import FieldsSidebar from './FieldsSidebar';
import FormBuilderCanvas from './FormBuilderCanvas';
import '../../styles/components/FormBuilder/SectionEditor.css';

const SectionEditor = (props) => {
  console.log('SECTION EDITOR PROPS:', props);
  
  // Don't destructure, pass props directly
  const { questions, onQuestionsChange, formTitle, formDescription, formId = '' } = props;
  
  console.log('SECTION EDITOR RECEIVED:', {
    questions: questions,
    questionsLength: questions?.length,
    formTitle: formTitle
  });

  return (
    <div className={`section-editor`}>
      <div className="section-editor-left">
        <FieldsSidebar formId={formId}/>
      </div>
      <div className="section-editor-right">
        {console.log('PASSING TO CANVAS - RIGHT BEFORE:', questions)}
        <FormBuilderCanvas
          questionsList={questions}  // Use different prop name
          questions={questions}       // Keep original too
          onQuestionsChange={onQuestionsChange}
          formTitle={formTitle}
          formDescription={formDescription}
          formId={formId}
        />
      </div>
    </div>
  );
};

export default SectionEditor;
