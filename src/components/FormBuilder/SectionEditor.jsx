import React, { useState } from 'react';
import QuestionEditor from './QuestionEditor';
import { generateId } from '../../utils/helpers';
import '../../styles/components/FormBuilder/SectionEditor.css';

const SectionEditor = ({ questions, onQuestionsChange, formTitle, formDescription }) => {
  const [draggedOver, setDraggedOver] = useState(null);
  
  const fieldTypes = [
    { type: 'short_text', label: 'Short Text', icon: '📝', description: 'Single line text input' },
    { type: 'long_text', label: 'Long Text', icon: '📄', description: 'Multi-line text area' },
    { type: 'number', label: 'Number', icon: '🔢', description: 'Numeric input field' },
    { type: 'date_picker', label: 'Date Picker', icon: '📅', description: 'Date selection' },
    { type: 'choice', label: 'Dropdown', icon: '📋', description: 'Dropdown selection' },
    { type: 'file_upload', label: 'File Upload', icon: '📁', description: 'File attachment' }
  ];

  const handleDragStart = (e, fieldType) => {
    e.dataTransfer.setData('fieldType', JSON.stringify(fieldType));
    e.dataTransfer.effectAllowed = 'copy';
  };

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
        questionId: generateId(),
        type: fieldType.type,
        questionText: `New ${fieldType.label} Question`,
        description: '',
        descriptionEnabled: false,
        singleChoice: fieldType.type === 'choice' ? true : false,
        multipleChoice: false,
        options: fieldType.type === 'choice' 
          ? [
              { optionId: generateId(), value: 'Option 1' },
              { optionId: generateId(), value: 'Option 2' }
            ] 
          : null,
        format: fieldType.type === 'date_picker' ? 'MM/DD/YYYY' : null,
        required: false,
        order: questions.length,
        maxLength: fieldType.type === 'short_text' ? 100 : 
                   fieldType.type === 'long_text' ? 500 : null,
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
    // Update order for remaining questions
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
      
      // Update order
      newQuestions.forEach((q, i) => {
        q.order = i;
      });
      onQuestionsChange(newQuestions);
    }
  };

  return (
    <div className="section-editor">
      <div className="section-editor-sidebar">
        <h3 className="sidebar-title">Question Types</h3>
        <p className="sidebar-hint">Drag fields to add them to your form</p>
        
        <div className="field-types-list">
          {fieldTypes.map((field) => (
            <div
              key={field.type}
              className="field-type-item"
              draggable
              onDragStart={(e) => handleDragStart(e, field)}
            >
              <span className="field-icon">{field.icon}</span>
              <div className="field-info">
                <span className="field-label">{field.label}</span>
                <span className="field-description">{field.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-editor-main">
        <div 
          className={`drop-zone ${draggedOver ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Form Header inside drop zone */}
          <div className="form-header-section">
            <h2 className="form-title">{formTitle || 'Untitled Form'}</h2>
            <p className="form-description">{formDescription || 'No description available'}</p>
          </div>

          {questions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>Start building your form</h3>
              <p>Drag question types from the left panel to add them here</p>
            </div>
          ) : (
            <div className="questions-container">
              {questions.map((question, index) => (
                <QuestionEditor
                  key={question.questionId}
                  question={question}
                  index={index}
                  totalQuestions={questions.length}
                  onUpdate={(updated) => handleQuestionUpdate(index, updated)}
                  onDelete={() => handleQuestionDelete(index)}
                  onMove={(direction) => handleQuestionMove(index, direction)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionEditor;
