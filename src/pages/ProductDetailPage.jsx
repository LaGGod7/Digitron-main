import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  DigitronLoader, 
  Icon, 
  WhatsAppIcon, 
  StarRating, 
  BestForTag,
  Button,
  Card,
  StatusLabel,
  Input,
  Textarea
} from "../components/ui";
import { Footer, ProductCard } from "../components/layout";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProductById, fetchProducts, submitReview, updateReview } from '../services/api';
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import bundles from "../data/bundles";
import siteConfig from "../data/siteConfig";

export default function ProductDetailPage({ compareList, setCompareList, showToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, login } = useAuth();
  const { addToCart } = useCart();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id)
  });

  useEffect(() => {
    if (product) {
      document.title = `${product.name} | Digitron Associates`;
    }
  }, [product]);

  const { data: productPool = [] } = useQuery({
    queryKey: ['product-detail-similar-products'],
    queryFn: () => fetchProducts(null, null, false, { limit: 1000 }),
    enabled: Boolean(product)
  });

  const mutation = useMutation({
    mutationFn: (newReview) => submitReview(newReview),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      setForm({ rating: 0, text: "" });
      showToast("Review submitted successfully!");
    },
    onError: () => showToast("Error submitting review. Try again.")
  });

  const editMutation = useMutation({
    mutationFn: ({ reviewId, data }) => updateReview(reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      setEditingReviewId(null);
      showToast("Review updated successfully!");
    },
    onError: () => showToast("Error updating review. Try again.")
  });

  const [form, setForm] = useState({ rating: 0, text: "" });
  const [hoverStar, setHoverStar] = useState(0);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 0, text: "" });
  const [editHoverStar, setEditHoverStar] = useState(0);
  const [activeSpecTab, setActiveSpecTab] = useState("specs");
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const reviewsEnabled = typeof window !== 'undefined' ? localStorage.getItem('ae_enable_reviews') !== 'false' : true;

  // Sticky CTA scroll handler on mobile
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth < 768) {
        if (window.scrollY > 380) {
          setShowStickyBar(true);
        } else {
          setShowStickyBar(false);
        }
      } else {
        setShowStickyBar(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const related = useMemo(() => {
    if (!product) return [];

    return productPool
      .filter((candidate) => candidate.id !== product.id)
      .map((candidate) => {
        const sharedBestFor = (candidate.best_for || []).filter((tag) => product.best_for?.includes(tag)).length;
        const score =
          (candidate.category === product.category ? 6 : 0) +
          (candidate.type === product.type ? 3 : 0) +
          (candidate.brand === product.brand ? 2 : 0) +
          sharedBestFor;

        return { ...candidate, similarityScore: score };
      })
      .filter((candidate) => candidate.similarityScore > 0)
      .sort((a, b) => b.similarityScore - a.similarityScore || (b.avg_rating || 0) - (a.avg_rating || 0))
      .slice(0, 8);
  }, [product, productPool]);

  if (isLoading) {
    return (
      <main className="page" aria-label="Loading Product Details">
        <DigitronLoader label="loading details" />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="page" aria-label="Product Not Found">
        <div className="section-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Icon name="alertCircle" size={40} color="var(--color-danger)" />
            <h3 className="h3-style" style={{ margin: '12px 0' }}>Product not found</h3>
            <Button variant="primary" onClick={() => navigate("/")}>Go back</Button>
          </div>
        </div>
      </main>
    );
  }

  const localReviews = product.reviews || [];
  const avgRating = product.avg_rating || 0;
  const ratingBars = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: localReviews.filter((r) => r.rating === star).length,
    pct: localReviews.length > 0 ? Math.round((localReviews.filter((r) => r.rating === star).length / localReviews.length) * 100) : 0
  }));

  const handleSubmitReview = () => {
    if (form.rating === 0) { showToast("Please select a star rating"); return; }
    if (form.text.length < 10) { showToast("Review must be at least 10 characters"); return; }
    mutation.mutate({
      productId: product.id,
      rating: form.rating,
      reviewText: form.text
    });
  };

  const handleAddToCart = async () => {
    if (!user) {
      showToast("Login to add products to cart");
      login(location.pathname + location.search);
      return;
    }
    try {
      await addToCart(product.id);
      showToast("Added to quote request basket!");
    } catch {
      showToast("Could not add to quote request basket. Try again.");
    }
  };

  const voteHelpful = (reviewId, field) => {
    void reviewId;
    void field;
  };

  const isCompared = compareList.some((p) => p.id === product.id);
  const toggleCompareProduct = (selectedProduct) => {
    const alreadyCompared = compareList.some((p) => p.id === selectedProduct.id);
    if (alreadyCompared) setCompareList(compareList.filter((p) => p.id !== selectedProduct.id));
    else if (compareList.length < 2) { setCompareList([...compareList, selectedProduct]); showToast("Added to comparison"); }
    else showToast("Max 2 products. Remove one first.");
  };
  const toggleCompare = () => toggleCompareProduct(product);

  const timeAgo = (dateStr) => {
    const days = Math.floor((new Date() - new Date(dateStr)) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const matchingBundles = bundles.filter((b) => b.best_for.some((bf) => product.best_for.includes(bf)));
  const priceLabel = product.price > 0 ? `Rs. ${product.price.toLocaleString("en-IN")}` : "Price on request";
  
  const overviewSpecs = {
    Brand: product.brand,
    Category: product.category,
    Type: product.type,
    ...(product.category === 'Cameras' && {
      Resolution: product.resolution || "Other",
      "Indoor/Outdoor": product.indoor_outdoor || "Indoor",
    }),
    Availability: product.stock,
  };
  const inventorySpecs = {
    "Product ID": product.id,
    Barcode: product.barcode || "-",
    GST: product.gst || "-",
    "Stock Quantity": product.stock_qty ?? "-",
    MRP: priceLabel,
  };
  const activeSpecs = activeSpecTab === "overview" ? overviewSpecs : activeSpecTab === "inventory" ? inventorySpecs : (product.specs || { "Note": "Detailed specifications not available for this model yet." });

  // Description truncation logic
  const descriptionText = product.description || `Premium security product engineered for advanced surveillance deployment. Part of the Digitron Associates collection. Fits categories including ${product.category}. Built with weatherproofing where applicable.`;
  const isTruncated = descriptionText.length > 220;
  const displayText = isTruncated && !showFullDesc ? `${descriptionText.slice(0, 220)}...` : descriptionText;

  return (
    <main className="page" style={{ backgroundColor: 'var(--color-bg)' }} aria-label="Product Detail Page">
      <div className="section-wrap" style={{ paddingTop: '24px' }}>
        {/* Breadcrumb Navigation */}
        <div className="meta-style" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate("/")}>Home</span>
          <span>/</span>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate("/")}>Products</span>
          <span>/</span>
          <span style={{ color: 'var(--color-ink)', fontWeight: 5 }}>{product.name}</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: '40px',
          alignItems: 'flex-start',
          marginBottom: '48px'
        }}>
          {/* Column 1: Image Gallery Container */}
          <div>
            <Card style={{ 
              backgroundColor: 'var(--color-surface)', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '24px', 
              position: 'relative',
              height: '380px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              overflow: 'hidden'
            }}>
              <span style={{ position: 'absolute', top: '16px', left: '16px' }}>
                <StatusLabel text={product.category} type="featured" />
              </span>
              {product.images && product.images[activeImgIndex] && product.images[activeImgIndex] !== "product" ? (
                <img 
                  src={product.images[activeImgIndex]} 
                  alt={product.name} 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--color-muted)' }}>
                  <Icon name="camera" size={64} />
                  <span className="meta-style" style={{ fontSize: '11px', letterSpacing: '0.1em' }}>SURVEILLANCE CATALOG IMAGE</span>
                </div>
              )}
            </Card>

            {/* Thumbnail Navigation if multiple images */}
            {product.images && product.images.length > 1 && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImgIndex(idx)}
                    aria-label={`Thumbnail ${idx + 1}`}
                    style={{
                      width: '64px',
                      height: '64px',
                      padding: '4px',
                      borderRadius: 'var(--radius-card)',
                      border: activeImgIndex === idx ? '2px solid var(--color-gold)' : '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img src={img} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Product Content Details */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <span className="meta-style" style={{ textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
              {product.brand}
            </span>
            <h2 className="h2-style" style={{ fontSize: '28px', margin: '0 0 16px 0', lineHeight: '1.2' }}>
              {product.name}
            </h2>

            {/* Review and Rating jump link */}
            {reviewsEnabled && (
              <div 
                onClick={() => document.getElementById("reviews-section")?.scrollIntoView({ behavior: 'smooth' })}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px' }}
              >
                <StarRating rating={parseFloat(avgRating)} size={16} />
                <span className="h3-style" style={{ fontSize: '14px', margin: 0 }}>{avgRating}</span>
                <span className="meta-style">({localReviews.length} reviews)</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <StatusLabel 
                text={product.stock === "In Stock" ? "✓ In Stock" : "📞 Call for Availability"} 
                type={product.stock === "In Stock" ? "success" : "warning"} 
              />
              {product.best_for.map((t) => (
                <BestForTag key={t} tag={t} />
              ))}
            </div>

            <div className="price-style" style={{ fontSize: '24px', marginBottom: '16px' }}>
              {priceLabel}
            </div>

            {/* Truncated Product description */}
            <p className="body-style" style={{ color: 'var(--color-ink-soft)', marginBottom: '24px', lineHeight: '1.6' }}>
              {displayText}
              {isTruncated && (
                <button 
                  onClick={() => setShowFullDesc(!showFullDesc)} 
                  style={{ background: 'none', border: 'none', color: 'var(--color-gold)', fontWeight: 6, cursor: 'pointer', marginLeft: '6px', fontSize: '13px' }}
                >
                  {showFullDesc ? "Read less" : "Read more"}
                </button>
              )}
            </p>

            {/* Actions Block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <Button 
                variant="primary" 
                onClick={handleAddToCart}
                style={{ width: '100%', height: '48px', fontSize: '15px' }}
              >
                <Icon name="shoppingCart" size={16} color="white" /> Get Quote
              </Button>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button 
                  variant="secondary" 
                  onClick={() => window.open(`https://wa.me/${siteConfig.whatsappNumber}?text=Hi, I'm interested in the ${product.name}`, "_blank")}
                  style={{ flex: 1, height: '40px', backgroundColor: 'var(--whatsapp)', color: 'white', border: 'none' }}
                >
                  <WhatsAppIcon size={14} /> WhatsApp
                </Button>

                <Button 
                  variant="ghost" 
                  onClick={toggleCompare}
                  style={{ flex: 1, height: '40px' }}
                >
                  {isCompared ? <Icon name="check" size={14} color="var(--color-success)" /> : <Icon name="plus" size={14} />} 
                  {isCompared ? "In Compare" : "Compare"}
                </Button>
              </div>
            </div>

            {/* Contact details Card */}
            <Card style={{ padding: '16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="meta-style" style={{ fontWeight: 6, textTransform: 'uppercase', marginBottom: '8px' }}>Store & Setup Details</div>
              <div className="body-style" style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--color-ink-soft)' }}>
                <span>📍 {siteConfig.address.line2}</span>
                <span>📞 {siteConfig.phoneNumber}</span>
                <span>🕐 {siteConfig.hours.weekday}</span>
                <span>⚡ Custom installation services available locally</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Specifications Section */}
        <div style={{ marginBottom: '48px' }}>
          <h3 className="h2-style" style={{ fontSize: '20px', marginBottom: '16px' }}>Specifications</h3>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            {[
              ["overview", "Overview"],
              ["specs", "Detailed Specs"],
              ["inventory", "Inventory"],
            ].map(([key, label]) => (
              <Button
                key={key}
                variant={activeSpecTab === key ? "primary" : "ghost"}
                onClick={() => { setActiveSpecTab(key); setShowAllSpecs(false); }}
                style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }}
              >
                {label}
              </Button>
            ))}
          </div>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
              <tbody>
                {Object.entries(activeSpecs).slice(0, showAllSpecs ? undefined : 10).map(([k, v], idx) => (
                  <tr key={k} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--color-bg)' }}>
                    <td className="h3-style" style={{ padding: '12px', fontSize: '13px', width: '35%', fontWeight: 5, color: 'var(--color-muted)' }}>{k}</td>
                    <td className="body-style" style={{ padding: '12px', fontSize: '13px', color: 'var(--color-ink)' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          
          {Object.entries(activeSpecs).length > 10 && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Button
                variant="ghost"
                onClick={() => setShowAllSpecs(!showAllSpecs)}
                style={{ fontSize: '13px', color: 'var(--color-gold)', fontWeight: 6, display: 'inline-flex', alignItems: 'center', gap: '4px', height: 'auto', padding: '8px 16px', border: 'none', background: 'transparent' }}
              >
                <Icon name={showAllSpecs ? "chevronUp" : "chevronDown"} size={14} />
                {showAllSpecs ? "Read Less Specifications" : `Read More Specifications (${Object.entries(activeSpecs).length - 10} more)`}
              </Button>
            </div>
          )}
        </div>

        {/* Similar / Related Products */}
        {related.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="h2-style" style={{ fontSize: '20px', margin: 0 }}>Similar Products</h3>
                <p className="meta-style" style={{ marginTop: '2px', marginBottom: 0 }}>Alternative surveillance equipment recommendations</p>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => navigate(`/category/${product.category?.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`)}
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                View Category <Icon name="chevronRight" size={12} />
              </Button>
            </div>

            <div className="scroll-strip" style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px' }}>
              {related.map((p) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  onView={() => { navigate(`/product/${p.id}`); window.scrollTo(0, 0); }} 
                  compareList={compareList} 
                  onCompare={toggleCompareProduct} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Matching Bundles */}
        {matchingBundles.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <h3 className="h2-style" style={{ fontSize: '20px', marginBottom: '16px' }}>Available in Packages</h3>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {matchingBundles.map((b) => (
                <Card key={b.id} style={{ padding: '20px', flex: 1, minWidth: '260px' }}>
                  <div className="h3-style" style={{ fontSize: '15px', marginBottom: '4px' }}>{b.name}</div>
                  <div className="meta-style" style={{ marginBottom: '12px' }}>{b.components.length} components included</div>
                  <div className="price-style" style={{ fontSize: '20px', marginBottom: '16px' }}>₹{b.total_price.toLocaleString("en-IN")}</div>
                  <Button 
                    variant="secondary"
                    onClick={() => window.open(`https://wa.me/${siteConfig.whatsappNumber}?text=Hi, I'm interested in the package: ${b.name}`, "_blank")}
                    style={{ width: '100%', height: '36px', fontSize: '12px', backgroundColor: 'var(--whatsapp)', color: 'white', border: 'none' }}
                  >
                    <WhatsAppIcon size={12} /> Enquire Package
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section Area */}
        {reviewsEnabled && (
          <div id="reviews-section" style={{ marginBottom: '64px', borderTop: '1px solid var(--color-border)', paddingTop: '40px' }}>
            <h3 className="h2-style" style={{ fontSize: '20px', marginBottom: '24px' }}>Customer Reviews</h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '24px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              padding: '24px',
              marginBottom: '32px'
            }}>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '48px', fontWeight: 7, color: 'var(--color-ink)', lineHeight: 1 }}>{avgRating}</div>
                <div style={{ margin: '8px 0' }}>
                  <StarRating rating={parseFloat(avgRating)} size={16} />
                </div>
                <div className="meta-style">{localReviews.length} reviews total</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                {ratingBars.map(({ star, count, pct }) => (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="meta-style" style={{ width: '12px', textAlign: 'right' }}>{star}</span>
                    <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--color-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--color-gold)' }} />
                    </div>
                    <span className="meta-style" style={{ width: '24px' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* List of Reviews */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {localReviews.length === 0 ? (
                <div className="meta-style" style={{ textAlign: 'center', padding: '32px' }}>
                  No reviews submitted yet. Be the first to share your experience!
                </div>
              ) : (
                localReviews.map((rev) => {
                  const isMyReview = user && rev.customerId === user.id;
                  return (
                    <Card key={rev.id} style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span className="h3-style" style={{ fontSize: '14px', margin: 0 }}>{rev.reviewer_name}</span>
                            {rev.is_verified && (
                              <StatusLabel text="Verified Buyer" type="success" />
                            )}
                            {isMyReview && !editingReviewId && (
                              <Button 
                                variant="ghost"
                                onClick={() => {
                                  setEditingReviewId(rev.id);
                                  setEditForm({ rating: rev.rating, text: rev.review_text });
                                }}
                                style={{ padding: '2px 8px', fontSize: '11px', height: '24px' }}
                              >
                                <Icon name="edit" size={10} /> Edit
                              </Button>
                            )}
                          </div>
                          <div style={{ marginTop: '4px' }}>
                            <StarRating rating={rev.rating} size={12} />
                          </div>
                        </div>
                        <span className="meta-style">{timeAgo(rev.created_at)}</span>
                      </div>

                      {/* Edit Review Form Area */}
                      {editingReviewId === rev.id ? (
                        <Card style={{ padding: '16px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                          <div style={{ marginBottom: '12px' }}>
                            <label className="meta-style" style={{ fontWeight: 6, display: 'block', marginBottom: '6px' }}>Rating</label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <span 
                                  key={s} 
                                  onMouseEnter={() => setEditHoverStar(s)} 
                                  onMouseLeave={() => setEditHoverStar(0)} 
                                  onClick={() => setEditForm({ ...editForm, rating: s })}
                                  style={{ 
                                    fontSize: '20px', 
                                    cursor: 'pointer',
                                    color: s <= (editHoverStar || editForm.rating) ? 'var(--color-gold)' : 'var(--color-border)'
                                  }}
                                  role="button"
                                  tabIndex={0}
                                  aria-label={`Rate ${s}`}
                                >★</span>
                              ))}
                            </div>
                          </div>
                          <div style={{ marginBottom: '16px' }}>
                            <label className="meta-style" style={{ fontWeight: 6, display: 'block', marginBottom: '6px' }}>Your Review</label>
                            <Textarea 
                              rows={3} 
                              value={editForm.text} 
                              onChange={(e) => setEditForm({ ...editForm, text: e.target.value.slice(0, 500) })} 
                              style={{ fontSize: '13px' }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Button 
                              variant="primary" 
                              onClick={() => {
                                if (editForm.rating === 0) { showToast("Please select a rating"); return; }
                                if (editForm.text.length < 10) { showToast("Review must be at least 10 characters"); return; }
                                editMutation.mutate({ reviewId: rev.id, data: { rating: editForm.rating, reviewText: editForm.text } });
                              }}
                              disabled={editMutation.isPending}
                              style={{ padding: '4px 12px', fontSize: '12px' }}
                            >
                              {editMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button 
                              variant="ghost" 
                              onClick={() => setEditingReviewId(null)}
                              style={{ padding: '4px 12px', fontSize: '12px' }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </Card>
                      ) : (
                        <>
                          <p className="body-style" style={{ color: 'var(--color-ink-soft)', lineHeight: '1.6', margin: '0 0 12px 0' }}>
                            {rev.review_text}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="meta-style" style={{ fontSize: '11px' }}>Helpful?</span>
                            <Button 
                              variant="ghost" 
                              onClick={() => voteHelpful(rev.id, "helpful_yes")} 
                              aria-label={`Helpful. ${rev.helpful_yes} votes`}
                              style={{ padding: '2px 8px', fontSize: '11px', height: '24px' }}
                            >
                              <Icon name="thumbsUp" size={10} /> {rev.helpful_yes}
                            </Button>
                            <Button 
                              variant="ghost" 
                              onClick={() => voteHelpful(rev.id, "helpful_no")} 
                              aria-label={`Unhelpful. ${rev.helpful_no} votes`}
                              style={{ padding: '2px 8px', fontSize: '11px', height: '24px' }}
                            >
                              <Icon name="thumbsDown" size={10} /> {rev.helpful_no}
                            </Button>
                          </div>
                        </>
                      )}
                    </Card>
                  );
                })
              )}
            </div>

            {/* Write a New Review Form */}
            <Card style={{ padding: '24px' }}>
              <div className="h3-style" style={{ fontSize: '16px', marginBottom: '16px' }}>Write a Review</div>
              {user ? (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label className="meta-style" style={{ fontWeight: 6, display: 'block', marginBottom: '6px' }}>Your Name</label>
                    <Input value={user.name} readOnly style={{ backgroundColor: 'var(--color-bg)', cursor: 'not-allowed' }} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label className="meta-style" style={{ fontWeight: 6, display: 'block', marginBottom: '6px' }}>Rating</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span 
                          key={s} 
                          onMouseEnter={() => setHoverStar(s)} 
                          onMouseLeave={() => setHoverStar(0)} 
                          onClick={() => setForm({ ...form, rating: s })}
                          style={{ 
                            fontSize: '24px', 
                            cursor: 'pointer',
                            color: s <= (hoverStar || form.rating) ? 'var(--color-gold)' : 'var(--color-border)'
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`Rate ${s}`}
                        >★</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label className="meta-style" style={{ fontWeight: 6, display: 'block', marginBottom: '6px' }}>Review Message</label>
                    <Textarea 
                      rows={4} 
                      placeholder="Share your experience with this product (min 10 characters)" 
                      value={form.text} 
                      onChange={(e) => setForm({ ...form, text: e.target.value.slice(0, 500) })} 
                    />
                    <div className="meta-style" style={{ textAlign: 'right', marginTop: '4px', fontSize: '11px' }}>{form.text.length} / 500</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Button 
                      variant="primary" 
                      onClick={handleSubmitReview} 
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending ? "Submitting..." : "Submit Review"}
                    </Button>
                    <span className="meta-style" style={{ fontSize: '12px' }}>Reviews are published instantly!</span>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', backgroundColor: 'var(--color-bg)', padding: '16px', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
                    <Icon name="user" size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="h3-style" style={{ fontSize: '14px', margin: 0 }}>Please login to submit a review</div>
                    <div className="meta-style" style={{ margin: 0 }}>Your review will be securely linked to your account profile.</div>
                  </div>
                  <Button variant="primary" onClick={() => login(location.pathname + location.search)}>Login to Review</Button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Mobile Sticky CTA bar */}
      {showStickyBar && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1000,
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="meta-style" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Price</span>
            <span className="price-style" style={{ fontSize: '16px' }}>{priceLabel}</span>
          </div>
          <Button 
            variant="primary" 
            onClick={handleAddToCart}
            style={{ height: '40px', padding: '0 24px', fontSize: '13px' }}
          >
            Get Quote
          </Button>
        </div>
      )}

      <Footer />
    </main>
  );
}
