import React from 'react';
import '../../styles/components/Common/Input.css';

const Input = ({ 
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = '',
  children,
  ...props
}) => {
  const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          id={inputId}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`input-field ${error ? 'input-error' : ''}`}
          {...props}
        />
      ) : type === 'select' ? (
        <select
          id={inputId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`input-field ${error ? 'input-error' : ''}`}
          {...props}
        >
          {children}
        </select>
      ) : (
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`input-field ${error ? 'input-error' : ''}`}
          {...props}
        />
      )}
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};

export default Input;
