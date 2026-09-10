import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DigitronLoader, Icon, Button, Card, Select, Chip } from "../components/ui";
import { Footer, ProductCard } from "../components/layout";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, getWishlist, toggleWishlist } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useInView } from "react-intersection-observer";

/* ── Slug ↔ Category mapping ── */
const SLUG_MAP = {
  "cameras":              "Cameras",
  "dvr":                  "DVR",
  "nvr":                  "NVR",
  "cables-connectors":    "Cables & Connectors",
  "networking":           "Networking",
  "storage":              "Storage",
  "mounting-enclosures":  "Mounting & Enclosures",
  "power-supplies":       "Power Supplies",
  "displays":             "Displays",
  "services":             "Services",
  "access-accessories":   "Access & Accessories",
  "accessories":          "Accessories",
};

const CATEGORY_ICONS = {
  Cameras:                "camera",
  DVR:                    "grid",
  NVR:                    "grid",
  "Cables & Connectors":  "zap",
  Networking:             "settings",
  Storage:                "inbox",
  "Mounting & Enclosures":"package",
  "Power Supplies":       "zap",
  Displays:               "eye",
  Services:               "messageSquare",
  "Access & Accessories": "shield",
  Accessories:            "package",
};

/* Categories where we show brand sub-cards */
const BRAND_CATEGORIES = ["Cameras"];

const LOCATIONS = ["All", "Indoor", "Outdoor", "Both"];

function AnimatedProductCard({ children }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.05 });
  return (
    <div ref={ref} className={`product-card-entrance ${inView ? 'visible' : ''}`} style={{ height: '100%' }}>
      {children}
    </div>
  );
}

export default function CategoryPage({ compareList, setCompareList, showToast }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const queryClient = useQueryClient();
  const { user, login } = useAuth();
  const { addToCart } = useCart();

  const categoryName = SLUG_MAP[slug];
  const isBrandCategory = BRAND_CATEGORIES.includes(categoryName);

  /* Filter and Sort State */
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [resolution, setResolution]       = useState("All");
  const [location, setLocation]           = useState("All");
  const [search, setSearch]               = useState("");
  const [inStockOnly, setInStockOnly]     = useState(false);
  const [sortBy, setSortBy]               = useState("default");
  const [pageSize, setPageSize]           = useState(20);

  useEffect(() => {
    if (categoryName) {
      document.title = selectedBrand
        ? `${selectedBrand} ${categoryName} | Digitron Associates`
        : `${categoryName} | Digitron Associates`;
    }
  }, [categoryName, selectedBrand]);

  /* Reset pagination on filter change */
  useEffect(() => {
    const timer = setTimeout(() => setPageSize(20), 0);
    return () => clearTimeout(timer);
  }, [selectedBrand, resolution, location, search, inStockOnly, sortBy]);

  /* All products in this category */
  const { data: categoryProducts = [], isLoading } = useQuery({
    queryKey: ['products', slug],
    queryFn: () => fetchProducts(slug),
    enabled: !!categoryName
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
    enabled: !!user
  });

  const wishlistMutation = useMutation({
    mutationFn: (productId) => toggleWishlist(productId),
    onSuccess: (data) => {
      queryClient.setQueryData(['wishlist'], data.wishlist || []);
      showToast(data.wishlisted ? "Saved to wishlist" : "Removed from wishlist");
    },
    onError: () => showToast("Could not update wishlist. Try again.")
  });

  /* Brand options list */
  const brands = useMemo(() => {
    const set = new Set(categoryProducts.map(p => p.brand).filter(b => b && b !== "Generic"));
    const list = Array.from(set).sort();
    return ["All", ...list, "Generic"];
  }, [categoryProducts]);

  /* Available resolutions */
  const resolutions = useMemo(() => {
    const set = new Set(categoryProducts.map(p => p.resolution).filter(r => r && r !== "Other"));
    return ["All", ...Array.from(set).sort()];
  }, [categoryProducts]);

  /* Filtered and Sorted products */
  const filteredAndSorted = useMemo(() => {
    // 1. Filtering
    let result = categoryProducts.filter(p => {
      if (selectedBrand && p.brand !== selectedBrand) return false;
      if (resolution !== "All" && p.resolution !== resolution) return false;
      if (location !== "All") {
        if (location === "Indoor"  && !["Indoor", "Both"].includes(p.indoorOutdoor || p.indoor_outdoor)) return false;
        if (location === "Outdoor" && !["Outdoor", "Both"].includes(p.indoorOutdoor || p.indoor_outdoor)) return false;
        if (location === "Both"    && (p.indoorOutdoor || p.indoor_outdoor) !== "Both") return false;
      }
      if (inStockOnly && !(p.stock === "In Stock" || p.stockStatus === "In Stock")) return false;
      if (search) {
        const term = search.toLowerCase();
        if (!p.name.toLowerCase().includes(term) && !(p.brand || "").toLowerCase().includes(term) && !(p.barcode || "").includes(term)) return false;
      }
      return true;
    });

    // 2. Sorting
    if (sortBy === "price-low") {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "rating") {
      result.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    }

    return result;
  }, [categoryProducts, selectedBrand, resolution, location, inStockOnly, search, sortBy]);

  const paginatedProducts = useMemo(() => {
    return filteredAndSorted.slice(0, pageSize);
  }, [filteredAndSorted, pageSize]);

  if (!categoryName) {
    return (
      <main className="page" aria-label="Category Not Found">
        <div className="section-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Icon name="alertCircle" size={40} color="var(--color-danger)" />
            <h3 className="h3-style" style={{ margin: '12px 0' }}>Category not found</h3>
            <Button variant="primary" onClick={() => navigate("/")}>Go Home</Button>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="page" aria-label="Loading Products">
        <DigitronLoader label="loading products" />
      </main>
    );
  }

  const handleCompare = (product) => {
    if (compareList.some(p => p.id === product.id)) {
      setCompareList(compareList.filter(p => p.id !== product.id));
    } else if (compareList.length < 2) {
      setCompareList([...compareList, product]);
      showToast(`${product.name.split(" ")[0]}... added to compare`);
    } else {
      showToast("Max 2 products for comparison. Remove one first.");
    }
  };

  const handleAddToCart = async (product) => {
    if (!user) {
      showToast("Login to add products to cart");
      login(routeLocation.pathname + routeLocation.search);
      return;
    }
    try {
      await addToCart(product.id);
      showToast("Added to quote request basket!");
    } catch {
      showToast("Could not add to quote request basket. Try again.");
    }
  };

  const handleToggleWishlist = (product) => {
    if (!user) {
      showToast("Login to save to wishlist");
      login(routeLocation.pathname + routeLocation.search);
      return;
    }
    wishlistMutation.mutate(product.id);
  };

  const clearFilters = () => {
    setSelectedBrand(null);
    setResolution("All");
    setLocation("All");
    setSearch("");
    setInStockOnly(false);
    setSortBy("default");
  };

  const hasFilters = selectedBrand || resolution !== "All" || location !== "All" || search || inStockOnly || sortBy !== "default";
  const icon = CATEGORY_ICONS[categoryName] || "package";

  return (
    <main className="page" style={{ backgroundColor: 'var(--color-bg)' }} aria-label={`${selectedBrand ? selectedBrand + ' ' : ''}${categoryName} Category Page`}>
      {/* Page Header Area */}
      <div style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '24px 0 32px 0' }}>
        <div className="section-wrap" style={{ paddingBottom: 0 }}>
          {/* Breadcrumbs */}
          <div className="meta-style" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate("/")}>Home</span>
            <span>/</span>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate("/")}>Categories</span>
            <span>/</span>
            <span style={{ color: 'var(--color-ink)', fontWeight: 5 }}>{categoryName}</span>
            {selectedBrand && (
              <>
                <span>/</span>
                <span style={{ color: 'var(--color-ink)', fontWeight: 5 }}>{selectedBrand}</span>
              </>
            )}
          </div>

          {/* Title Row with Sort Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-bg)', color: 'var(--color-gold)' }}>
                <Icon name={icon} size={24} />
              </div>
              <div>
                <h2 className="h2-style" style={{ margin: 0, fontSize: '24px' }}>
                  {selectedBrand ? `${selectedBrand} ${categoryName}` : categoryName}
                </h2>
                <p className="meta-style" style={{ marginTop: '4px', margin: 0 }}>
                  {categoryProducts.length} items listed · {categoryProducts.filter(p => p.stock === "In Stock" || p.stockStatus === "In Stock").length} in stock
                </p>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div style={{ minWidth: '180px' }}>
              <Select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                style={{ margin: 0 }}
              >
                <option value="default">Default Sorting</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Chips Bar */}
      <div style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '16px 0', position: 'sticky', top: '70px', zIndex: 100 }}>
        <div className="section-wrap" style={{ paddingBottom: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Search Input and Count Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <span className="meta-style" style={{ fontWeight: 5 }}>
                {filteredAndSorted.length} matching products
              </span>
              <div style={{ width: '100%', maxWidth: '300px' }}>
                <input 
                  type="text"
                  placeholder="Search inside category..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  style={{
                    width: '100%',
                    height: '32px',
                    borderRadius: 'var(--radius-input)',
                    border: '1px solid var(--color-border)',
                    padding: '0 12px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: 'var(--color-bg)'
                  }}
                />
              </div>
            </div>

            {/* Horizontal Filter Chips Group */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {/* Back CTA Link */}
              <Button 
                variant="secondary" 
                onClick={() => navigate("/")}
                style={{ padding: '4px 10px', height: '28px', fontSize: '11px', borderRadius: '20px' }}
              >
                <Icon name="arrowLeft" size={10} /> Back
              </Button>

              <div style={{ height: '16px', width: '1px', backgroundColor: 'var(--color-border)' }} />

              {/* Brands Chips */}
              {isBrandCategory && brands.map(b => (
                <Chip 
                  key={b} 
                  label={b === "All" ? "All Brands" : b} 
                  selected={b === "All" ? !selectedBrand : selectedBrand === b} 
                  onClick={() => setSelectedBrand(b === "All" ? null : b)} 
                />
              ))}

              {isBrandCategory && <div style={{ height: '16px', width: '1px', backgroundColor: 'var(--color-border)' }} />}

              {/* Resolutions Chips */}
              {resolutions.length > 2 && resolutions.map(r => (
                <Chip 
                  key={r} 
                  label={r === "All" ? "All Resolutions" : r} 
                  selected={resolution === r} 
                  onClick={() => setResolution(r)} 
                />
              ))}

              {resolutions.length > 2 && <div style={{ height: '16px', width: '1px', backgroundColor: 'var(--color-border)' }} />}

              {/* Location Chips */}
              {LOCATIONS.map(l => (
                <Chip 
                  key={l} 
                  label={l === "All" ? "All Areas" : l} 
                  selected={location === l} 
                  onClick={() => setLocation(l)} 
                />
              ))}

              <div style={{ height: '16px', width: '1px', backgroundColor: 'var(--color-border)' }} />

              {/* In-Stock Filter Chip */}
              <Chip 
                label="In Stock Only" 
                selected={inStockOnly} 
                onClick={() => setInStockOnly(!inStockOnly)} 
              />

              {hasFilters && (
                <Button 
                  variant="ghost" 
                  onClick={clearFilters}
                  style={{ padding: '0 8px', fontSize: '12px', color: 'var(--color-danger)' }}
                >
                  ✕ Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="section-wrap" style={{ paddingTop: '32px' }}>
        {filteredAndSorted.length === 0 ? (
          /* Empty State */
          <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center', gap: '16px' }}>
            <Icon name="search" size={48} color="var(--color-muted)" />
            <div>
              <h3 className="h3-style" style={{ margin: 0 }}>No products found</h3>
              <p className="meta-style" style={{ margin: '4px 0 0 0' }}>Try adjusting your search terms or filters</p>
            </div>
            <Button variant="ghost" onClick={clearFilters}>
              Clear all filters
            </Button>
          </Card>
        ) : (
          <>
            {/* Products Grid Layout */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '24px'
            }}>
              {paginatedProducts.map(p => (
                <AnimatedProductCard key={p.id}>
                  <ProductCard
                    product={p}
                    onView={(product) => navigate(`/product/${product.id}`)}
                    compareList={compareList}
                    onCompare={handleCompare}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    isWishlisted={wishlist.includes(p.id)}
                  />
                </AnimatedProductCard>
              ))}
            </div>

            {/* Pagination Load More */}
            {filteredAndSorted.length > pageSize && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px' }}>
                <Button variant="secondary" onClick={() => setPageSize(prev => prev + 20)}>
                  Load More Products
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Compare Floating Tray */}
      <div className={`compare-bar ${compareList.length > 0 ? "visible" : ""}`} style={{ zIndex: 1000 }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
          {compareList.length} / 2 selected for comparison
        </div>
        <div className="compare-bar-items">
          {compareList.map(p => (
            <div key={p.id} className="compare-item">
              {p.name.substring(0, 20)}...
              <span className="compare-remove" onClick={() => setCompareList(compareList.filter(x => x.id !== p.id))}>x</span>
            </div>
          ))}
          {compareList.length < 2 && (
            <div className="compare-item" style={{ opacity: 0.4, borderStyle: "dashed" }}>+ Select another</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {compareList.length === 2 && (
            <button className="btn-compare" onClick={() => navigate("/compare")}>Compare Now</button>
          )}
          <button
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "none", borderRadius: 4, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}
            onClick={() => setCompareList([])}
          >Clear</button>
        </div>
      </div>

      <Footer />
    </main>
  );
}
