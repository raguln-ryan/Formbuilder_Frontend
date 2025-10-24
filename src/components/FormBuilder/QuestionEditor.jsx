import React, { useState } from 'react';
import Input from '../Common/Input';
import Button from '../Common/Button';
import '../../styles/components/FormBuilder/QuestionEditor.css';

const QuestionEditor = ({ 
  question, 
  index, 
  totalQuestions, 
  onUpdate, 
  onDelete, 
  onMove,
  onDuplicate 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localQuestion, setLocalQuestion] = useState(question);

  const handleFieldChange = (field, value) => {
    const updated = { ...localQuestion, [field]: value };
    setLocalQuestion(updated);
    onUpdate(updated);
  };

  const handleOptionChange = (optionIndex, value) => {
    const newOptions = [...localQuestion.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], value };
    handleFieldChange('options', newOptions);
  };

  const addOption = () => {
    const newOptions = [...(localQuestion.options || []), { 
      _id: `opt_${Date.now()}`, 
      value: `Option ${(localQuestion.options?.length || 0) + 1}` 
    }];
    handleFieldChange('options', newOptions);
  };

  const removeOption = (optionIndex) => {
    if (localQuestion.options.length > 2) {
      const newOptions = localQuestion.options.filter((_, i) => i !== optionIndex);
      handleFieldChange('options', newOptions);
    }
  };

  const handleDuplicate = () => {
    // Create a copy of the question with a new ID
    const duplicatedQuestion = {
      ...localQuestion,
      _id: `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: `${localQuestion.question} (Copy)`,
      options: localQuestion.options?.map(opt => ({
        ...opt,
        _id: `opt_${Date.now()}_${Math.random()}`
      }))
    };
    onDuplicate(duplicatedQuestion);
  };

  const getQuestionTypeLabel = (type) => {
    const types = {
      short_text: 'Short Text',
      long_text: 'Long Text',
      number: 'Number',
      date_picker: 'Date Picker',
      choice: 'Dropdown',
      file_upload: 'File Upload'
    };
    return types[type] || type;
  };

  const hasOptions = localQuestion.type === 'choice';

  return (
    <div className={`question-editor ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="question-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="question-header-left">
          <span className="question-number">{index + 1}</span>
          <div className="question-info">
            <span className="question-title">
              {localQuestion.question || 'Untitled Question'}
            </span>
            <span className="question-type-badge">
              {getQuestionTypeLabel(localQuestion.type)}
            </span>
          </div>
        </div>
        
        <div className="question-header-actions">
          <button
            className="icon-button"
            onClick={(e) => {
              e.stopPropagation();
              onMove('up');
            }}
            disabled={index === 0}
            title="Move Up"
          >
            ↑
          </button>
          <button
            className="icon-button"
            onClick={(e) => {
              e.stopPropagation();
              onMove('down');
            }}
            disabled={index === totalQuestions - 1}
            title="Move Down"
          >
            ↓
          </button>
          <span className="expand-indicator">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="question-body">
          <div className="question-form">
            <Input
              label="Question Text"
              value={localQuestion.question || ''}
              onChange={(e) => handleFieldChange('question', e.target.value)}
              placeholder="Enter your question"
              required
            />

            <div className="form-row">
              <Input
                type="select"
                label="Question Type"
                value={localQuestion.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  const updated = { ...localQuestion, type: newType };
                  
                  // Set default options for choice type
                  if (newType === 'choice' && !localQuestion.options) {
                    updated.options = [
                      { _id: 'opt_1', value: 'Option 1' },
                      { _id: 'opt_2', value: 'Option 2' }
                    ];
                    updated.single_choice = true;
                    updated.multiple_choice = false;
                  }
                  
                  // Set format for date picker
                  if (newType === 'date_picker') {
                    updated.format = 'MM/DD/YYYY';
                  }
                  
                  // Clear options for non-choice types
                  if (newType !== 'choice') {
                    updated.options = [];
                    updated.single_choice = false;
                    updated.multiple_choice = false;
                  }
                  
                  setLocalQuestion(updated);
                  onUpdate(updated);
                }}
              >
                <option value="short_text">Short Text</option>
                <option value="long_text">Long Text</option>
                <option value="number">Number</option>
                <option value="date_picker">Date Picker</option>
                <option value="choice">Dropdown</option>
                <option value="file_upload">File Upload</option>
              </Input>
            </div>

            {localQuestion.description_enabled && (
              <Input
                type="textarea"
                label="Description"
                value={localQuestion.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Add helpful text for this question"
                rows={2}
              />
            )}

            {hasOptions && (
              <div className="options-section">
                <div className="options-header">
                  <label className="options-label">Answer Options</label>
                  <Button size="small" onClick={addOption}>
                    + Add Option
                  </Button>
                </div>
                
                <div className="options-list">
                  {(localQuestion.options || []).map((option, optionIndex) => (
                    <div key={option._id || optionIndex} className="option-item">
                      <span className="option-number">{optionIndex + 1}.</span>
                      <Input
                        value={option.value}
                        onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                      <button
                        className="remove-option-btn"
                        onClick={() => removeOption(optionIndex)}
                        disabled={localQuestion.options.length <= 2}
                        title="Remove option"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions Bar */}
          <div className="question-bottom-actions">
            {/* Action Buttons on the left */}
            <div className="action-buttons-group">
              <button
                className="action-button copy"
                onClick={handleDuplicate}
                title="Duplicate Question"
              >
                <span className="action-icon">📋</span>
                <span className="action-text">Copy</span>
              </button>
              <button
                className="action-button delete"
                onClick={onDelete}
                title="Delete Question"
              >
                <span className="action-icon">🗑️</span>
                <span className="action-text">Delete</span>
              </button>
            </div>

            {/* Toggle Switches on the right */}
            <div className="toggle-group">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={localQuestion.required || false}
                  onChange={(e) => handleFieldChange('required', e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Required</span>
              </label>

              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={localQuestion.description_enabled || false}
                  onChange={(e) => handleFieldChange('description_enabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Description</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionEditor;
