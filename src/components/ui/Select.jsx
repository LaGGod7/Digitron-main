import { useId } from 'react';

export default function Select({
  label,
  id,
  children,
  className = '',
  error,
  ...props
}) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className="form-field-group">
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`form-select ${className}`}
        {...props}
      >
        {children}
      </select>
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
