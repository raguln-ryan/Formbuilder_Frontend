import React, { useState, useEffect } from 'react';
import Input from '../Common/Input';
import Button from '../Common/Button';
import '../../styles/components/FormBuilder/QuestionEditor.css';
import elements from '../../assets/elements.png';
import TrashBin from '../../assets/TrashBin.png';
import Threedot from './../../assets/Threedot.png';
import file from './../../assets/file.png';

const QuestionEditor = ({
  question,
  index,
  totalQuestions,
  isEditing,
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
  const [localQuestion, setLocalQuestion] = useState(question);

  // Update local question when prop changes
  useEffect(() => {
    setLocalQuestion(question);
  }, [question]);

  console.log(localQuestion)

  const handleFieldChange = (field, value) => {
    const updated = { ...localQuestion, [field]: value };
    setLocalQuestion(updated);
    onUpdate(updated); // This updates the parent component
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

  const handleDuplicate = (e) => {
    e.stopPropagation(); // Prevent triggering edit mode
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

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent triggering edit mode
    onDelete();
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
      short_text: 'Short Text (Up to 100 Characters)',
      long_text: 'Long Text (Up to 500 Characters)',
      number: 'Numeric Value',
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

    // Add dragging class to the entire question editor
    e.target.closest('.question-editor')?.classList.add('is-dragging');
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

    // Remove dragging class
    e.target.closest('.question-editor')?.classList.remove('is-dragging');

    if (onDragEnd) {
      onDragEnd();
    }
  };

  const hasOptions = localQuestion.type === 'choice';
  const isDatePicker = localQuestion.type === 'date_picker';
  const isFileUpload = localQuestion.type === 'file_upload';
  const isDropdown = localQuestion.type === 'choice';

  // Render display mode (when not editing)
  const renderDisplayMode = () => {
    return (
      <div className="question-display-mode">
        <p className="question-display-title">
          {localQuestion.question || `Click here to add ${getQuestionTypeLabel(localQuestion.type).toLowerCase()} title`}
        </p>

        {localQuestion.description_enabled && localQuestion.description && (
          <p className="question-display-description">
            {localQuestion.description}
          </p>
        )}

        <div className="question-type-hint" style={{padding: localQuestion.type === 'file_upload' ? 0 : ''}}>
          {localQuestion.type === 'date_picker'
            ? localQuestion.date_format || 'DD/MM/YYYY'
            : localQuestion.type === 'file_upload' ?
            <></> :
            getQuestionTypeDescription(localQuestion.type)
          }
        </div>

        {hasOptions && localQuestion.options?.map((option, idx) => (
          <div key={option._id} className="display-option-item">
            {option.value}
          </div>
        ))}

        {isFileUpload ? (
          <div className="file-upload-display">
            <img src={file} alt="File Upload" className="file-icon" />
            <div className="file-info">
              <p>File Upload (Only one file allowed)</p>
              <p className="file-support">Supported files: PDF, PNG, JPG | Max file size 2 MB</p>
            </div>
          </div>
        ) : <></>}
      </div>
    );
  };

  // Render edit mode (when editing)
  const renderEditMode = () => {
    return (
      <div className="question-body" onClick={(e) => e.stopPropagation()}>
        <div className="question-form">
          {/* Three-dot drag handle */}
          <div
            className="drag-handle-wrapper"
            draggable="true"
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            title="Drag to reorder"
            style={{ cursor: 'move' }}
          >
            <img src={Threedot} alt="Drag to reorder" className="three-dot" />
          </div>

          <Input
            value={localQuestion.question || ''}
            onChange={(e) => handleFieldChange('question', e.target.value)}
            placeholder={`Add ${getQuestionTypeLabel(localQuestion.type).toLowerCase()} title`}
            required
          />
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

          {/* Question Type Display - Disabled */}
          <div className="question-type-display">
            <label className="type-label">Question Type</label>
            <div className="type-info-box">
              <div className="type-name">
                {
                  localQuestion.type === 'date_picker' ?
                    localQuestion.date_format :
                    localQuestion.type === 'file_upload' ?
                    <div className="file-config-info">
                
              <div className="file-info-item">
                <img src={file} alt="File Upload" className="file-icon" />
              </div>
              <div style={{display: 'flex', flexDirection: 'column', marginLeft: 16}}>
                <span className="info-text">Supported files: PDF, PNG, JPG</span>
                <span className="info-text">Max file size: 2 MB</span>
              </div>
              <div className="file-info-item">
              </div>
            </div>
                     :
                    getQuestionTypeDescription(localQuestion.type)
                }

              </div>
            </div>
          </div>



          {localQuestion.type === 'date_picker' && (
            <div className="date-wrap">
              {/* Date Format Radio Buttons */}
              <div className="date-format-group">
                <span className="format-label">Date Format:</span>
                <label className="radio-option">
                  <input
                    type="radio"
                    name={`dateformat-${localQuestion._id}`}
                    value="DD/MM/YYYY"
                    checked={(localQuestion.date_format || "DD/MM/YYYY") === "DD/MM/YYYY"}
                    onChange={() => handleFieldChange('date_format', 'DD/MM/YYYY')}
                  />
                  <span>DD/MM/YYYY</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name={`dateformat-${localQuestion._id}`}
                    value="DD-MM-YYYY"
                    checked={localQuestion.date_format === "DD-MM-YYYY"}
                    onChange={() => handleFieldChange('date_format', 'DD-MM-YYYY')}
                  />
                  <span>DD-MM-YYYY</span>
                </label>
              </div>
            </div>
          )}

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
                    checked={localQuestion.multiple_choice !== true}
                    onChange={() => {
                      const updated = {
                        ...localQuestion,
                        single_choice: true,
                        multiple_choice: false
                      };
                      setLocalQuestion(updated);
                      onUpdate(updated); // Update parent with both fields at once
                    }}
                    style={{ marginRight: 8 }}
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
                      const updated = {
                        ...localQuestion,
                        single_choice: false,
                        multiple_choice: true
                      };
                      setLocalQuestion(updated);
                      onUpdate(updated); // Update parent with both fields at once
                    }}
                    style={{ marginRight: 8, marginLeft: 8 }}
                  />
                  <span>Multi Select</span>
                </label>
              </div>
            </div>
          )}

          {/* File Upload Configuration */}
          {isFileUpload && (
            <></>
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
              onClick={handleDeleteClick}
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
    );
  };

  return (
    <div
      className={`question-editor ${isEditing ? 'expanded editing' : 'collapsed'} ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        cursor: 'pointer',
        borderRadius: '16px',
      }}
    >
      {isEditing ? renderEditMode() : renderDisplayMode()}
    </div>
  );
};

export default QuestionEditor;
