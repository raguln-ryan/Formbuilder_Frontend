import React, { useState } from 'react';
import '../../styles/components/FormBuilder/FieldsSidebar.css';
import shorttext from './../../assets/shorttext.png';
import longtext from './../../assets/longtext.png';
import fileupload from './../../assets/fileupload.png';
import numeric from './../../assets/numeric.png';
import calendar from './../../assets/calendar.png';
import dropdown from './../../assets/dropdown.png';

const FieldsSidebar = ({ onFieldDragStart, formId = '' }) => {
  const [activeTab, setActiveTab] = useState('input'); // 'input' or 'udf'
  
  // Input field types with background colors
  const inputFieldTypes = [
    { type: 'short_text', label: 'Short Text', icon: shorttext, backgroundColor: '#CBE3FE'},
    { type: 'long_text', label: 'Long Text', icon: longtext, backgroundColor: '#7B61FF40' },
    { type: 'date_picker', label: 'Date Picker', icon: calendar, backgroundColor: '#BBE9E4' },
    { type: 'choice', label: 'Dropdown', icon: dropdown, backgroundColor: '#DBF3CC' },
    { type: 'file_upload', label: 'File Upload', icon: fileupload, backgroundColor: '#E7CCF3' },
    { type: 'number', label: 'Number', icon: numeric, backgroundColor: '#F3CCE1' }
  ];
  
  // UDF (User Defined Fields) types with background colors
  const udfFieldTypes = [
    { type: 'udf_text', label: 'UDF Text', icon: shorttext, backgroundColor: '#EDE7F6' },
    { type: 'udf_select', label: 'UDF Select', icon: dropdown, backgroundColor: '#FFF9C4' },
    { type: 'udf_date', label: 'UDF Date', icon: calendar, backgroundColor: '#F1F8E9' },
    { type: 'udf_number', label: 'UDF Number', icon: numeric, backgroundColor: '#E0F7FA' }
  ];
  
  // Get current field types based on active tab
  const fieldTypes = activeTab === 'input' ? inputFieldTypes : udfFieldTypes;
  
  const handleDragStart = (e, fieldType) => {
    e.dataTransfer.setData('fieldType', JSON.stringify(fieldType));
    e.dataTransfer.effectAllowed = 'copy';
    if (onFieldDragStart) {
      onFieldDragStart(fieldType);
    }
  };
  
  return (
    <div className={`fields-sidebar ${formId ? 'disabled' : ''}`}>
      {/* Tab Headers */}
      <div className="sidebar-tabs">
        <button 
          className={`sidebar-tab ${activeTab === 'input' ? 'active' : ''}`}
          onClick={() => setActiveTab('input')}
        >
          Input Fields
        </button>
        <button 
          className={`sidebar-tab ${activeTab === 'udf' ? 'active' : ''}`}
          onClick={() => setActiveTab('udf')}
        >
          UDF Fields
        </button>
      </div>
      
      {/* Field Types List */}
      <div className="field-types-list">
        {fieldTypes.map((field) => (
          <div
            key={field.type}
            className="field-type-item"
            draggable
            onDragStart={formId ? () => {} : (e) => handleDragStart(e, field)}
          >
            <div 
              className="field-icon-wrapper" 
              style={{ backgroundColor: field.backgroundColor }}
            >
              <img src={field.icon} alt={field.label} className="field-icon" />
            </div>
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
