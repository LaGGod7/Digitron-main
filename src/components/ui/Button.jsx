import { Link } from 'react-router-dom';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'destructive'
  className = '',
  disabled = false,
  type = 'button',
  to,
  href,
  ...props
}) {
  const baseClass = `btn btn-${variant} button-active-transition ${className}`;

  if (to && !disabled) {
    return (
      <Link to={to} className={baseClass} {...props}>
        {children}
      </Link>
    );
  }

  if (href && !disabled) {
    return (
      <a href={href} className={baseClass} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={baseClass}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
