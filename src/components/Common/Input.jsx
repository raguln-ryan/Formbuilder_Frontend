import React from 'react';
import '../../styles/components/Common/Input.css';

const Input = ({
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  options = [],
  multiple = false,
  className = ''
}) => {
  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className={`input-field ${error ? 'input-error' : ''}`}
            rows={4}
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={onChange}
            required={required}
            multiple={multiple}
            className={`input-field ${error ? 'input-error' : ''}`}
          >
            <option value="">Select an option</option>
            {options.map((option, index) => (
              <option key={index} value={option.value || option}>
                {option.label || option}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className={`input-field ${error ? 'input-error' : ''}`}
          />
        );
    }
  };

  return (
    <div className={`input-wrapper ${className}`}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      {renderInput()}
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};

export default Input;
