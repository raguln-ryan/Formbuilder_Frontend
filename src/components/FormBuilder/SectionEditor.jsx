import React from 'react';
import { useSelector } from 'react-redux';
import FieldsSidebar from './FieldsSidebar';
import FormBuilderCanvas from './FormBuilderCanvas';
import '../../styles/components/FormBuilder/SectionEditor.css';

const SectionEditor = ({ questions, onQuestionsChange, formTitle, formDescription, formId = '' }) => {
  // Can optionally get questions from Redux if needed
  // const { questions } = useSelector(state => state.formBuilder);
  
  // When updating question text in SectionEditor
  const handleQuestionTextChange = (questionId, newText) => {
    console.log('SectionEditor: Updating question text:', {
      questionId,
      newText
    });
    
    const updatedQuestions = questions.map(q => {
      if (q._id === questionId || q.questionId === questionId) {
        // Make sure to set the 'question' field
        return {
          ...q,
          question: newText,  // ← THIS IS CRITICAL
          questionText: newText  // Also set this for compatibility
        };
      }
      return q;
    });
    
    console.log('SectionEditor: Updated questions:', updatedQuestions);
    onQuestionsChange(updatedQuestions);
  };

  return (
    <div className={`section-editor`}>
      <div className="section-editor-left">
        <FieldsSidebar formId={formId}/>
      </div>
      <div className="section-editor-right">
        <FormBuilderCanvas
          questions={questions}
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
