import { useId } from 'react';

export default function Textarea({
  label,
  id,
  className = '',
  error,
  ...props
}) {
  const generatedId = useId();
  const textareaId = id || generatedId;

  return (
    <div className="form-field-group">
      {label && (
        <label htmlFor={textareaId} className="form-label">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`form-textarea ${className}`}
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
