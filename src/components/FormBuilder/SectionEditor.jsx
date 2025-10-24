import React, { useState } from 'react';
import QuestionEditor from './QuestionEditor';
import { generateId } from '../../utils/helpers';
import '../../styles/components/FormBuilder/SectionEditor.css';

const SectionEditor = ({ questions, onQuestionsChange, formTitle, formDescription }) => {
  const [draggedOver, setDraggedOver] = useState(null);

  const fieldTypes = [
    { type: 'short_text', label: 'Short Text', icon: '📝' },
    { type: 'long_text', label: 'Long Text', icon: '📄' },
    { type: 'date_picker', label: 'Date Picker', icon: '📅' },
    { type: 'choice', label: 'Dropdown', icon: '📋' },
    { type: 'file_upload', label: 'File Upload', icon: '📁' },
    { type: 'number', label: 'Number', icon: '🔢' }
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
        _id: `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: fieldType.type,
        question: `New ${fieldType.label} Question`, // ← CHANGED: Use 'question' instead of 'text'
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
    <div className="section-editor">
      <div className="section-editor-sidebar">
        <h3 className="sidebar-title">Input Fields</h3>


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
        {/* Form Header as separate card */}
        <div className="form-header-card">
          <div className="form-header-label">Header</div>
          <div className="form-header-content">
            <h2 className="form-title">{formTitle || 'Untitled Form'}</h2>
            <p className="form-description">{formDescription || 'No description available'}</p>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          className={`drop-zone ${draggedOver ? 'dragging' : ''} ${questions.length === 0 ? 'empty' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {questions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">➕</div>
               <p>Drag field form the left panel</p>
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

export default SectionEditor;
