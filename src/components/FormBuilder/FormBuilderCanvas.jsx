import React, { useState } from 'react';
import QuestionEditor from './QuestionEditor';
import { generateId } from '../../utils/helpers';
import Drag from './../../assets/drag.png';
import toast from 'react-hot-toast';
import '../../styles/components/FormBuilder/FormBuilderCanvas.css';

const FormBuilderCanvas = ({
  questions,
  onQuestionsChange,
  formTitle,
  formDescription,
  formId = ''
}) => {
  const [draggedOver, setDraggedOver] = useState(false);
  const [draggedQuestionIndex, setDraggedQuestionIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

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
        question: '',
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
      toast.success(`${fieldType.label} field added successfully!`, {
        icon: '✅',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('Failed to add field. Please try again.');
    }
  };

  const handleQuestionUpdate = (index, updatedQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    onQuestionsChange(newQuestions);
  };

  const handleQuestionDelete = (index) => {
    const deletedQuestion = questions[index];
    const newQuestions = questions.filter((_, i) => i !== index);
    newQuestions.forEach((q, i) => {
      q.order = i;
    });
    onQuestionsChange(newQuestions);
    
    toast.success('Question deleted', {
      duration: 3000,
    });
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
      
      toast.success(`Question moved ${direction}`, {
        icon: direction === 'up' ? '⬆️' : '⬇️',
        duration: 1500,
        position: 'bottom-center',
      });
    } else {
      toast.error(`Cannot move question ${direction}`, {
        duration: 2000,
      });
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
    
    toast.success('Question duplicated successfully!', {
      duration: 2000,
    });
  };

  // New drag and drop handlers for reordering questions
  const handleQuestionDragStart = (index) => {
    setDraggedQuestionIndex(index);
  };

  const handleQuestionDragOver = (e, index) => {
    e.preventDefault();
    if (draggedQuestionIndex === null) return;
    
    setDragOverIndex(index);
    
    // Add visual feedback
    const dropIndicator = e.currentTarget;
    if (dropIndicator) {
      dropIndicator.classList.add('drag-over');
    }
  };

  const handleQuestionDrop = (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove visual feedback
    const dropIndicator = e.currentTarget;
    if (dropIndicator) {
      dropIndicator.classList.remove('drag-over');
    }
    
    if (draggedQuestionIndex === null || draggedQuestionIndex === dropIndex) {
      setDraggedQuestionIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newQuestions = [...questions];
    const draggedQuestion = newQuestions[draggedQuestionIndex];
    
    // Remove the dragged question from its original position
    newQuestions.splice(draggedQuestionIndex, 1);
    
    // Insert it at the new position
    newQuestions.splice(dropIndex, 0, draggedQuestion);
    
    // Update the order property for all questions
    newQuestions.forEach((q, index) => {
      q.order = index;
    });
    
    // Update the state
    onQuestionsChange(newQuestions);
    
    // Reset drag state
    setDraggedQuestionIndex(null);
    setDragOverIndex(null);
    
    toast.success('Question reordered', {
      icon: '↕️',
      duration: 1500,
    });
  };

  const handleQuestionDragEnd = () => {
    // Clean up any remaining drag states
    setDraggedQuestionIndex(null);
    setDragOverIndex(null);
    
    // Remove any remaining visual feedback
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
  };

  return (
    <div className={`form-builder-canvas ${formId ? 'disabled' : ''}`}>
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
            <div className="dragicon">
              <img src={Drag} alt="drag icon" className="drag-image" />
              <span className="drag-text">Drag fields from the left panel</span>
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
                  onDragStart={handleQuestionDragStart}
                  onDragEnd={handleQuestionDragEnd}
                  onDragOver={handleQuestionDragOver}
                  onDrop={handleQuestionDrop}
                  isDragging={draggedQuestionIndex === index}
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
