import React, { useState, useRef, useEffect } from 'react';
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
  onHeaderChange,
  formId = ''
}) => {
  // Add ALL missing state variables
  const [draggedOver, setDraggedOver] = useState(false);
  const [draggedQuestionIndex, setDraggedQuestionIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [isDraggingFromSidebar, setIsDraggingFromSidebar] = useState(false);

  // Refs for click outside detection
  const questionRefs = useRef({});
  const headerRef = useRef(null);

  const [isHeaderEditing, setIsHeaderEditing] = useState(false);

  const [headerTitle, setHeaderTitle] = useState(formTitle || '');

  const [headerDescription, setHeaderDescription] = useState(formDescription || '');

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {

      if (isHeaderEditing && headerRef.current && !headerRef.current.contains(event.target)) {

        setIsHeaderEditing(false);

        if (onHeaderChange) {

          onHeaderChange({

            title: headerTitle.trim(),

            description: headerDescription.trim(),

          });

        }

      }
      // Check if click is outside the currently editing question
      if (editingQuestionId && questionRefs.current[editingQuestionId]) {
        if (!questionRefs.current[editingQuestionId].contains(event.target)) {
          setEditingQuestionId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingQuestionId, isHeaderEditing, headerTitle, headerDescription]);

  // Listen for drag events from sidebar
  useEffect(() => {
    const handleGlobalDragStart = (e) => {
      // Check if dragging from sidebar (field type)
      if (e.dataTransfer.types.includes('fieldtype')) {
        setIsDraggingFromSidebar(true);
      }
    };

    const handleGlobalDragEnd = () => {
      setIsDraggingFromSidebar(false);
      setDraggedOver(false);
    };

    document.addEventListener('dragstart', handleGlobalDragStart);
    document.addEventListener('dragend', handleGlobalDragEnd);

    return () => {
      document.removeEventListener('dragstart', handleGlobalDragStart);
      document.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only show drop zone when dragging from sidebar
    if (isDraggingFromSidebar) {
      e.dataTransfer.dropEffect = 'copy';
      if (!draggedOver) {
        setDraggedOver(true);
      }
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDraggingFromSidebar) {
      setDraggedOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    
    // Only hide if leaving the entire drop zone
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDraggedOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOver(false);
    setIsDraggingFromSidebar(false);

    try {
      const fieldTypeData = e.dataTransfer.getData('fieldType');
      if (!fieldTypeData) return;
      
      const fieldType = JSON.parse(fieldTypeData);
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

      const newQuestions = [...questions, newQuestion];
      onQuestionsChange(newQuestions);
      
      // Set the new question as editing
      setEditingQuestionId(newQuestion._id);
      
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
    const newQuestions = questions
      .filter((_, i) => i !== index)
      .map((q, i) => ({
        ...q,
        order: i,
      }));
    onQuestionsChange(newQuestions);
    setEditingQuestionId(null);
    toast.success('Question deleted', { duration: 3000 });
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

  const toggleQuestionEdit = (questionId) => {
    if (formId) return; // Don't allow editing in view mode
    setEditingQuestionId(editingQuestionId === questionId ? null : questionId);
  };

  return (
    <div className={`form-builder-canvas ${formId ? 'disabled' : ''}`}>
      {/* Editable Header Section */}

      <div className="form-header-section" ref={headerRef}>

        <div className="form-header-label">Header</div>

        <div

          className="form-header-card"

          onClick={() => !formId && setIsHeaderEditing(true)}

          style={{ cursor: formId ? 'default' : 'pointer' }}

        >

          <div className="form-header-content">

            {isHeaderEditing ? (

              <>

                <input

                  type="text"

                  value={headerTitle}

                  placeholder="Enter form title"

                  onChange={(e) => setHeaderTitle(e.target.value)}

                  className="editable-header-title"

                />

                <textarea

                  value={headerDescription}

                  placeholder="Enter form description"

                  onChange={(e) => setHeaderDescription(e.target.value)}

                  className="editable-header-description"

                />

              </>

            ) : (

              <>

                <h2 className="form-title">{headerTitle || 'Click to add form title'}</h2>

                <p className="form-description">{headerDescription || 'Click to add form description'}</p>

              </>

            )}

          </div>

        </div>

      </div>



      {/* Drag and Drop Section */}
      <div
        className={`drag-drop-section ${draggedOver ? 'dragging-over' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Questions Container */}
        {questions.length > 0 && (
          <div className="questions-container">
            {questions.map((question, index) => (
              <div
                key={question._id}
                ref={(el) => {
                  if (el) questionRefs.current[question._id] = el;
                }}
                onClick={() => toggleQuestionEdit(question._id)}
              >
                <QuestionEditor
                  question={question}
                  index={index}
                  totalQuestions={questions.length}
                  isEditing={editingQuestionId === question._id}
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
              </div>
            ))}
            
            {/* Drop placeholder at the bottom when dragging from sidebar */}
            {isDraggingFromSidebar && draggedOver && (
              <div className="drop-zone-placeholder">
                <p>Drag and drop the item here</p>
              </div>
            )}
          </div>
        )}

        {/* Empty state or drop placeholder */}
        {questions.length === 0 && (
          <>
            {isDraggingFromSidebar && draggedOver ? (
              <div className="drop-zone-placeholder" style={{width: '100%'}}>
                <p>Drag and drop the item here</p>
              </div>
            ) : (
              <div className="empty-state" style={{marginTop: 'unset', width: '100%', border: '1px dashed #5D38DF', background: '#F2EFFC' }}>
                <img src={Drag} alt="drag icon" className="drag-image" />
                <span className="drag-text">Drag fields from the left panel</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FormBuilderCanvas;
