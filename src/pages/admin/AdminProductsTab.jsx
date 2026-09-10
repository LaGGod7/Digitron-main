import { useState, useMemo, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProduct, addProduct, deleteProduct, toggleProductVisibility } from '../../services/api';
import { Icon, ConfirmDialog, Button } from "../../components/ui";

export default function AdminProductsTab({
  allProducts = [],
  loadingProducts,
  categories = [],
  showToast,
  addLog,
  initialShowForm,
  onResetInitialShowForm
}) {
  const queryClient = useQueryClient();

  const editModalTriggerRef = useRef(null);
  const editModalFirstInputRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Product Table sorting and pagination states
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStock, setFilterStock] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All"); // "All" | "Live" | "Hidden"

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Confirm dialog state config
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Add Product form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", brand: "", category: "Cameras", price: "", stock: "In Stock", images: [], description: "" });

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [cleanProduct, setCleanProduct] = useState(null); // Reference to check for unsaved edits

  useEffect(() => {
    if (editingProduct) {
      editModalTriggerRef.current = document.activeElement;
      const timer = setTimeout(() => {
        if (editModalFirstInputRef.current) {
          editModalFirstInputRef.current.focus();
        }
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          setEditingProduct(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", handleKeyDown);
        if (editModalTriggerRef.current) {
          editModalTriggerRef.current.focus();
        }
      };
    }
  }, [editingProduct]);

  // Column Visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    brand: true,
    category: true,
    stock: true,
    price: true,
    status: true
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // Handle initialShowForm transition from Quick Actions
  useEffect(() => {
    if (initialShowForm) {
      const timer = setTimeout(() => {
        setShowAddForm(true);
        if (onResetInitialShowForm) onResetInitialShowForm();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialShowForm, onResetInitialShowForm]);

  // Debounce search input (220ms)
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 220);
    return () => window.clearTimeout(t);
  }, [searchTerm]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      showToast("Product updated successfully!");
      addLog("update", `Updated product '${variables.data.name}'`);
    },
    onError: () => showToast("Error updating product. Session might be expired.")
  });

  const addMutation = useMutation({
    mutationFn: addProduct,
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      showToast("Product added successfully!");
      addLog("create", `Added product '${variables.name}'`);
    },
    onError: () => showToast("Error adding product")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      showToast("Product removed successfully!");
      const matched = allProducts.find(p => p.id === id);
      addLog("delete", `Deleted product '${matched ? matched.name : id}'`);
    },
    onError: () => showToast("Error removing product")
  });

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

  // Global keyboard shortcuts hook (defined after mutations to prevent TDZ error)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + S to save active form/modal
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (editingProduct) {
          // Trigger editingProduct save
          updateMutation.mutate({
            id: editingProduct.id,
            data: {
              name: editingProduct.name,
              brand: editingProduct.brand,
              categoryId: editingProduct.categoryId,
              price: parseFloat(editingProduct.price) || 0,
              stock: editingProduct.stock,
              stockQty: parseInt(editingProduct.stockQty) || 0,
              indoorOutdoor: editingProduct.indoorOutdoor || '',
              resolution: editingProduct.resolution || '',
              type: editingProduct.type || '',
              images: editingProduct.images || [],
              description: editingProduct.description || ""
            }
          }, {
            onSuccess: () => {
              setEditingProduct(null);
            }
          });
        } else if (showAddForm) {
          // Trigger new product save
          if (!newProduct.name || !newProduct.brand) {
            showToast("Name and brand are required");
            return;
          }
          addMutation.mutate(newProduct, {
            onSuccess: () => {
              setShowAddForm(false);
              setNewProduct({ name: "", brand: "", category: "Cameras", price: "", stock: "In Stock", images: [], description: "" });
            }
          });
        }
      }

      // '/' to focus search input
      if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "SELECT" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        const searchInput = document.getElementById("admin-product-search");
        if (searchInput) searchInput.focus();
      }
      
      // Esc to close active modals
      if (e.key === "Escape") {
        if (editingProduct) {
          // Check for unsaved changes
          const isChanged = JSON.stringify(editingProduct) !== JSON.stringify(cleanProduct);
          if (isChanged) {
            if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
              setEditingProduct(null);
            }
          } else {
            setEditingProduct(null);
          }
        } else {
          setShowColumnDropdown(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingProduct, cleanProduct, showAddForm, newProduct, updateMutation, addMutation, showToast]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const processedProducts = useMemo(() => {
    let result = allProducts.filter(p => {
      if (debouncedSearch) {
        const term = debouncedSearch.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(term);
        const matchesBrand = p.brand.toLowerCase().includes(term);
        if (!matchesName && !matchesBrand) return false;
      }
      if (filterCategory !== "All" && p.category !== filterCategory) return false;
      if (filterStock !== "All" && p.stock !== filterStock) return false;
      if (filterStatus === "Live" && !p.is_visible) return false;
      if (filterStatus === "Hidden" && p.is_visible) return false;
      return true;
    });

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      if (sortField === "price") {
        const numA = parseFloat(valA) || 0;
        const numB = parseFloat(valB) || 0;
        return sortDirection === "asc" ? numA - numB : numB - numA;
      }

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [allProducts, debouncedSearch, filterCategory, filterStock, filterStatus, sortField, sortDirection]);

  const handleExportCSV = () => {
    if (processedProducts.length === 0) {
      showToast("No products to export");
      return;
    }
    const headers = ["ID", "Name", "Brand", "Category", "Price", "Stock Status", "Stock Quantity", "Visible in Catalog"];
    const rows = processedProducts.map(p => [
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

  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);

  // Clamp page so it never exceeds totalPages when filters shrink results
  const effectivePage = Math.min(currentPage, Math.max(1, totalPages));

  const paginatedProducts = useMemo(() => {
    const startIndex = (effectivePage - 1) * itemsPerPage;
    return processedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [processedProducts, effectivePage, itemsPerPage]);

  return (
    <section aria-label="Product Inventory Management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="admin-page-title" style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Product Inventory</h2>
          <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '13px', fontFamily: 'Outfit, sans-serif' }}>
            Manage store catalog items, prices, visibility, and stock updates.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button 
            onClick={handleExportCSV} 
            variant="secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '13px', borderRadius: '8px' }}
          >
            <Icon name="download" size={14} /> Export CSV
          </Button>
          <Button 
            variant={showAddForm ? "secondary" : "primary"}
            onClick={() => setShowAddForm(!showAddForm)} 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '13.5px', borderRadius: '8px' }}
          >
            <Icon name={showAddForm ? "x" : "plus"} size={14} color={showAddForm ? "var(--color-ink)" : "white"} /> {showAddForm ? "Close Form" : "Add Product"}
          </Button>
        </div>
      </div>

      {showAddForm && (
        <div className="admin-card" style={{ marginBottom: '24px', animation: 'modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="plus" size={16} color="var(--gold)" /> Add New Product</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!newProduct.name || !newProduct.brand) {
              showToast("Name and brand are required");
              return;
            }
            addMutation.mutate(newProduct, {
              onSuccess: () => {
                setShowAddForm(false);
                setNewProduct({ name: "", brand: "", category: "Cameras", price: "", stock: "In Stock" });
              }
            });
          }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '0.02em' }}>PRODUCT NAME</label>
              <input 
                type="text" 
                placeholder="e.g. 2MP Dome Camera" 
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="admin-table-input"
                style={{ width: '100%', padding: '10px 14px', fontSize: '13px', borderRadius: '6px' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '0.02em' }}>BRAND</label>
              <input 
                type="text" 
                placeholder="e.g. CP Plus" 
                value={newProduct.brand}
                onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                className="admin-table-input"
                style={{ width: '100%', padding: '10px 14px', fontSize: '13px', borderRadius: '6px' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '0.02em' }}>CATEGORY (GENRE)</label>
              <select 
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="admin-table-input"
                style={{ width: '100%', padding: '10px 14px', fontSize: '13px', borderRadius: '6px', height: '38px' }}
              >
                <option value="Cameras">Cameras</option>
                <option value="Storage">Storage</option>
                <option value="Accessories">Accessories</option>
                <option value="Networking">Networking</option>
                <option value="Services">Services</option>
                <option value="DVR">DVR</option>
                <option value="NVR">NVR</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '0.02em' }}>PRICE (₹)</label>
              <input 
                type="text" 
                placeholder="e.g. 2400" 
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                className="admin-table-input"
                style={{ width: '100%', padding: '10px 14px', fontSize: '13px', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '0.02em' }}>STOCK STATUS</label>
              <select 
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                className="admin-table-input"
                style={{ width: '100%', padding: '10px 14px', fontSize: '13px', borderRadius: '6px', height: '38px' }}
              >
                <option value="In Stock">In Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Call for Availability">Call for Availability</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="submit" variant="primary" style={{ padding: '10px 20px', fontSize: '13px', whiteSpace: 'nowrap', borderRadius: '6px' }} disabled={addMutation.isPending}>
                {addMutation.isPending ? "Adding..." : "Save Product"}
              </Button>
              <button type="button" className="btn-link" onClick={() => setShowAddForm(false)} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter controls panel */}
      <div className="admin-controls-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1, minWidth: '280px' }}>
            {/* Search box with clear shortcut trigger */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Icon name="search" size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <input 
                id="admin-product-search"
                type="text" 
                placeholder="Search products... (Press / to focus)" 
                className="admin-table-input" 
                style={{ width: '100%', padding: '8px 12px 8px 36px', fontSize: '13px', borderRadius: '6px' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                >
                  <Icon name="x" size={12} />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="admin-table-input"
              style={{ width: '150px', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', height: '36px' }}
            >
              <option value="All">All Categories</option>
              <option value="Cameras">Cameras</option>
              <option value="Storage">Storage</option>
              <option value="Accessories">Accessories</option>
              <option value="Networking">Networking</option>
              <option value="Services">Services</option>
              <option value="DVR">DVR</option>
              <option value="NVR">NVR</option>
            </select>

            {/* Stock Status Filter */}
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="admin-table-input"
              style={{ width: '150px', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', height: '36px' }}
            >
              <option value="All">All Stock Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Call for Availability">Call for Availability</option>
            </select>

            {/* Catalog Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="admin-table-input"
              style={{ width: '150px', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', height: '36px' }}
            >
              <option value="All">All Visibility</option>
              <option value="Live">Public Catalog Only</option>
              <option value="Hidden">Hidden Archives Only</option>
            </select>

            {/* Reset Filters CTA */}
            {(searchTerm || filterCategory !== "All" || filterStock !== "All" || filterStatus !== "All") && (
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("All");
                  setFilterStock("All");
                  setFilterStatus("All");
                }}
                className="btn-link"
                style={{ color: '#ff6b6b', fontSize: '13px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <Icon name="x" size={13} /> Reset Filters
              </button>
            )}
          </div>

          {/* Column Visibility Selector dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="admin-pill-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Icon name="eye" size={13} /> Columns <Icon name="chevronDown" size={10} />
            </button>

            {showColumnDropdown && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowColumnDropdown(false)}></div>
                <div style={{ position: 'absolute', right: 0, top: '40px', background: 'var(--obsidian)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', zIndex: 100, width: '200px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>Toggle Columns</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.keys(visibleColumns).map((col) => (
                      <label key={col} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'rgba(255,255,255,0.85)', cursor: 'pointer', userSelect: 'none' }}>
                        <input 
                          type="checkbox" 
                          checked={visibleColumns[col]} 
                          onChange={() => setVisibleColumns({ ...visibleColumns, [col]: !visibleColumns[col] })}
                          style={{ accentColor: 'var(--gold)' }}
                        />
                        {col.toUpperCase()}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="admin-table-wrap" style={{ position: 'relative' }}>
        {loadingProducts ? (
          <table className="admin-table">
            <thead>
              <tr>
                {visibleColumns.id && <th>ID</th>}
                <th>Image</th>
                {visibleColumns.name && <th>Name</th>}
                {visibleColumns.brand && <th>Brand</th>}
                {visibleColumns.category && <th>Category</th>}
                {visibleColumns.stock && <th>Stock Status</th>}
                {visibleColumns.price && <th>Price</th>}
                {visibleColumns.status && <th>Catalog Display</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, idx) => (
                <tr key={idx}>
                  {visibleColumns.id && <td><div style={{ height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '30px', animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} /></td>}
                  <td><div style={{ height: '36px', width: '36px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} /></td>
                  {visibleColumns.name && <td><div style={{ height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '220px', animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} /></td>}
                  {visibleColumns.brand && <td><div style={{ height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '60px', animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} /></td>}
                  {visibleColumns.category && <td><div style={{ height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '80px', animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} /></td>}
                  {visibleColumns.stock && <td><div style={{ height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '70px', animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} /></td>}
                  {visibleColumns.price && <td><div style={{ height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '50px', animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} /></td>}
                  {visibleColumns.status && <td><div style={{ height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '90px', animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} /></td>}
                  <td><div style={{ height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '80px', animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : processedProducts.length === 0 ? (
          /* Empty state */
          <div className="empty-state">
            <div className="empty-state-icon">
              <Icon name="box" size={32} color="var(--gold)" />
            </div>
            <h3 className="empty-state-title">No Products Found</h3>
            <p className="empty-state-sub">
              No products matched your filter query. Try clearing your search parameters or reset your dashboard controls.
            </p>
            <button 
              onClick={() => {
                setSearchTerm("");
                setFilterCategory("All");
                setFilterStock("All");
                setFilterStatus("All");
              }}
              className="btn-detail-outline"
              style={{ padding: '10px 20px', fontSize: '13px', borderRadius: '8px', cursor: 'pointer' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                {visibleColumns.id && (
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort("id")}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ID {sortField === 'id' && <Icon name={sortDirection === 'asc' ? 'arrowUp' : 'arrowDown'} size={12} />}
                    </div>
                  </th>
                )}
                <th>Image</th>
                {visibleColumns.name && (
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort("name")}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Name {sortField === 'name' && <Icon name={sortDirection === 'asc' ? 'arrowUp' : 'arrowDown'} size={12} />}
                    </div>
                  </th>
                )}
                {visibleColumns.brand && (
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort("brand")}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Brand {sortField === 'brand' && <Icon name={sortDirection === 'asc' ? 'arrowUp' : 'arrowDown'} size={12} />}
                    </div>
                  </th>
                )}
                {visibleColumns.category && (
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort("category")}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Category {sortField === 'category' && <Icon name={sortDirection === 'asc' ? 'arrowUp' : 'arrowDown'} size={12} />}
                    </div>
                  </th>
                )}
                {visibleColumns.stock && (
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort("stock")}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Stock {sortField === 'stock' && <Icon name={sortDirection === 'asc' ? 'arrowUp' : 'arrowDown'} size={12} />}
                    </div>
                  </th>
                )}
                {visibleColumns.price && (
                  <th style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }} onClick={() => handleSort("price")}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      Price {sortField === 'price' && <Icon name={sortDirection === 'asc' ? 'arrowUp' : 'arrowDown'} size={12} />}
                    </div>
                  </th>
                )}
                {visibleColumns.status && (
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort("is_visible")}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Status {sortField === 'is_visible' && <Icon name={sortDirection === 'asc' ? 'arrowUp' : 'arrowDown'} size={12} />}
                    </div>
                  </th>
                )}
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map(p => (
                <tr key={p.id}>
                  {visibleColumns.id && <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontFamily: 'monospace' }}>#{p.id}</td>}
                  <td>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      backgroundColor: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--color-border)'
                    }}>
                      {p.images && p.images[0] && p.images[0] !== 'product' ? (
                        <img src={p.images[0]} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <Icon name="camera" size={16} color="var(--color-muted)" />
                      )}
                    </div>
                  </td>
                  {visibleColumns.name && <td style={{ fontWeight: 500, color: 'var(--white)' }}>{p.name}</td>}
                  {visibleColumns.brand && <td><span className="brand-badge">{p.brand}</span></td>}
                  {visibleColumns.category && <td>{p.category}</td>}
                  {visibleColumns.stock && (
                    <td>
                      <select 
                        className="admin-table-input" 
                        style={{ 
                          padding: '4px 8px', 
                          fontSize: '12px', 
                          borderRadius: '4px',
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(255,255,255,0.04)',
                          color: p.stock === 'In Stock' ? 'var(--success)' : 'var(--warning)',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        defaultValue={p.stock}
                        onChange={(e) => updateMutation.mutate({ id: p.id, data: { stock: e.target.value } })}
                      >
                        <option value="In Stock" style={{ background: 'var(--obsidian)', color: 'var(--success)' }}>In Stock</option>
                        <option value="Out of Stock" style={{ background: 'var(--obsidian)', color: 'var(--warning)' }}>Out of Stock</option>
                        <option value="Call for Availability" style={{ background: 'var(--obsidian)', color: 'var(--warning)' }}>Call</option>
                      </select>
                    </td>
                  )}
                  {visibleColumns.price && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>₹</span>
                        <input 
                          type="text" 
                          className="admin-table-input" 
                          style={{ width: '80px', padding: '4px 8px', fontSize: '12px', textAlign: 'right' }}
                          defaultValue={p.price}
                          onBlur={(e) => updateMutation.mutate({ id: p.id, data: { price: parseFloat(e.target.value) || 0 } })}
                        />
                      </div>
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td>
                      <button 
                        onClick={() => visibilityMutation.mutate(p.id)}
                        title={p.is_visible ? "Click to move back from public catalog" : "Click to put back in public page"}
                        className={`btn-visibility-toggle ${p.is_visible ? 'live' : 'archived'}`}
                        style={{ margin: 0 }}
                      >
                        <Icon name={p.is_visible ? "eye" : "eyeOff"} size={12} />
                        {p.is_visible ? "Public Catalog" : "Hidden Archive"}
                      </button>
                    </td>
                  )}
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
                      <button 
                        className="btn-link"
                        onClick={() => {
                          const prod = {
                            ...p,
                            categoryId: p.categoryId || (categories.find(c => c.name === p.category)?.id || ''),
                            description: p.description || ''
                          };
                          setEditingProduct(prod);
                          setCleanProduct(prod);
                        }}
                        style={{ color: 'var(--gold-light)', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: 'none', background: 'transparent', fontWeight: 500 }}
                      >
                        <Icon name="edit" size={13} /> Edit
                      </button>
                      <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
                      <button 
                        className="btn-link"
                        onClick={() => setConfirmConfig({
                          title: "Delete Product?",
                          message: `Are you sure you want to permanently delete '${p.name}'? This cannot be undone.`,
                          confirmLabel: "Delete",
                          variant: "danger",
                          onConfirm: () => deleteMutation.mutate(p.id)
                        })}
                        style={{ color: '#ff6b6b', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: 'none', background: 'transparent' }}
                      >
                        <Icon name="trash" size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bulk-action-bar">
          <span className="bulk-count">{selectedIds.length} product{selectedIds.length !== 1 ? 's' : ''} selected</span>
          <div className="bulk-actions">
            <button className="bulk-btn publish" onClick={() => {
              selectedIds.forEach(id => visibilityMutation.mutate(id));
              setSelectedIds([]);
            }}>Toggle Visibility</button>
            <button className="bulk-btn danger" onClick={() => {
              setConfirmConfig({
                title: "Delete Selected Products?",
                message: `Are you sure you want to permanently delete the ${selectedIds.length} selected products? This action cannot be undone.`,
                confirmLabel: "Delete All",
                variant: "danger",
                onConfirm: () => {
                  selectedIds.forEach(id => deleteMutation.mutate(id));
                  setSelectedIds([]);
                }
              });
            }}>Delete Selected</button>
            <button className="bulk-btn cancel" onClick={() => setSelectedIds([])}>Clear</button>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {!loadingProducts && processedProducts.length > 0 && (
        <div className="admin-table-wrap" style={{ marginTop: '4px' }}>
          <div className="admin-pagination">
            <div className="pagination-info">
              Showing <strong>{Math.min(processedProducts.length, (currentPage-1)*itemsPerPage+1)}</strong>–<strong>{Math.min(processedProducts.length, currentPage*itemsPerPage)}</strong> of <strong>{processedProducts.length}</strong> products
              &nbsp;·&nbsp;
              <select value={itemsPerPage} onChange={e => setItemsPerPage(parseInt(e.target.value))} className="admin-table-input" style={{ padding:'2px 6px', fontSize:'12px', borderRadius:'4px', width:'80px', height:'24px', display:'inline' }}>
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
            <div className="pagination-btns">
              <button className="page-btn" onClick={() => setCurrentPage(1)} disabled={effectivePage===1}>«</button>
              <button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={effectivePage===1}><Icon name="chevronLeft" size={12} /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page;
                if (totalPages <= 5) page = i + 1;
                else if (effectivePage <= 3) page = i + 1;
                else if (effectivePage >= totalPages - 2) page = totalPages - 4 + i;
                else page = effectivePage - 2 + i;
                return <button key={page} className={`page-btn ${effectivePage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>;
              })}
              <button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} disabled={effectivePage===totalPages}><Icon name="chevronRight" size={12} /></button>
              <button className="page-btn" onClick={() => setCurrentPage(totalPages)} disabled={effectivePage===totalPages}>»</button>
            </div>
          </div>
        </div>
      )}

      {/* Global premium glassmorphic Edit Product Modal Overlay */}
      {editingProduct && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-product-modal-title">
          <div className="admin-modal-card">

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="edit" size={20} color="var(--gold-dark)" />
                <h3 id="edit-product-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--white)', fontFamily: 'Outfit, sans-serif' }}>Edit Product</h3>
              </div>
              <button 
                onClick={() => setEditingProduct(null)} 
                aria-label="Close edit product modal"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--mid-gray)', display: 'flex', alignItems: 'center', padding: '4px' }}
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({
                id: editingProduct.id,
                data: {
                  name: editingProduct.name,
                  brand: editingProduct.brand,
                  categoryId: editingProduct.categoryId,
                  price: parseFloat(editingProduct.price) || 0,
                  stock: editingProduct.stock,
                  stockQty: parseInt(editingProduct.stockQty) || 0,
                  indoorOutdoor: editingProduct.indoorOutdoor || '',
                  resolution: editingProduct.resolution || '',
                  type: editingProduct.type || ''
                }
              }, {
                onSuccess: () => {
                  setEditingProduct(null);
                }
              });
            }} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mid-gray)', marginBottom: '6px', letterSpacing: '0.02em' }}>PRODUCT NAME</label>
                <input 
                  ref={editModalFirstInputRef}
                  type="text" 
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="admin-table-input"
                  style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', borderRadius: '6px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mid-gray)', marginBottom: '6px', letterSpacing: '0.02em' }}>BRAND</label>
                  <input 
                    type="text" 
                    value={editingProduct.brand}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    className="admin-table-input"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', borderRadius: '6px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mid-gray)', marginBottom: '6px', letterSpacing: '0.02em' }}>CATEGORY (GENRE)</label>
                  <select 
                    value={editingProduct.categoryId}
                    onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                    className="admin-table-input"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', borderRadius: '6px', height: '40px' }}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mid-gray)', marginBottom: '6px', letterSpacing: '0.02em' }}>PRICE (₹) (Text Input - No Arrows)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 2400" 
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className="admin-table-input"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mid-gray)', marginBottom: '6px', letterSpacing: '0.02em' }}>STOCK STATUS</label>
                  <select 
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                    className="admin-table-input"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', borderRadius: '6px', height: '40px' }}
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Call for Availability">Call for Availability</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mid-gray)', marginBottom: '6px', letterSpacing: '0.02em' }}>STOCK QUANTITY</label>
                  <input 
                    type="text" 
                    value={editingProduct.stockQty}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stockQty: e.target.value })}
                    className="admin-table-input"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mid-gray)', marginBottom: '6px', letterSpacing: '0.02em' }}>INDOOR/OUTDOOR</label>
                  <select 
                    value={editingProduct.indoorOutdoor || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, indoorOutdoor: e.target.value })}
                    className="admin-table-input"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', borderRadius: '6px', height: '40px' }}
                  >
                    <option value="">N/A</option>
                    <option value="Indoor">Indoor</option>
                    <option value="Outdoor">Outdoor</option>
                    <option value="Indoor/Outdoor">Indoor/Outdoor</option>
                  </select>
                </div>
              </div>

              {/* Audit Metadata */}
              {editingProduct.createdAt && (
                <div className="audit-meta">
                  <div className="audit-meta-item">
                    <span className="audit-meta-label">Created</span>
                    <span className="audit-meta-value">{new Date(editingProduct.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {editingProduct.updatedAt && (
                    <div className="audit-meta-item">
                      <span className="audit-meta-label">Last Modified</span>
                      <span className="audit-meta-value">{new Date(editingProduct.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  <div className="audit-meta-item">
                    <span className="audit-meta-label">Product ID</span>
                    <span className="audit-meta-value" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{editingProduct.id}</span>
                  </div>
                </div>
              )}

              {/* Description */}
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mid-gray)', marginBottom: '6px', letterSpacing: '0.02em' }}>PRODUCT DESCRIPTION</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="admin-table-input"
                  style={{ width: '100%', padding: '10px 14px', fontSize: '13px', borderRadius: '6px', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
                  placeholder="Brief product description..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setConfirmConfig({
                      title: "Delete Product?",
                      message: `Are you sure you want to permanently delete '${editingProduct.name}'? This cannot be undone.`,
                      confirmLabel: "Delete",
                      variant: "danger",
                      onConfirm: () => {
                        deleteMutation.mutate(editingProduct.id, {
                          onSuccess: () => setEditingProduct(null)
                        });
                      }
                    });
                  }}
                  className="btn-detail-outline"
                  style={{ borderColor: '#d93025', color: '#d93025', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px' }}
                >
                  <Icon name="trash" size={14} /> Remove Product
                </button>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => setEditingProduct(null)} 
                    className="btn-link"
                    style={{ color: 'var(--mid-gray)', fontSize: '13px' }}
                  >
                    Cancel
                  </button>
                  <Button 
                    type="submit" 
                    variant="primary"
                    style={{ padding: '8px 24px', borderRadius: '6px' }}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmConfig}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        confirmLabel={confirmConfig?.confirmLabel}
        cancelLabel={confirmConfig?.cancelLabel}
        variant={confirmConfig?.variant}
        onConfirm={() => {
          confirmConfig?.onConfirm();
          setConfirmConfig(null);
        }}
        onCancel={() => setConfirmConfig(null)}
      />
    </section>
  );
}
