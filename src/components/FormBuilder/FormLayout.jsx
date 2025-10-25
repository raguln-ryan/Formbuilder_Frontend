import React, { useState } from 'react';
import SectionEditor from './SectionEditor';
import QuestionPreview from './QuestionPreview';
import Modal from '../Common/Modal';
import '../../styles/components/FormBuilder/FormEditor.css';

const FormLayout = ({
  formData,
  questions,
  onQuestionsChange,
  onSaveAsDraft,
  onPublish,
  saving
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  
  const handlePublishClick = () => {
    setShowPublishModal(true);
  };

  const confirmPublish = () => {
    setShowPublishModal(false);
    onPublish(); // Call the actual publish function from FormEditor
  };

  return (
    <div className="form-editor-content-area1">
      <div className="form-layout-wrapper">
        {showPreview ? (
          <div className="preview-modal">
            <div className="preview-modal-content">
              <div className="preview-modal-header">
                <h2>Form Preview</h2>
                <button className="close-preview" onClick={togglePreview}>×</button>
              </div>
              <QuestionPreview
                formTitle={formData.title}
                formDescription={formData.description}
                questions={questions}
              />
            </div>
          </div>
        ) : null}


        <SectionEditor
          questions={questions}
          onQuestionsChange={onQuestionsChange}
          formTitle={formData.title}
          formDescription={formData.description}
        />


        <div className="form-config-actions-wrapper">
          <button
            className="action-button action-button-secondary"
            onClick={togglePreview}
          >
            <span style={{ marginRight: '8px' }}>👁️</span>
            Preview Form
          </button>
          <div className="actions-right-group">
            <button
              className="action-button action-button-outline"
              onClick={onSaveAsDraft}
              disabled={saving || questions.length === 0}
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              className="action-button action-button-primary"
              onClick={handlePublishClick}
              disabled={saving || questions.length === 0}
            >
              {saving ? 'Publishing...' : `Publish Form `}
            </button>
          </div>
        </div>
        {/* Publish Confirmation Modal */}
        <Modal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          onConfirm={confirmPublish}
          title="Publish Form"
          message="Are you sure you want to publish this form? Once published, editing will be locked after the any workflow linked to this form. This action cannot be undone"
          type="publish"
          variant="default"
        />

      </div>
    </div>
  );
};

export default FormLayout;
