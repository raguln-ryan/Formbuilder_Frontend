import React from 'react';
import FieldsSidebar from './FieldsSidebar';
import FormBuilderCanvas from './FormBuilderCanvas';
import '../../styles/components/FormBuilder/SectionEditor.css';

const SectionEditor = ({ questions, onQuestionsChange, formTitle, formDescription }) => {
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
