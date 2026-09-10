import { useId } from 'react';

export default function Input({
  label,
  id,
  className = '',
  error,
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="form-field-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`form-input ${className}`}
        {...props}
      />
      {error && (
        <span 
          className="meta-style" 
          style={{ color: 'var(--color-danger)', marginTop: '4px', display: 'block' }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
