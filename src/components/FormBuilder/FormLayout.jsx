import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SectionEditor from './SectionEditor';
import QuestionPreview from './QuestionPreview';
import Modal from '../Common/Modal';
import { togglePreview, setShowPublishModal } from '../../store/slices/formBuilderSlice';
import '../../styles/components/FormBuilder/FormEditor.css';

const FormLayout = ({
  onSaveAsDraft,
  onPublish,
  saving
}) => {
  const dispatch = useDispatch();
  
  // GET DATA FROM REDUX STORE
  const { 
    formData,
    questions,
    showPreview, 
    showPublishModal 
  } = useSelector(state => state.formBuilder);
  
  const handleTogglePreview = () => {
    dispatch(togglePreview());
  };
  
  const handlePublishClick = () => {
    dispatch(setShowPublishModal(true));
  };
  
  const confirmPublish = () => {
    dispatch(setShowPublishModal(false));
    onPublish();
  };
  
  return (
    <div className="form-editor-content-area1">
      <div className="form-layout-wrapper">
        {showPreview ? (
          <div className="preview-modal">
            <div className="preview-modal-content">
              <div className="preview-modal-header">
                <h2>Form Preview</h2>
                <button className="close-preview" onClick={handleTogglePreview}>×</button>
              </div>
              <QuestionPreview
                formTitle={formData.title}
                formDescription={formData.description}
                questions={questions}
              />
            </div>
          </div>
        ) : null}

        <SectionEditor />  {/* NO PROPS NEEDED */}

        {!showPreview && (
          <div className="form-config-actions-wrapper">
            <button
              className="action-button action-button-secondary"
              onClick={handleTogglePreview}
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
                {saving ? 'Publishing...' : `Publish Form`}
              </button>
            </div>
          </div>
        )}

        <Modal
          isOpen={showPublishModal}
          onClose={() => dispatch(setShowPublishModal(false))}
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
