import { useState, useEffect } from "react";
import { DigitronLoader, Icon } from "../components/ui";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, fetchQuotes, loginAdmin, fetchCategories, fetchAdminMe, logoutAdmin } from '../services/api';
import siteConfig from "../data/siteConfig";

import AdminSidebar from "./admin/AdminSidebar";
import AdminDashboardTab from "./admin/AdminDashboardTab";
import AdminProductsTab from "./admin/AdminProductsTab";
import AdminDisplayManagerTab from "./admin/AdminDisplayManagerTab";
import AdminQuotesTab from "./admin/AdminQuotesTab";
import AdminSettingsTab from "./admin/AdminSettingsTab";

export default function AdminPage({ showToast }) {
  const queryClient = useQueryClient();

  const { data: adminUser, isLoading: isLoadingAuth } = useQuery({
    queryKey: ['admin-me'],
    queryFn: fetchAdminMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const isAuthenticated = !!adminUser;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    document.title = "Admin Dashboard | Digitron Associates";
  }, []);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem("ae_admin_sidebar_collapsed") === "true");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [productsTabInitialShowForm, setProductsTabInitialShowForm] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("ae_admin_sidebar_collapsed", next ? "true" : "false");
      return next;
    });
  };

  // Activity log state and persist logic
  const [activityLogs, setActivityLogs] = useState(() => {
    const saved = localStorage.getItem("ae_admin_activity_logs");
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, type: "settings", action: "System configuration initialized", time: new Date(Date.now() - 3600000 * 2).toISOString() },
      { id: 2, type: "create", action: "Added product '2MP Dome Camera'", time: new Date(Date.now() - 3600000 * 5).toISOString() },
      { id: 3, type: "update", action: "Updated stock status on '32 Channel NVR'", time: new Date(Date.now() - 3600000 * 24).toISOString() },
    ];
  });

  const addLog = (type, action) => {
    setActivityLogs(prev => {
      const updated = [{ id: Date.now(), type, action, time: new Date().toISOString() }, ...prev].slice(0, 50);
      localStorage.setItem("ae_admin_activity_logs", JSON.stringify(updated));
      return updated;
    });
  };

  const loginMutation = useMutation({
    mutationFn: ({ username, password }) => loginAdmin(username, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-me'] });
      showToast("Logged in successfully");
      setUsername("");
      setPassword("");
    },
    onError: (err) => {
      showToast(err.message || "Invalid credentials");
    }
  });

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      queryClient.setQueryData(['admin-me'], null);
      queryClient.clear();
      showToast("Logged out");
    } catch {
      showToast("Logged out");
    }
  };

  const { data: allProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => fetchProducts(null, null, true),
    enabled: isAuthenticated
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    enabled: isAuthenticated
  });

  const { data: allQuotes = [], isLoading: loadingQuotes } = useQuery({
    queryKey: ['admin-quotes'],
    queryFn: fetchQuotes,
    enabled: isAuthenticated && (activeTab === 'quotes' || activeTab === 'dashboard')
  });

  const handleExportCSV = () => {
    if (allProducts.length === 0) {
      showToast("No products to export");
      return;
    }
    const headers = ["ID", "Name", "Brand", "Category", "Price", "Stock Status", "Stock Quantity", "Visible in Catalog"];
    const rows = allProducts.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.brand.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      p.price,
      `"${p.stock.replace(/"/g, '""')}"`,
      p.stockQty || 0,
      p.is_visible ? "Yes" : "No"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `digitron_products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Product inventory exported as CSV successfully!");
  };

  if (isLoadingAuth) {
    return <DigitronLoader label="Verifying admin credentials..." fullPage />;
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <div className="admin-login-logo">
            <div className="admin-login-icon-wrap">
              <Icon name="shield" size={28} color="#fff" />
            </div>
            <div className="admin-login-badge">
              <Icon name="zap" size={10} /> Secure Admin Access
            </div>
            <h1 className="admin-login-title">Admin Portal</h1>
            <div className="admin-login-sub">{siteConfig.storeName}</div>
          </div>
          <form className="admin-login-form" onSubmit={handleLogin}>
            <div className="admin-input-group">
              <span className="admin-input-label">Username</span>
              <div style={{ position: 'relative' }}>
                <span className="input-icon"><Icon name="user" size={16} /></span>
                <input 
                  type="text" 
                  className="admin-input" 
                  placeholder="Enter username" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="admin-input-group">
              <span className="admin-input-label">Password</span>
              <div style={{ position: 'relative' }}>
                <span className="input-icon"><Icon name="shield" size={16} /></span>
                <input 
                  type="password" 
                  className="admin-input" 
                  placeholder="Enter password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  autoComplete="current-password"
                />
              </div>
            </div>
            <button type="submit" className="btn-admin-login">Sign In</button>
          </form>
          <div className="admin-login-hint">
            Protected by JWT authentication
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isMobileSidebarOpen ? 'mobile-sidebar-open' : ''}`}>
      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        handleLogout={handleLogout}
        productsCount={allProducts.length}
        quotesCount={allQuotes.length}
      />

      {/* Main Container */}
      <div className="admin-main-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Top Header */}
        <header className="admin-header" style={{ height: '64px', background: 'var(--obsidian)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              className="mobile-menu-toggle mobile-only" 
              onClick={() => setIsMobileSidebarOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                display: 'none', // Set display to block in media queries
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: '6px'
              }}
            >
              <Icon name="menu" size={20} />
            </button>
            
            <div className="admin-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Outfit, sans-serif' }}>
              <span className="breadcrumb-root">Admin</span>
              <Icon name="chevronRight" size={10} className="breadcrumb-separator" style={{ opacity: 0.3 }} />
              <span className="breadcrumb-current" style={{ color: 'var(--white)', fontWeight: 500 }}>
                {activeTab === 'dashboard' ? 'Overview' :
                 activeTab === 'products' ? 'Products' :
                 activeTab === 'displayManager' ? 'Webpage Displays' :
                 activeTab === 'quotes' ? 'Quotes' :
                 activeTab === 'settings' ? 'Settings' : activeTab}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="admin-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--gold)', background: 'rgba(212,175,55,0.06)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.15)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span className="pulse-indicator" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold)' }}></span>
              Live Database Mode
            </div>
            
            <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.1)' }}></div>
            
            <div className="admin-user-profile" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="user" size={13} color="var(--gold-light)" />
              </div>
              <span className="name desktop-only" style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', fontFamily: 'Outfit, sans-serif' }}>Administrator</span>
            </div>
          </div>
        </header>

        {/* Content Pane */}
        <main className="admin-content-pane" aria-label="Admin Dashboard Main Content" style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {activeTab === 'dashboard' && (
            <AdminDashboardTab
              allProducts={allProducts}
              loadingProducts={loadingProducts}
              categories={categories}
              allQuotes={allQuotes}
              loadingQuotes={loadingQuotes}
              activityLogs={activityLogs}
              setActiveTab={setActiveTab}
              setProductsTabInitialShowForm={setProductsTabInitialShowForm}
              handleExportCSV={handleExportCSV}
            />
          )}

          {activeTab === 'products' && (
            <AdminProductsTab
              allProducts={allProducts}
              loadingProducts={loadingProducts}
              categories={categories}
              showToast={showToast}
              addLog={addLog}
              initialShowForm={productsTabInitialShowForm}
              onResetInitialShowForm={() => setProductsTabInitialShowForm(false)}
            />
          )}

          {activeTab === 'displayManager' && (
            <AdminDisplayManagerTab
              allProducts={allProducts}
              categories={categories}
              showToast={showToast}
              addLog={addLog}
            />
          )}

          {activeTab === 'quotes' && (
            <AdminQuotesTab
              allQuotes={allQuotes}
              loadingQuotes={loadingQuotes}
              allProducts={allProducts}
              showToast={showToast}
              addLog={addLog}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettingsTab
              showToast={showToast}
              addLog={addLog}
            />
          )}

          {/* Under development modules block */}
          {activeTab !== 'products' && activeTab !== 'displayManager' && activeTab !== 'quotes' && activeTab !== 'dashboard' && activeTab !== 'settings' && (
            <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--mid-gray)' }}>
              <Icon name={activeTab === 'dashboard' ? 'home' : 'settings'} size={48} color="var(--light-gray)" />
              <h3 style={{ marginTop: '16px', color: 'var(--dark-gray)' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module</h3>
              <p style={{ maxWidth: '400px', margin: '8px auto', fontSize: '14px' }}>
                This section is under development.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
