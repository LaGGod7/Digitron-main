import { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DigitronLoader, Icon, Button, Card, StatusLabel } from "../components/ui";
import { Footer, ProductCard } from "../components/layout";
import { useQuery } from '@tanstack/react-query';
import { fetchPopularProducts } from '../services/api';
import products from "../data/products";
import siteConfig from "../data/siteConfig";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

const CATEGORY_ICONS = {
  Cameras: "camera",
  DVR: "grid",
  NVR: "grid",
  "Cables & Connectors": "zap",
  Networking: "settings",
  Storage: "inbox",
  "Mounting & Enclosures": "package",
  "Power Supplies": "zap",
  Displays: "eye",
  Services: "messageSquare",
  "Access & Accessories": "shield",
  Accessories: "package",
};

/* Slug for each category */
const SLUG_MAP = {
  Cameras:                "cameras",
  DVR:                    "dvr",
  NVR:                    "nvr",
  "Cables & Connectors":  "cables-connectors",
  Networking:             "networking",
  Storage:                "storage",
  "Mounting & Enclosures":"mounting-enclosures",
  "Power Supplies":       "power-supplies",
  Displays:               "displays",
  Services:               "services",
  "Access & Accessories": "access-accessories",
  Accessories:            "accessories",
};

function AnimatedStat({ end, suffix, label, decimals = 0 }) {
  const [ref, inView] = useInView({ triggerOnce: true });
  const CountUpComp = CountUp.default || CountUp;
  return (
    <div ref={ref}>
      <div className="hero-stat-num" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-body)' }}>
        {inView ? <CountUpComp end={end} duration={2.2} suffix={suffix} decimals={decimals} /> : 0}
      </div>
      <div className="hero-stat-label" style={{ fontFamily: 'var(--font-body)', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Digitron Associates — CCTV & Security Solutions, Hubbali";
  }, []);

  const { data: popularProducts = [], isLoading: loadingPopular } = useQuery({
    queryKey: ['homepage-popular-products'],
    queryFn: fetchPopularProducts
  });

  const categories = useMemo(() => {
    const grouped = products.reduce((acc, product) => {
      if (!acc[product.category]) acc[product.category] = [];
      acc[product.category].push(product);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, items]) => ({
        name,
        count: items.length,
        brands: [...new Set(items.map((p) => p.brand))].sort(),
        inStock: items.filter((p) => p.stock === "In Stock").length,
        slug: SLUG_MAP[name] || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      }))
      .sort((a, b) => b.count - a.count);
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-grid-overlay" />
        <div className="hero-inner">
          <div className="hero-badge" style={{ fontFamily: 'var(--font-body)' }}>
            <Icon name="mapPin" size={10} color="var(--color-gold)" /> CCTV SOLUTIONS — HUBBALI, KARNATAKA
          </div>
          <h1 className="hero-h1 h1-style" style={{ color: 'var(--color-surface)' }}>
            {siteConfig.storeName}<br /><span>Security Catalog</span>
          </h1>
          <p className="hero-sub body-style" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '15px' }}>
            Browse CCTV cameras, DVR/NVR systems, storage, cables, networking equipment, and installation services from one shop catalog.
          </p>
          <div className="hero-ctas" style={{ gap: '16px' }}>
            <Button
              variant="primary"
              onClick={() => document.getElementById("category-grid")?.scrollIntoView({ behavior: "smooth" })}
            >
              Browse Cameras <Icon name="chevronRight" size={14} color="#FFFFFF" />
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/contact")}
              style={{ color: '#FFFFFF' }}
            >
              Request Quote
            </Button>
          </div>
          <div className="hero-stats">
            <AnimatedStat end={products.length} suffix="+" label="PRODUCTS" />
            <AnimatedStat end={categories.length} suffix="" label="CATEGORIES" />
            <AnimatedStat end={categories.find((c) => c.name === "Cameras")?.brands.length || 0} suffix="+" label="CAMERA BRANDS" />
            <AnimatedStat end={4.6} suffix="★" label="AVG RATING" decimals={1} />
          </div>
        </div>
      </section>

      {/* Trust / Why Us Row */}
      <section className="section-wrap" style={{ 
        padding: '24px', 
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        marginTop: '-32px',
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '24px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <Icon name="award" size={20} />
            </div>
            <div>
              <h4 className="h3-style" style={{ fontSize: '14px', margin: 0 }}>15+ Years Trust</h4>
              <p className="meta-style" style={{ margin: 0 }}>Hubbali's trusted security partner</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
              <Icon name="shield" size={20} />
            </div>
            <div>
              <h4 className="h3-style" style={{ fontSize: '14px', margin: 0 }}>Premium Brands</h4>
              <p className="meta-style" style={{ margin: 0 }}>Hikvision, CP Plus, Dahua & more</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <Icon name="tool" size={20} />
            </div>
            <div>
              <h4 className="h3-style" style={{ fontSize: '14px', margin: 0 }}>Professional Installation</h4>
              <p className="meta-style" style={{ margin: 0 }}>Expert local setup & integration</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
              <Icon name="messageSquare" size={20} />
            </div>
            <div>
              <h4 className="h3-style" style={{ fontSize: '14px', margin: 0 }}>Fast Support</h4>
              <p className="meta-style" style={{ margin: 0 }}>Quick help for any security issue</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tiles Section */}
      <div className="products-section" id="category-grid" style={{ paddingTop: '60px' }}>
        <div className="products-header" style={{ marginBottom: '24px' }}>
          <div>
            <h2 className="h2-style">Product Categories</h2>
            <p className="meta-style" style={{ marginTop: '4px', marginBottom: 0 }}>Select a category to view specifications, stock levels, and get quotes</p>
          </div>
          <span className="meta-style" style={{ alignSelf: 'flex-end' }}>{products.length} products listed</span>
        </div>
        <div className="category-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px'
        }}>
          {categories.map((category) => (
            <Card
              key={category.name}
              interactive
              onClick={() => navigate(`/category/${category.slug}`)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '24px',
                gap: '12px'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-button)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-gold)'
              }}>
                <Icon name={CATEGORY_ICONS[category.name] || "package"} size={20} />
              </div>
              <div style={{ width: '100%' }}>
                <h3 className="h3-style" style={{ marginBottom: '6px' }}>{category.name}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span className="meta-style">{category.count} Products</span>
                  <span className="meta-style" style={{ color: 'var(--color-success)' }}>{category.inStock} In Stock</span>
                </div>
              </div>
              {category.name === "Cameras" && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px', width: '100%', marginTop: '4px' }}>
                  <p className="meta-style" style={{ fontSize: '11px', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebKitLineClamp: 2, WebKitBoxOrient: 'vertical' }}>
                    {category.brands.filter(b => b !== "Generic").slice(0, 4).join(", ")}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Featured & Popular Products */}
      <div className="products-section" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '48px', marginTop: '48px' }}>
        <div className="products-header" style={{ marginBottom: '24px' }}>
          <div>
            <h2 className="h2-style" style={{ margin: 0 }}>Commonly Searched & Most Visited Products</h2>
            <p className="meta-style" style={{ marginTop: '4px', marginBottom: 0 }}>Trending equipment and most viewed items by visitors</p>
          </div>
          <StatusLabel text="Live Popularity" type="featured" />
        </div>
        
        {loadingPopular ? (
          <div style={{ padding: '24px 0' }}>
            <DigitronLoader label="loading trends" compact />
          </div>
        ) : popularProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-muted)', fontSize: '14px' }}>
            No items visited yet. Start browsing to see popular items!
          </div>
        ) : (
          <div className="scroll-strip" style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px' }}>
            {popularProducts.map((p) => (
              <ProductCard 
                key={p.id} 
                product={p} 
                onView={() => { navigate(`/product/${p.id}`); window.scrollTo(0, 0); }}
                compareList={[]}
                onCompare={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
