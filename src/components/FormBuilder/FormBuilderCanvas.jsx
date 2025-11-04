import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import QuestionEditor from './QuestionEditor';
import { generateId } from '../../utils/helpers';
import {
  addQuestion,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  reorderQuestions,
  setDraggedOver,
  setDraggedQuestionIndex,
  setDragOverIndex
} from '../../store/slices/formBuilderSlice';
import Drag from './../../assets/drag.png';
import toast from 'react-hot-toast';
import '../../styles/components/FormBuilder/FormBuilderCanvas.css';

const FormBuilderCanvas = ({ formTitle, formDescription, formId = '' }) => {
  const dispatch = useDispatch();
  const {
    questions,
    draggedOver,
    draggedQuestionIndex,
    dragOverIndex
  } = useSelector(state => state.formBuilder);
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    dispatch(setDraggedOver(true));
  };

  const handleDragLeave = () => {
    dispatch(setDraggedOver(false));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dispatch(setDraggedOver(false));

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

      dispatch(addQuestion(newQuestion));
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
    dispatch(updateQuestion({ index, question: updatedQuestion }));
  };

  const handleQuestionDelete = (index) => {
    dispatch(deleteQuestion(index));
    toast.success('Question deleted', {
      duration: 3000,
    });
  };

  const handleQuestionMove = (index, direction) => {
    dispatch(moveQuestion({ index, direction }));
    
    const canMove = (direction === 'up' && index > 0) || 
                    (direction === 'down' && index < questions.length - 1);
    
    if (canMove) {
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
  
  // Original handleQuestionDuplicate logic
  const handleQuestionDuplicate = (duplicatedQuestion) => {
    dispatch(duplicateQuestion(duplicatedQuestion));
    toast.success('Question duplicated successfully!', {
      duration: 2000,
    });
  };
  
  // Original drag and drop handlers for reordering
  const handleQuestionDragStart = (index) => {
    dispatch(setDraggedQuestionIndex(index));
  };
  
  const handleQuestionDragOver = (e, index) => {
    e.preventDefault();
    if (draggedQuestionIndex === null) return;
    
    dispatch(setDragOverIndex(index));
    
    const dropIndicator = e.currentTarget;
    if (dropIndicator) {
      dropIndicator.classList.add('drag-over');
    }
  };
  
  const handleQuestionDrop = (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    const dropIndicator = e.currentTarget;
    if (dropIndicator) {
      dropIndicator.classList.remove('drag-over');
    }
    
    if (draggedQuestionIndex === null || draggedQuestionIndex === dropIndex) {
      dispatch(setDraggedQuestionIndex(null));
      dispatch(setDragOverIndex(null));
      return;
    }
    
    dispatch(reorderQuestions({ draggedIndex: draggedQuestionIndex, dropIndex }));
    dispatch(setDraggedQuestionIndex(null));
    dispatch(setDragOverIndex(null));
    
    toast.success('Question reordered', {
      icon: '↕️',
      duration: 1500,
    });
  };
  
  const handleQuestionDragEnd = () => {
    dispatch(setDraggedQuestionIndex(null));
    dispatch(setDragOverIndex(null));
    
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
  };
  
  // Original JSX structure - UNCHANGED
  return (
    <div className={`form-builder-canvas ${formId ? 'disabled' : ''}`}>
      <div className="form-header-section">
        <div className="form-header-label">Header</div>
        <div className="form-header-card">
          <div className="form-header-content">
            <h2 className="form-title">{formTitle || 'Untitled Form'}</h2>
            <p className="form-description">{formDescription || 'No description available'}</p>
          </div>
        </div>
      </div>
      
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
