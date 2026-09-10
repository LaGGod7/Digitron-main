import { useMemo } from "react";
import { useQuery } from '@tanstack/react-query';
import { fetchPopularProducts } from '../../services/api';
import { DigitronLoader, Icon } from "../../components/ui";
import AdminActivityTab from "./AdminActivityTab";

export default function AdminDashboardTab({
  allProducts = [],
  loadingProducts,
  categories = [],
  allQuotes = [],
  loadingQuotes,
  activityLogs = [],
  setActiveTab,
  setProductsTabInitialShowForm,
  handleExportCSV
}) {
  // Fetch popular products only when dashboard is active (handled by parent mounting/rendering)
  const { data: popularProducts = [], isLoading: loadingPopular } = useQuery({
    queryKey: ['admin-popular-products'],
    queryFn: fetchPopularProducts,
    staleTime: 30 * 1000
  });

  const stats = useMemo(() => {
    return {
      total: allProducts.length,
      lowStock: allProducts.filter(p => p.stockQty < 5 || p.stock === 'Out of Stock').length,
      recentQuotes: allQuotes.slice(0, 5),
      quoteCount: allQuotes.length
    };
  }, [allProducts, allQuotes]);

  return (
    <section aria-label="Dashboard Overview">
      <div style={{ marginBottom: '32px' }}>
        <h2 className="admin-page-title" style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Overview Dashboard</h2>
        <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '13px', fontFamily: 'Outfit, sans-serif' }}>
          Real-time catalog metrics, inventory status, user quote logs, and system operations.
        </p>
      </div>

      {/* Enhanced Stat Cards */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: '24px', marginBottom: '32px' }}>
        {loadingProducts ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-stat">
              <div className="skeleton-cell sk-label" />
              <div className="skeleton-cell sk-value" />
              <div className="skeleton-cell sk-sub" />
            </div>
          ))
        ) : (
          <>
            <div className="stat-card-v2">
              <div className="stat-icon gold"><Icon name="box" size={24} /></div>
              <div className="stat-body">
                <div className="stat-label">Total Products</div>
                <div className="stat-value">{stats.total}</div>
                <div className="stat-sub">{allProducts.filter(p => p.is_visible).length} live in catalog</div>
              </div>
            </div>
            <div className="stat-card-v2 accent-red">
              <div className="stat-icon red"><Icon name="alertTriangle" size={24} /></div>
              <div className="stat-body">
                <div className="stat-label">Stock Alerts</div>
                <div className="stat-value">{stats.lowStock}</div>
                <div className="stat-sub">items need attention</div>
              </div>
            </div>
            <div className="stat-card-v2 accent-amber">
              <div className="stat-icon amber"><Icon name="messageSquare" size={24} /></div>
              <div className="stat-body">
                <div className="stat-label">Quote Requests</div>
                <div className="stat-value">{stats.quoteCount}</div>
                <div className="stat-sub">total received</div>
              </div>
            </div>
            <div className="stat-card-v2 accent-green">
              <div className="stat-icon green"><Icon name="grid" size={24} /></div>
              <div className="stat-body">
                <div className="stat-label">Categories</div>
                <div className="stat-value">{categories.length || '—'}</div>
                <div className="stat-sub">product groups</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="admin-dashboard-row">
        {/* Recent Quotes */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Recent Quote Requests</h3>
            <button className="btn-link" onClick={() => setActiveTab('quotes')} style={{ color: 'var(--gold)', fontSize: '12px' }}>View All →</button>
          </div>
          {loadingQuotes ? (
            [1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', gap: '12px', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="skeleton-cell" style={{ height: '12px', width: '35%' }} />
                <div className="skeleton-cell" style={{ height: '12px', width: '25%' }} />
                <div className="skeleton-cell" style={{ height: '12px', width: '20%' }} />
              </div>
            ))
          ) : stats.recentQuotes.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-state-icon"><Icon name="inbox" size={24} /></div>
              <div className="empty-state-title" style={{ fontSize: '14px' }}>No quotes yet</div>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Customer</th><th>Phone</th><th>Date</th></tr></thead>
                <tbody>
                  {stats.recentQuotes.map(q => (
                    <tr key={q.id} onClick={() => setActiveTab('quotes')} style={{ cursor: 'pointer' }}>
                      <td>{q.customerName}</td>
                      <td>{q.customerPhone}</td>
                      <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Category Progress Bars */}
        <div className="admin-card">
          <h3 className="admin-card-title">Category Breakdown</h3>
          <div className="cat-bar-wrap">
            {['Cameras', 'Storage', 'Accessories', 'Networking', 'DVR', 'NVR', 'Services'].map(cat => {
              const count = allProducts.filter(p => p.category === cat).length;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              if (count === 0) return null;
              return (
                <div key={cat} className="cat-bar-row">
                  <div className="cat-bar-header">
                    <span className="cat-bar-label">{cat}</span>
                    <span className="cat-bar-count">{count} items · {pct}%</span>
                  </div>
                  <div className="cat-bar-track">
                    <div className="cat-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Quick Actions & Activity Log */}
      <div className="admin-dashboard-row" style={{ marginTop: '24px' }}>
        <div className="admin-card" style={{ margin: 0 }}>
          <h3 className="admin-card-title">Quick Actions</h3>
          <div className="quick-action-grid">
            <button className="quick-action-btn" onClick={() => { setActiveTab('products'); setProductsTabInitialShowForm(true); }}>
              <span className="qa-icon"><Icon name="plus" size={16} color="var(--gold)" /></span>
              Add New Product
            </button>
            <button className="quick-action-btn" onClick={() => setActiveTab('products')}>
              <span className="qa-icon"><Icon name="box" size={16} color="var(--gold)" /></span>
              View All Products
            </button>
            <button className="quick-action-btn" onClick={() => setActiveTab('quotes')}>
              <span className="qa-icon"><Icon name="messageSquare" size={16} color="var(--gold)" /></span>
              Manage Quotes
            </button>
            <button className="quick-action-btn" onClick={() => setActiveTab('settings')}>
              <span className="qa-icon"><Icon name="settings" size={16} color="var(--gold)" /></span>
              Site Settings
            </button>
            <button className="quick-action-btn" onClick={handleExportCSV}>
              <span className="qa-icon"><Icon name="download" size={16} color="var(--gold)" /></span>
              Export CSV
            </button>
            <button className="quick-action-btn" onClick={() => setActiveTab('displayManager')}>
              <span className="qa-icon"><Icon name="eye" size={16} color="var(--gold)" /></span>
              Webpage Display
            </button>
          </div>
        </div>

        <AdminActivityTab activityLogs={activityLogs} limit={5} />
      </div>

      <div className="admin-card" style={{ marginTop: '24px' }}>
        <h3 className="admin-card-title">Most Visited &amp; Commonly Searched Products</h3>
        {loadingPopular ? (
          <DigitronLoader label="loading trends" compact />
        ) : popularProducts.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <div className="empty-state-icon"><Icon name="zap" size={24} /></div>
            <div className="empty-state-title" style={{ fontSize: '14px' }}>No visits recorded yet</div>
            <div className="empty-state-sub">Popular products will appear here once users browse the site.</div>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Rank</th>
                  <th>Product Name</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Total Visits / Searches</th>
                </tr>
              </thead>
              <tbody>
                {popularProducts.map((p, idx) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--gold)', fontWeight: 'bold' }}>#{idx + 1}</td>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td><span className="brand-badge">{p.brand}</span></td>
                    <td>{p.category}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--gold)' }}>{p.visits || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
