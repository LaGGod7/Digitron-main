
export default function Card({
  children,
  className = '',
  interactive = false,
  onClick,
  ...props
}) {
  const cardClass = `card ${interactive ? 'card-interactive' : ''} ${className}`;

  // Handle keyboard interaction for accessible cards
  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <div
      className={cardClass}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      {...(interactive && onClick ? { role: 'button', tabIndex: 0 } : {})}
      {...props}
    >
      {children}
    </div>
  );
}
