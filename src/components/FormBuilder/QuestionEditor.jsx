import React, { useState } from 'react';
import Input from '../Common/Input';
import Button from '../Common/Button';
import '../../styles/components/FormBuilder/QuestionEditor.css';
import elements from '../../assets/elements.png';
import TrashBin from '../../assets/TrashBin.png';
import Threedot from './../../assets/Threedot.png';

const QuestionEditor = ({
  question,
  index,
  totalQuestions,
  onUpdate,
  onDelete,
  onMove,
  onDuplicate,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging
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

  const getQuestionTypeDescription = (type) => {
    const descriptions = {
      short_text: 'Short Text(Upto 100 Characters)',
      long_text: 'Long Text(Upto 500 Characters)',
      number: 'Numeric  Value',
      date_picker: 'DD/MM/YY',
      choice: 'Dropdown selection',
      file_upload: 'One file allowed'
    };
    return descriptions[type] || '';
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
    if (onDragStart) {
      onDragStart(index);
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDragOver) {
      onDragOver(e, index);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDrop) {
      onDrop(e, index);
    }
  };

  const handleDragEnd = (e) => {
    e.preventDefault();
    if (onDragEnd) {
      onDragEnd();
    }
  };

  const hasOptions = localQuestion.type === 'choice';
  const isDatePicker = localQuestion.type === 'date_picker';
  const isFileUpload = localQuestion.type === 'file_upload';
  const isDropdown = localQuestion.type === 'choice';

  return (
    <div
      className={`question-editor ${isExpanded ? 'expanded' : 'collapsed'} ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
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
          <div
            className="drag-handle"
            title="Drag to reorder"
            draggable="true"
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
          >
            <img src={Threedot} alt="Drag" className="drag-icon" />
          </div>
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

            {/* Question Type Display - Disabled */}
            <div className="question-type-display">
              <label className="type-label">Question Type</label>
              <div className="type-info-box">
                <div className="type-name">
                  {getQuestionTypeDescription(localQuestion.type)}
                </div>
              </div>
            </div>



            {/* Selection Type for Dropdown */}
            {isDropdown && (
              <div className="form-row">
                <label className="selection-type-label">Selection Type</label>
                <div className="selection-type-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name={`selection-type-${index}`}
                      value="single"
                      checked={!localQuestion.multiple_choice}
                      onChange={() => {
                        handleFieldChange('single_choice', true);
                        handleFieldChange('multiple_choice', false);
                      }}
                    />
                    <span>Single Select</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name={`selection-type-${index}`}
                      value="multiple"
                      checked={localQuestion.multiple_choice === true}
                      onChange={() => {
                        handleFieldChange('single_choice', false);
                        handleFieldChange('multiple_choice', true);
                      }}
                    />
                    <span>Multi Select</span>
                  </label>
                </div>
              </div>
            )}

            {/* File Upload Configuration */}
            {isFileUpload && (
              <div className="file-config-info">
                <div className="file-info-item">
                  <span className="info-icon">📎</span>
                  <span className="info-text">Supported files: PDF, PNG, JPG</span>
                </div>
                <div className="file-info-item">
                  <span className="info-text">Max file size: 2 MB</span>
                </div>
              </div>
            )}

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
            <div className="actions-right-container">
              {/* Copy Button */}
              <button
                className="action-button copy"
                onClick={handleDuplicate}
                title="Duplicate Question"
              >
                <img src={elements} alt="Copy" className="action-icon" />
              </button>

              {/* Delete Button */}
              <button
                className="action-button delete"
                onClick={onDelete}
                title="Delete Question"
              >
                <img src={TrashBin} alt="Delete" className="action-icon" />
              </button>

              {/* Description Toggle */}
              <label className="toggle-switch description-toggle">
                <span className="toggle-label">Description</span>
                <input
                  type="checkbox"
                  checked={localQuestion.description_enabled || false}
                  onChange={(e) => handleFieldChange('description_enabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>

              {/* Required Toggle */}
              <label className="toggle-switch required-toggle">
                <span className="toggle-label">Required</span>
                <input
                  type="checkbox"
                  checked={localQuestion.required || false}
                  onChange={(e) => handleFieldChange('required', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionEditor;
