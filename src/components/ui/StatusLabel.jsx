
export default function StatusLabel({ text, type, className = '' }) {
  // Determine color theme based on explicit type or matching words in the text.
  let statusType = type;

  if (!statusType && text) {
    const normalized = text.toLowerCase().trim();
    if (
      normalized.includes('in stock') ||
      normalized === 'approved' ||
      normalized === 'responded' ||
      normalized === 'success' ||
      normalized === 'active'
    ) {
      statusType = 'success';
    } else if (
      normalized.includes('low stock') ||
      normalized === 'pending' ||
      normalized === 'warning'
    ) {
      statusType = 'warning';
    } else if (
      normalized.includes('out of stock') ||
      normalized === 'urgent' ||
      normalized === 'danger' ||
      normalized === 'error' ||
      normalized === 'closed'
    ) {
      statusType = 'danger';
    } else if (
      normalized === 'featured' ||
      normalized === 'promoted' ||
      normalized === 'gold'
    ) {
      statusType = 'featured';
    } else {
      statusType = 'success'; // default fallback
    }
  }

  // Fallback to success if still undefined
  statusType = statusType || 'success';

  return (
    <span className={`status-label status-${statusType} ${className}`}>
      {text}
    </span>
  );
}
