import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleProductVisibility } from '../../services/api';
import { Icon } from "../../components/ui";

export default function AdminDisplayManagerTab({
  allProducts = [],
  categories = [],
  showToast,
  addLog
}) {
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [displaySearch, setDisplaySearch] = useState("");
  const [displayFilter, setDisplayFilter] = useState("all"); // "all" | "live" | "hidden"

  const visibilityMutation = useMutation({
    mutationFn: toggleProductVisibility,
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      showToast("Visibility toggled!");
      const matched = allProducts.find(p => p.id === id);
      addLog("update", `Toggled visibility for '${matched ? matched.name : id}'`);
    },
    onError: () => showToast("Error updating visibility")
  });

  const displayFilteredProducts = useMemo(() => {
    return allProducts.filter(p => {
      // Category filter
      if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
      
      // Search filter
      if (displaySearch) {
        const term = displaySearch.toLowerCase();
        if (!p.name.toLowerCase().includes(term) && !p.brand.toLowerCase().includes(term)) return false;
      }
      
      // Display filter
      if (displayFilter === "live") return p.is_visible;
      if (displayFilter === "hidden") return !p.is_visible;
      
      return true;
    });
  }, [allProducts, selectedCategory, displaySearch, displayFilter]);

  return (
    <section aria-label="Webpage Display Management">
      {/* Header section with top-tier premium appearance */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--obsidian) 0%, #1a1a1a 100%)', 
        padding: '28px 32px', 
        borderRadius: 'var(--radius-lg)', 
        color: 'var(--white)', 
        marginBottom: '32px', 
        border: '1px solid rgba(255,255,255,0.05)', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: '-40px', bottom: '-40px', opacity: 0.05, pointerEvents: 'none' }}>
          <Icon name="eye" size={200} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ background: 'rgba(212,175,55,0.15)', padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="eye" size={22} color="var(--gold)" />
          </div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif' }}>Webpage Display Manager</h2>
        </div>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '13.5px', lineHeight: 1.6, maxWidth: '750px' }}>
          Control which products are displayed on your public catalog website. Toggling products back to the webpage automatically puts them in their correct genre (e.g. Cameras, Storage, Accessories) like a perfect fit!
        </p>
      </div>

      {/* Controls panel: Genre filters, display status tabs, and search */}
      <div className="admin-controls-panel">
        {/* Row 1: Search and Status Filters */}
        <div className="admin-status-tabs">
          <button
            onClick={() => setDisplayFilter('all')}
            className={`admin-status-tab-btn ${displayFilter === 'all' ? 'active' : ''}`}
          >
            All Products ({allProducts.length})
          </button>
          <button
            onClick={() => setDisplayFilter('live')}
            className={`admin-status-tab-btn ${displayFilter === 'live' ? 'active' : ''}`}
          >
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span>
            Live on Page ({allProducts.filter(p => p.is_visible).length})
          </button>
          <button
            onClick={() => setDisplayFilter('hidden')}
            className={`admin-status-tab-btn ${displayFilter === 'hidden' ? 'active' : ''}`}
          >
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--mid-gray)' }}></span>
            Backend Archive ({allProducts.filter(p => !p.is_visible).length})
          </button>
        </div>

        {/* Search field */}
        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="Search name or brand..."
            value={displaySearch}
            onChange={(e) => setDisplaySearch(e.target.value)}
            className="form-input"
            style={{ width: '100%', padding: '8px 12px 8px 36px', fontSize: '13px' }}
          />
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mid-gray)' }}>
            <Icon name="search" size={14} />
          </div>
        </div>
      </div>

      {/* Row 2: Genre/Category filter pills */}
      <div style={{ marginBottom: '24px' }}>
        <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mid-gray)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Filter by Genre (Category)
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => setSelectedCategory('All')}
            className={`admin-pill-btn ${selectedCategory === 'All' ? 'active' : ''}`}
          >
            All Genres
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`admin-pill-btn ${selectedCategory === cat.name ? 'active' : ''}`}
            >
              {cat.name} ({allProducts.filter(p => p.category === cat.name).length})
            </button>
          ))}
        </div>
      </div>

      {/* Products grid display */}
      {displayFilteredProducts.length === 0 ? (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '60px 20px',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed rgba(255, 255, 255, 0.08)',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.45)'
        }}>
          <Icon name="search" size={48} color="rgba(255, 255, 255, 0.2)" style={{ marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--white)', fontFamily: 'Outfit, sans-serif' }}>No Products Found</h3>
          <p style={{ margin: 0, fontSize: '13.5px' }}>
            No products matched your search or filter settings in this genre.
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '24px' 
        }}>
          {displayFilteredProducts.map(p => {
            const isLive = p.is_visible;
            return (
              <div 
                key={p.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-lg)',
                  border: isLive ? '1.5px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isLive ? '0 0 20px rgba(34, 197, 94, 0.05)' : 'none',
                  opacity: isLive ? 1 : 0.75,
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Genre top banner ribbon decoration */}
                {isLive && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '4px',
                    background: 'linear-gradient(90deg, #22c55e, #4ade80)'
                  }}></div>
                )}
                
                <div>
                  {/* Status badge and Category label */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      fontSize: '11px', 
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: isLive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      color: isLive ? '#4ade80' : 'rgba(255, 255, 255, 0.45)'
                    }}>
                      <span style={{ 
                        display: 'inline-block', 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: isLive ? '#22c55e' : 'rgba(255, 255, 255, 0.3)',
                        boxShadow: isLive ? '0 0 6px #22c55e' : 'none'
                      }}></span>
                      {isLive ? 'LIVE' : 'HIDDEN ARCHIVE'}
                    </span>
                    
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--gold-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {p.category}
                    </span>
                  </div>

                  {/* Product Title and Brand */}
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: 'var(--white)', lineHeight: 1.4 }}>
                    {p.name}
                  </h4>
                  <span className="brand-badge" style={{ marginBottom: '16px', display: 'inline-block' }}>
                    {p.brand}
                  </span>

                  {/* Description & Target Genre status */}
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'rgba(255, 255, 255, 0.45)', 
                    marginBottom: '18px',
                    background: 'rgba(255, 255, 255, 0.01)',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '0.5px dashed rgba(255, 255, 255, 0.1)'
                  }}>
                    {isLive ? (
                      <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name="check" size={12} /> Live in public {p.category} catalog.
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(255, 255, 255, 0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name="plus" size={12} /> Click Publish to place back in {p.category}!
                      </span>
                    )}
                  </div>
                </div>

                {/* Price and Action Button */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginTop: '8px', 
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600, letterSpacing: '0.05em' }}>PRICE</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gold-light)' }}>
                      {p.price > 0 ? `₹${p.price.toLocaleString('en-IN')}` : 'Quote Request'}
                    </div>
                  </div>

                  <button 
                    onClick={() => visibilityMutation.mutate(p.id)}
                    disabled={visibilityMutation.isPending}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: isLive ? '1px solid rgba(255, 107, 107, 0.3)' : '1px solid var(--gold)',
                      background: isLive ? 'rgba(255, 107, 107, 0.05)' : 'var(--gold-tint)',
                      color: isLive ? '#ff6b6b' : 'var(--gold-light)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {visibilityMutation.isPending ? (
                      <Icon name="loader" size={12} className="spin" />
                    ) : (
                      <Icon name={isLive ? "eyeOff" : "eye"} size={12} />
                    )}
                    {isLive ? 'Move to Archive' : 'Publish to Page'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
