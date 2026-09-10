
export default function Chip({
  label,
  selected = false,
  onClick,
  className = '',
  ...props
}) {
  const chipClass = `chip ${selected ? 'chip-selected' : 'chip-unselected'} ${className}`;

  return (
    <button
      type="button"
      className={chipClass}
      onClick={onClick}
      aria-pressed={selected}
      {...props}
    >
      {label}
    </button>
  );
}
