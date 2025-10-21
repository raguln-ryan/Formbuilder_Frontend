import React, { useState } from 'react';
import Input from '../Common/Input';
import Button from '../Common/Button';
import { QUESTION_TYPES } from '../../utils/constants';
import '../../styles/components/FormBuilder/QuestionEditor.css';

const QuestionEditor = ({ question, index, totalQuestions, onUpdate, onDelete, onMove }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [options, setOptions] = useState(question.options || []);

  const handleQuestionChange = (field, value) => {
    const updatedQuestion = { ...question, [field]: value };
    
    if (field === 'type') {
      // Reset type-specific fields when type changes
      if (['checkbox', 'radio', 'dropdown'].includes(value)) {
        updatedQuestion.options = options.length > 0 ? options : ['Option 1'];
        updatedQuestion.multipleChoice = value === 'checkbox';
        updatedQuestion.singleChoice = value === 'radio' || value === 'dropdown';
      } else {
        updatedQuestion.options = [];
        updatedQuestion.multipleChoice = false;
        updatedQuestion.singleChoice = false;
      }
    }
    
    onUpdate(updatedQuestion);
  };

  const handleOptionsChange = (newOptions) => {
    setOptions(newOptions);
    onUpdate({ ...question, options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...options, `Option ${options.length + 1}`];
    handleOptionsChange(newOptions);
  };

  const updateOption = (optionIndex, value) => {
    const newOptions = [...options];
    newOptions[optionIndex] = value;
    handleOptionsChange(newOptions);
  };

  const deleteOption = (optionIndex) => {
    const newOptions = options.filter((_, i) => i !== optionIndex);
    handleOptionsChange(newOptions);
  };

  const hasOptions = ['checkbox', 'radio', 'dropdown'].includes(question.type);

  return (
    <div className="question-editor">
      <div className="question-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="question-info">
          <span className="question-number">Question {index + 1}</span>
          {question.text && <span className="question-title">{question.text}</span>}
        </div>
        <div className="question-actions">
          <Button
            variant="secondary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMove('up');
            }}
            disabled={index === 0}
          >
            ↑
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMove('down');
            }}
            disabled={index === totalQuestions - 1}
          >
            ↓
          </Button>
          <Button
            variant="danger"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            Delete
          </Button>
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="question-body">
          <Input
            label="Question Text"
            value={question.text}
            onChange={(e) => handleQuestionChange('text', e.target.value)}
            required
            placeholder="Enter your question"
          />

          <Input
            type="select"
            label="Question Type"
            value={question.type}
            onChange={(e) => handleQuestionChange('type', e.target.value)}
            options={QUESTION_TYPES}
          />

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => handleQuestionChange('required', e.target.checked)}
              />
              Required
            </label>

            <label>
              <input
                type="checkbox"
                checked={question.descriptionEnabled}
                onChange={(e) => handleQuestionChange('descriptionEnabled', e.target.checked)}
              />
              Enable Description
            </label>
          </div>

          {question.descriptionEnabled && (
            <Input
              type="textarea"
              label="Description"
              value={question.description}
              onChange={(e) => handleQuestionChange('description', e.target.value)}
              placeholder="Add helpful text about this question"
            />
          )}

          {hasOptions && (
            <div className="options-section">
              <div className="options-header">
                <h4>Options</h4>
                <Button size="small" onClick={addOption}>Add Option</Button>
              </div>
              <div className="options-list">
                {options.map((option, optionIndex) => (
                  <div key={optionIndex} className="option-item">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(optionIndex, e.target.value)}
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => deleteOption(optionIndex)}
                      disabled={options.length <= 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionEditor;
