import React from 'react';
import '../../styles/components/FormBuilder/FieldsSidebar.css';
import shorttext from './../../assets/shorttext.png';
import longtext from './../../assets/longtext.png';
import fileupload from './../../assets/fileupload.png';
import numeric from './../../assets/numeric.png';
import calendar from './../../assets/calendar.png';
import dropdown from './../../assets/dropdown.png';

const FieldsSidebar = ({ onFieldDragStart }) => {
  const fieldTypes = [
    { type: 'short_text', label: 'Short Text', icon: shorttext },
    { type: 'long_text', label: 'Long Text', icon: longtext },
    { type: 'date_picker', label: 'Date Picker', icon: calendar },
    { type: 'choice', label: 'Dropdown', icon: dropdown },
    { type: 'file_upload', label: 'File Upload', icon: fileupload },
    { type: 'number', label: 'Number', icon: numeric }
  ];

  const handleDragStart = (e, fieldType) => {
    e.dataTransfer.setData('fieldType', JSON.stringify(fieldType));
    e.dataTransfer.effectAllowed = 'copy';
    if (onFieldDragStart) {
      onFieldDragStart(fieldType);
    }
  };

  return (
    <div className="fields-sidebar">
      <h3 className="sidebar-title">Input Fields</h3>
      <div className="field-types-list">
        {fieldTypes.map((field) => (
          <div
            key={field.type}
            className="field-type-item"
            draggable
            onDragStart={(e) => handleDragStart(e, field)}
          >
            <img src={field.icon} alt={field.label} className="field-icon" />
            <div className="field-info">
              <span className="field-label">{field.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FieldsSidebar;
