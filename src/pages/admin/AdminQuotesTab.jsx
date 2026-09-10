import { useState } from "react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateQuoteStatus } from '../../services/api';
import { DigitronLoader, Icon, Card, Button, StatusLabel, Select } from "../../components/ui";

export default function AdminQuotesTab({
  allQuotes = [],
  loadingQuotes,
  allProducts = [],
  showToast,
  addLog
}) {
  const queryClient = useQueryClient();
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);

  const updateQuoteMutation = useMutation({
    mutationFn: ({ id, status }) => updateQuoteStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-quotes'] });
      const previousQuotes = queryClient.getQueryData(['admin-quotes']);
      queryClient.setQueryData(['admin-quotes'], (old = []) =>
        old.map(q => q.id === id ? { ...q, status } : q)
      );
      return { previousQuotes };
    },
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
      showToast("Quote status updated!");
      addLog("update", `Quote for ID ${variables.id} status set to ${variables.status}`);
    },
    onError: (_error, _variables, context) => {
      if (context?.previousQuotes) queryClient.setQueryData(['admin-quotes'], context.previousQuotes);
      showToast("Error updating quote status");
    }
  });

  if (loadingQuotes) {
    return <DigitronLoader label="loading quotes" compact />;
  }

  if (allQuotes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <Icon name="messageSquare" size={32} color="var(--gold)" />
        </div>
        <h3 className="empty-state-title">No Inquiries Yet</h3>
        <p className="empty-state-sub">
          Quote requests submitted by customers through the catalog page will automatically appear here.
        </p>
      </div>
    );
  }

  const selectedQuote = allQuotes.find(q => q.id === selectedQuoteId) || allQuotes[0];
  const selectedItems = Array.isArray(selectedQuote?.items) ? selectedQuote.items : [];
  const customerMessages = selectedItems
    .map(item => item.message || item.requirements || item.notes)
    .filter(Boolean);
  const customerEmail = selectedItems.find(item => item.customerEmail)?.customerEmail;

  return (
    <section aria-label="Quotes Management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="admin-page-title" style={{ margin: 0 }}>Quote Requests</h2>
          <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
            Manage customer inquiries, view item details, and track follow-ups.
          </p>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '380px 1fr', 
        gap: '24px', 
        height: 'calc(100vh - 180px)', 
        minHeight: '550px' 
      }}>
        {/* Left Column: Inbox List */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.02)', 
          borderRadius: '12px', 
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Search / Header */}
          <div style={{ 
            padding: '16px', 
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(255, 255, 255, 0.01)'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.4)', marginBottom: '8px' }}>
              INBOX ({allQuotes.length})
            </div>
          </div>

          {/* Scrollable list */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '8px'
          }}>
            {allQuotes.map(q => {
              const isSelected = selectedQuote && selectedQuote.id === q.id;
              const itemsCount = Array.isArray(q.items) ? q.items.length : 0;
              const itemsSummary = Array.isArray(q.items) 
                ? q.items.map(i => i.name).join(', ') 
                : 'Items requested';
              const cleanDate = new Date(q.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short'
              });

              let statusType = "info";
              if (q.status === "Pending") statusType = "warning";
              else if (q.status === "Completed") statusType = "success";
              else if (q.status === "Cancelled") statusType = "danger";

              return (
                <Card 
                  key={q.id}
                  interactive
                  onClick={() => setSelectedQuoteId(q.id)}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--color-surface)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? '1px solid var(--color-gold)' : '1px solid var(--color-border)',
                    boxShadow: isSelected ? '0 0 10px rgba(202, 138, 4, 0.15)' : 'none',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: isSelected ? 'var(--color-gold)' : 'var(--color-white)', fontSize: '14px' }}>
                      {q.customerName}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-ink-soft)' }}>
                      {cleanDate}
                    </span>
                  </div>

                  <div style={{ 
                    fontSize: '12px', 
                    color: 'var(--color-ink-soft)', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    marginBottom: '10px'
                  }}>
                    {itemsSummary}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-ink-soft)', fontWeight: 500 }}>
                      {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                    </span>
                    <StatusLabel text={q.status || 'Pending'} type={statusType} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Pane */}
        {selectedQuote ? (
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.02)', 
            borderRadius: '12px', 
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Pane Header */}
            <div style={{ 
              padding: '24px', 
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              background: 'rgba(255, 255, 255, 0.01)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--white)' }}>
                  {selectedQuote.customerName}
                </h3>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.35)', marginTop: '4px' }}>
                  Reference ID: <span style={{ fontFamily: 'monospace' }}>{selectedQuote.id}</span>
                </div>
              </div>

              {/* Status Select dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>STATUS:</span>
                <Select
                  value={selectedQuote.status || 'Pending'}
                  onChange={(e) => updateQuoteMutation.mutate({ id: selectedQuote.id, status: e.target.value })}
                  disabled={updateQuoteMutation.isPending}
                  style={{ width: '150px', height: '36px', fontSize: '13px' }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Processed">Processed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </Select>
              </div>
            </div>

            {/* Scrollable details */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {/* Meta grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px',
                marginBottom: '28px'
              }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', marginBottom: '4px' }}>CONTACT PHONE</div>
                  <a href={`tel:${selectedQuote.customerPhone}`} style={{ color: 'var(--gold-light)', textDecoration: 'none', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="phone" size={12} /> {selectedQuote.customerPhone}
                  </a>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', marginBottom: '4px' }}>SUBMISSION DATE</div>
                  <div style={{ color: 'var(--white)', fontWeight: 500, fontSize: '13.5px' }}>
                    {new Date(selectedQuote.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                {customerEmail && (
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', marginBottom: '4px' }}>CUSTOMER EMAIL</div>
                    <a href={`mailto:${customerEmail}`} style={{ color: 'var(--gold-light)', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
                      {customerEmail}
                    </a>
                  </div>
                )}
              </div>

              {/* Items detail list */}
              <h4 style={{ color: 'var(--white)', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Requested Products & Estimation</h4>
              <div className="admin-table-wrap" style={{ border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
                <table className="admin-table" style={{ margin: 0 }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <th>Product Item</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Est. Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Est. Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let totalEstVal = 0;
                      return (
                        <>
                          {selectedItems.map((item, idx) => {
                            // Lookup unit price in db
                            const matchedProd = allProducts.find(p => p.name.toLowerCase() === item.name.toLowerCase());
                            const price = matchedProd ? matchedProd.price : 0;
                            const qty = item.qty || 1;
                            const sub = price * qty;
                            totalEstVal += sub;

                            return (
                              <tr key={idx}>
                                <td style={{ fontWeight: 500, color: 'var(--white)' }}>
                                  {item.name}
                                  {(item.message || item.requirements || item.notes) && (
                                    <span style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginTop: '4px', lineHeight: 1.45 }}>
                                      Wrote: {item.message || item.requirements || item.notes}
                                    </span>
                                  )}
                                  {matchedProd && (
                                    <span style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                                      Brand: {matchedProd.brand} | Cat: {matchedProd.category}
                                    </span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                                  {qty}
                                </td>
                                <td style={{ textAlign: 'right', color: 'rgba(255,255,255,0.6)' }}>
                                  {price > 0 ? `₹${price.toLocaleString('en-IN')}` : 'Ask for quote'}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 600, color: sub > 0 ? 'var(--gold-light)' : 'rgba(255,255,255,0.4)' }}>
                                  {sub > 0 ? `₹${sub.toLocaleString('en-IN')}` : '—'}
                                </td>
                              </tr>
                            );
                          })}
                          {totalEstVal > 0 && (
                            <tr style={{ background: 'rgba(212,175,55,0.03)' }}>
                              <td colSpan={3} style={{ fontWeight: 600, color: 'var(--white)', textAlign: 'right' }}>Estimated Total Valuation:</td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--gold-light)', fontSize: '15px' }}>
                                ₹{totalEstVal.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {customerMessages.length > 0 && (
                <div style={{ 
                  background: 'rgba(212,175,55,0.05)', 
                  border: '1px solid rgba(212,175,55,0.14)', 
                  borderRadius: '8px', 
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    CUSTOMER REQUIREMENTS
                  </div>
                  {customerMessages.map((message, idx) => (
                    <p key={idx} style={{ margin: idx === 0 ? 0 : '10px 0 0 0', color: 'rgba(255,255,255,0.82)', fontSize: '13.5px', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                      {message}
                    </p>
                  ))}
                </div>
              )}
              {/* Customer Quick Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button 
                  href={`https://wa.me/91${selectedQuote.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hello ${selectedQuote.customerName},\n\nThis is Digitron Associates. We have received your quote request for the products:\n` +
                    selectedItems.map(i => `- ${i.name} (Qty: ${i.qty || 1})`).join('\n') +
                    (customerMessages.length ? `\n\nYour note:\n${customerMessages.join('\n\n')}` : '') +
                    `\n\nOur representative will get in touch with you shortly. Thank you!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: '#25d366',
                    borderColor: '#25d366',
                    color: '#fff'
                  }}
                >
                  <Icon name="messageSquare" size={14} color="white" /> Contact via WhatsApp
                </Button>

                <Button 
                  href={`tel:${selectedQuote.customerPhone}`}
                  variant="secondary"
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    color: 'var(--white)'
                  }}
                >
                  <Icon name="phone" size={14} /> Call Customer
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            color: 'rgba(255,255,255,0.3)' 
          }}>
            Select an inquiry from the list to view details.
          </div>
        )}
      </div>
    </section>
  );
}
