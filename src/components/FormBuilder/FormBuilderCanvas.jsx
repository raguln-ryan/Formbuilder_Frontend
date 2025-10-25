import React, { useState } from 'react';
import QuestionEditor from './QuestionEditor';
import { generateId } from '../../utils/helpers';
import '../../styles/components/FormBuilder/FormBuilderCanvas.css';

const FormBuilderCanvas = ({
  questions,
  onQuestionsChange,
  formTitle,
  formDescription
}) => {
  const [draggedOver, setDraggedOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDraggedOver(true);
  };

  const handleDragLeave = () => {
    setDraggedOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDraggedOver(false);

    try {
      const fieldType = JSON.parse(e.dataTransfer.getData('fieldType'));

      const newQuestion = {
        _id: `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: fieldType.type,
        question: `New ${fieldType.label} Question`,
        description_enabled: false,
        description: '',
        single_choice: fieldType.type === 'choice' ? true : false,
        multiple_choice: false,
        options: fieldType.type === 'choice'
          ? [
            { _id: generateId(), value: 'Option 1' },
            { _id: generateId(), value: 'Option 2' }
          ]
          : [],
        format: fieldType.type === 'date_picker' ? 'MM/DD/YYYY' : null,
        required: false,
        order: questions.length,
        maxLength: null,
        enabled: true
      };

      onQuestionsChange([...questions, newQuestion]);
    } catch (error) {
      console.error('Error adding question:', error);
    }
  };

  const handleQuestionUpdate = (index, updatedQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    onQuestionsChange(newQuestions);
  };

  const handleQuestionDelete = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    newQuestions.forEach((q, i) => {
      q.order = i;
    });
    onQuestionsChange(newQuestions);
  };

  const handleQuestionMove = (index, direction) => {
    const newQuestions = [...questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < questions.length) {
      [newQuestions[index], newQuestions[newIndex]] =
        [newQuestions[newIndex], newQuestions[index]];

      newQuestions.forEach((q, i) => {
        q.order = i;
      });
      onQuestionsChange(newQuestions);
    }
  };

  const handleQuestionDuplicate = (duplicatedQuestion) => {
    const questionToDuplicate = {
      ...duplicatedQuestion,
      _id: `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      order: questions.length
    };

    const newQuestions = [...questions, questionToDuplicate];
    onQuestionsChange(newQuestions);
  };

  return (
    <div className="form-builder-canvas">
      {/* Header Section */}
      <div className="form-header-section">
        <div className="form-header-label">Header</div>
        <div className="form-header-card">
          <div className="form-header-content">
            <h2 className="form-title">{formTitle || 'Untitled Form'}</h2>
            <p className="form-description">{formDescription || 'No description available'}</p>
          </div>
        </div>
      </div>


      {/* Drag and Drop Section */}
      <div className="drag-drop-section">
        <div
          className={`drop-zone ${draggedOver ? 'dragging' : ''} ${questions.length === 0 ? 'empty' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {questions.length === 0 ? (
            <div className="empty-state">
              {/* Add icon here */}
            </div>
          ) : (
            <div className="questions-container">
              {questions.map((question, index) => (
                <QuestionEditor
                  key={question._id}
                  question={question}
                  index={index}
                  totalQuestions={questions.length}
                  onUpdate={(updated) => handleQuestionUpdate(index, updated)}
                  onDelete={() => handleQuestionDelete(index)}
                  onMove={(direction) => handleQuestionMove(index, direction)}
                  onDuplicate={handleQuestionDuplicate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormBuilderCanvas;
