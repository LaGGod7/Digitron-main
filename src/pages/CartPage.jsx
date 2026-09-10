import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueries, useMutation } from "@tanstack/react-query";
import { 
  DigitronLoader, 
  Icon, 
  Button, 
  Card, 
  Input, 
  Textarea, 
  WhatsAppIcon 
} from "../components/ui";
import { Footer } from "../components/layout";
import { fetchProductById, submitQuoteRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import siteConfig from "../data/siteConfig";

export default function CartPage({ showToast }) {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { cartItems, cartCount, loading, updateQty, removeFromCart, clearCart } = useCart();

  useEffect(() => {
    document.title = "My Quote Basket | Digitron Associates";
  }, []);

  const [formData, setFormData] = useState({
    contactName: user?.name || "",
    phone: "",
    address: "",
    installationDate: "",
    message: ""
  });

  // Sync user name when user loads
  useEffect(() => {
    if (user?.name) {
      const timer = setTimeout(() => {
        setFormData(prev => ({ ...prev, contactName: prev.contactName || user.name || "" }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const productQueries = useQueries({
    queries: cartItems.map((item) => ({
      queryKey: ["product", item.productId],
      queryFn: () => fetchProductById(item.productId),
      enabled: !!user && !!item.productId,
    }))
  });

  const productsById = useMemo(() => {
    const map = new Map();
    productQueries.forEach((query) => {
      if (query.data) map.set(query.data.id, query.data);
    });
    return map;
  }, [productQueries]);

  const quoteMutation = useMutation({
    mutationFn: () => submitQuoteRequest({
      customerName: formData.contactName,
      customerPhone: formData.phone,
      items: cartItems.map((item) => {
        const product = productsById.get(item.productId);
        return {
          id: item.productId,
          name: product?.name || item.productId,
          qty: item.quantity,
          customerEmail: user?.email,
          message: `Address: ${formData.address} | Install Date: ${formData.installationDate} | Message: ${formData.message}`
        };
      })
    }),
    onSuccess: () => {
      showToast("Quote request submitted successfully!");
      clearCart();
    },
    onError: () => showToast("Could not submit quote request. Try again.")
  });

  const openWhatsAppOrder = () => {
    const lines = cartItems.map((item, index) => {
      const product = productsById.get(item.productId);
      return `${index + 1}. ${product?.name || item.productId} - Qty: ${item.quantity}`;
    });
    const message = `Hi, I want to request a CCTV quote for:\n\n${lines.join("\n")}\n\nName: ${formData.contactName}\nPhone: ${formData.phone}\nAddress: ${formData.address}\nInstall Date: ${formData.installationDate}`;
    window.open(`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.contactName) { showToast("Contact name is required"); return; }
    if (!formData.phone) { showToast("Phone number is required"); return; }
    quoteMutation.mutate();
  };

  if (!user) {
    return (
      <main className="page" style={{ backgroundColor: 'var(--color-bg)' }} aria-label="Customer Cart Portal">
        <div className="section-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Icon name="shoppingCart" size={52} color="var(--color-gold)" />
            <h2 className="h2-style" style={{ margin: '16px 0 8px 0' }}>Your basket is empty</h2>
            <p className="body-style" style={{ marginBottom: '24px', color: 'var(--color-muted)' }}>Login to view your saved items.</p>
            <Button variant="primary" onClick={() => login("/cart")}>Login with Google</Button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (loading) {
    return (
      <main className="page" aria-label="Loading Cart">
        <DigitronLoader label="loading basket" />
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="page" style={{ backgroundColor: 'var(--color-bg)' }} aria-label="Empty Shopping Cart">
        <div className="section-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Icon name="shoppingCart" size={52} color="var(--color-gold)" />
            <h2 className="h2-style" style={{ margin: '16px 0 8px 0' }}>Your basket is empty</h2>
            <p className="body-style" style={{ marginBottom: '24px', color: 'var(--color-muted)' }}>Add security equipment from our catalog to request quotes.</p>
            <Button variant="primary" onClick={() => navigate("/")}>Browse Products</Button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="page" style={{ backgroundColor: 'var(--color-bg)' }} aria-label="Shopping Cart Page">
      <div className="section-wrap" style={{ paddingTop: '32px' }}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="meta-style" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Surveillance Catalog</span>
            <h1 className="h2-style" style={{ fontSize: '28px', margin: 0 }}>Review Your Quote List</h1>
          </div>
          <Button variant="ghost" onClick={clearCart} style={{ color: 'var(--color-danger)' }}>
            Clear Basket
          </Button>
        </div>

        {/* Two Column Cart Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1.2fr))',
          gap: '32px',
          alignItems: 'flex-start',
          marginBottom: '48px'
        }}>
          {/* Column 1: Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cartItems.map((item) => {
              const product = productsById.get(item.productId);
              const isPriceRequest = !(product?.price > 0);
              return (
                <Card 
                  key={item.productId} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '16px', 
                    gap: '16px',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: 'var(--radius-card)', 
                    border: '1px solid var(--color-border)', 
                    backgroundColor: 'var(--color-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    padding: '4px'
                  }}>
                    {product?.images && product.images[0] && product.images[0] !== "product" ? (
                      <img 
                        src={product.images[0]} 
                        alt={product?.name || "Product"} 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                      />
                    ) : (
                      <Icon name="package" size={24} color="var(--color-muted)" />
                    )}
                  </div>

                  {/* Main Details */}
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <h3 className="h3-style" style={{ margin: 0, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product?.name || "Loading surveillance model..."}
                    </h3>
                    <p className="meta-style" style={{ margin: '2px 0 0 0' }}>
                      {product?.brand || "Digitron brand"}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <Button 
                      variant="secondary" 
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      style={{ padding: 0, width: '28px', height: '28px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      aria-label="Decrease quantity"
                    >
                      <Icon name="minus" size={10} />
                    </Button>
                    <span className="body-style" style={{ fontSize: '13px', fontWeight: 6, width: '20px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <Button 
                      variant="secondary" 
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                      style={{ padding: 0, width: '28px', height: '28px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      aria-label="Increase quantity"
                    >
                      <Icon name="plus" size={10} />
                    </Button>
                  </div>

                  {/* Price */}
                  <div className="price-style" style={{ fontSize: '14px', width: '90px', textAlign: 'right', flexShrink: 0 }}>
                    {isPriceRequest ? "Call Price" : `Rs. ${(product.price * item.quantity).toLocaleString("en-IN")}`}
                  </div>

                  {/* Delete Button */}
                  <Button 
                    variant="ghost" 
                    onClick={() => removeFromCart(item.productId)}
                    style={{ padding: 0, width: '32px', height: '32px', minWidth: 'auto', color: 'var(--color-muted)' }}
                    aria-label="Remove item"
                  >
                    <Icon name="trash" size={14} />
                  </Button>
                </Card>
              );
            })}
          </div>

          {/* Column 2: Quote Submission Form */}
          <Card style={{ padding: '24px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h3 className="h3-style" style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="fileText" size={18} color="var(--color-gold)" /> Request Details
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="meta-style" style={{ fontWeight: 6, display: 'block', marginBottom: '6px' }}>Contact Name *</label>
                <Input 
                  value={formData.contactName} 
                  onChange={e => setFormData({ ...formData, contactName: e.target.value })} 
                  placeholder="Enter your full name" 
                  required 
                />
              </div>

              <div>
                <label className="meta-style" style={{ fontWeight: 6, display: 'block', marginBottom: '6px' }}>Phone Number *</label>
                <Input 
                  value={formData.phone} 
                  onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                  placeholder="Enter 10-digit mobile number" 
                  required 
                  type="tel"
                />
              </div>

              <div>
                <label className="meta-style" style={{ fontWeight: 6, display: 'block', marginBottom: '6px' }}>Delivery / Installation Address</label>
                <Textarea 
                  value={formData.address} 
                  onChange={e => setFormData({ ...formData, address: e.target.value })} 
                  placeholder="Enter full site setup address" 
                  rows={2}
                />
              </div>

              <div>
                <label className="meta-style" style={{ fontWeight: 6, display: 'block', marginBottom: '6px' }}>Preferred Installation Date</label>
                <Input 
                  value={formData.installationDate} 
                  onChange={e => setFormData({ ...formData, installationDate: e.target.value })} 
                  type="date" 
                />
              </div>

              <div>
                <label className="meta-style" style={{ fontWeight: 6, display: 'block', marginBottom: '6px' }}>Special Instructions / Requirements</label>
                <Textarea 
                  value={formData.message} 
                  onChange={e => setFormData({ ...formData, message: e.target.value })} 
                  placeholder="Add any specific requirements (e.g. wire length, brand preferences)" 
                  rows={3}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="body-style" style={{ fontWeight: 5 }}>Items Total</span>
                  <span className="body-style" style={{ fontWeight: 6 }}>{cartCount} products</span>
                </div>

                <Button 
                  type="submit" 
                  variant="primary" 
                  style={{ width: '100%', height: '44px' }}
                  disabled={quoteMutation.isPending}
                >
                  <Icon name="messageSquare" size={14} color="white" /> 
                  {quoteMutation.isPending ? "Submitting Quote..." : "Submit Quote Request"}
                </Button>

                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={openWhatsAppOrder}
                  style={{ width: '100%', height: '44px', backgroundColor: 'var(--whatsapp)', color: 'white', border: 'none' }}
                >
                  <WhatsAppIcon size={14} /> Submit via WhatsApp
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
      <Footer />
    </main>
  );
}
