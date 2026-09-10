import { Icon } from "../../components/ui";

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  toggleSidebar,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  handleLogout,
  productsCount = 0,
  quotesCount = 0
}) {
  return (
    <div className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
      <div className="admin-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <Icon name="shield" size={18} color="var(--gold)" />
          {!isSidebarCollapsed && <span style={{ whiteSpace: 'nowrap' }}>Admin Portal</span>}
        </div>
        <button 
          className="sidebar-toggle-btn desktop-only" 
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            borderRadius: '4px',
            marginLeft: isSidebarCollapsed ? '0' : 'auto'
          }}
        >
          <Icon name={isSidebarCollapsed ? "chevronRight" : "chevronLeft"} size={14} />
        </button>
      </div>
      
      <nav className="admin-nav" aria-label="Admin Navigation">
        <div className="admin-nav-group">
          {!isSidebarCollapsed && (
            <span className="admin-nav-group-title" style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', padding: '0 12px' }}>
              Overview
            </span>
          )}
          <div className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setIsMobileSidebarOpen(false); }} title="Dashboard">
            <Icon name="home" size={16} /> 
            {!isSidebarCollapsed && <span>Dashboard</span>}
          </div>
          <div className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => { setActiveTab('products'); setIsMobileSidebarOpen(false); }} title={`Products (${productsCount})`}>
            <Icon name="box" size={16} /> 
            {!isSidebarCollapsed && <span>Products</span>}
            {!isSidebarCollapsed && productsCount > 0 && (
              <span className="nav-badge" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>
                {productsCount}
              </span>
            )}
          </div>
        </div>

        <div className="admin-nav-group" style={{ marginTop: '16px' }}>
          {!isSidebarCollapsed && (
            <span className="admin-nav-group-title" style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', padding: '0 12px' }}>
              Public Site
            </span>
          )}
          <div className={`admin-nav-item ${activeTab === 'displayManager' ? 'active' : ''}`} onClick={() => { setActiveTab('displayManager'); setIsMobileSidebarOpen(false); }} title="Webpage Displays">
            <Icon name="eye" size={16} /> 
            {!isSidebarCollapsed && <span>Webpage Displays</span>}
          </div>
          <div className={`admin-nav-item ${activeTab === 'quotes' ? 'active' : ''}`} onClick={() => { setActiveTab('quotes'); setIsMobileSidebarOpen(false); }} title={`Quotes (${quotesCount})`}>
            <Icon name="messageSquare" size={16} /> 
            {!isSidebarCollapsed && <span>Quotes</span>}
            {!isSidebarCollapsed && quotesCount > 0 && (
              <span className="nav-badge gold" style={{ marginLeft: 'auto', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold-light)', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>
                {quotesCount}
              </span>
            )}
          </div>
        </div>

        <div className="admin-nav-group" style={{ marginTop: '16px' }}>
          {!isSidebarCollapsed && (
            <span className="admin-nav-group-title" style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', padding: '0 12px' }}>
              Configuration
            </span>
          )}
          <div className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); setIsMobileSidebarOpen(false); }} title="Settings">
            <Icon name="settings" size={16} /> 
            {!isSidebarCollapsed && <span>Settings</span>}
          </div>
        </div>
      </nav>

      <div style={{ marginTop: 'auto', padding: '0 8px' }}>
        <button 
          className="btn-detail-outline" 
          onClick={handleLogout} 
          style={{ 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px', 
            border: '1px solid rgba(255,255,255,0.1)', 
            color: 'rgba(255,255,255,0.7)',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'transparent',
            cursor: 'pointer'
          }}
          title="Logout"
        >
          <Icon name="logOut" size={14} /> 
          {!isSidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
