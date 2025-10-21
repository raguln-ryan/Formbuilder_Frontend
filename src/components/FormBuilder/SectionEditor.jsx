import React from 'react';
import Input from '../Common/Input';
import Button from '../Common/Button';
import '../../styles/components/FormBuilder/SectionEditor.css';

const SectionEditor = ({ section, onUpdate, onDelete }) => {
  // This component can be used for organizing questions into sections if needed
  return (
    <div className="section-editor">
      <div className="section-header">
        <Input
          value={section.title}
          onChange={(e) => onUpdate({ ...section, title: e.target.value })}
          placeholder="Section Title"
        />
        <Button variant="danger" size="small" onClick={onDelete}>
          Delete Section
        </Button>
      </div>
      <Input
        type="textarea"
        value={section.description}
        onChange={(e) => onUpdate({ ...section, description: e.target.value })}
        placeholder="Section Description (optional)"
      />
    </div>
  );
};

export default SectionEditor;
