import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  DigitronLoader, 
  Icon, 
  StarRating,
  Button,
  Card,
  StatusLabel,
  Input,
  Select
} from "../components/ui";
import { Footer } from "../components/layout";
import {
  addAddress,
  deleteAddress,
  fetchProductById,
  getMyReviews,
  getMyQuotes,
  getProfile,
  getWishlist,
  toggleWishlist,
  updateProfile,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const TABS = [
  ["history", "Request History"],
  ["overview", "Overview"],
  ["reviews", "My Reviews"],
  ["wishlist", "Wishlist"],
  ["addresses", "Saved Addresses"],
  ["settings", "Account Settings"],
];

export default function ProfilePage({ showToast }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading, logout, refetch } = useAuth();
  const { cartCount, addToCart } = useCart();
  const [activeTab, setActiveTab] = useState("history");
  const [name, setName] = useState("");
  const [addressForm, setAddressForm] = useState({ label: "Home", line1: "", line2: "", city: "", state: "", pincode: "", phone: "" });

  useEffect(() => {
    document.title = "My Profile | Digitron Associates";
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [loading, user, navigate]);

  useEffect(() => {
    let active = true;
    if (user) {
      Promise.resolve().then(() => {
        if (active) setName(user.name || "");
      });
    }
    return () => {
      active = false;
    };
  }, [user]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["customer-profile"],
    queryFn: getProfile,
    enabled: !!user
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ["wishlist"],
    queryFn: getWishlist,
    enabled: !!user
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["my-reviews"],
    queryFn: getMyReviews,
    enabled: !!user
  });

  const { data: quoteHistory = [], isLoading: quotesLoading } = useQuery({
    queryKey: ["my-quotes"],
    queryFn: getMyQuotes,
    enabled: !!user
  });

  const wishlistQueries = useQueries({
    queries: wishlist.map((productId) => ({
      queryKey: ["product", productId],
      queryFn: () => fetchProductById(productId),
      enabled: !!user
    }))
  });

  const wishlistProducts = useMemo(
    () => wishlistQueries.map((query) => query.data).filter(Boolean),
    [wishlistQueries]
  );

  const saveProfileMutation = useMutation({
    mutationFn: () => updateProfile({ name }),
    onSuccess: async () => {
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["customer-profile"] });
      showToast("Profile updated successfully!");
    },
    onError: () => showToast("Could not update profile.")
  });

  const addressMutation = useMutation({
    mutationFn: addAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-profile"] });
      setAddressForm({ label: "Home", line1: "", line2: "", city: "", state: "", pincode: "", phone: "" });
      showToast("Address saved");
    },
    onError: (err) => showToast(err.message || "Could not save address.")
  });

  const deleteAddressMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-profile"] });
      showToast("Address removed");
    }
  });

  const wishlistMutation = useMutation({
    mutationFn: toggleWishlist,
    onSuccess: (data) => {
      queryClient.setQueryData(["wishlist"], data.wishlist || []);
      showToast("Wishlist updated");
    }
  });

  if (loading || profileLoading || !user) {
    return (
      <div className="page">
        <DigitronLoader label="loading profile" />
      </div>
    );
  }

  const addresses = profile?.addresses || [];
  const initials = (user.name || "U").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="page" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="section-wrap" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
        {/* Split Grid Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '32px',
          alignItems: 'flex-start'
        }}>
          {/* Column 1: Left Profile Card / Sidebar */}
          <Card style={{ padding: '24px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--color-gold-dark)', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 6,
                overflow: 'hidden',
                marginBottom: '12px',
                border: '3px solid var(--color-gold)'
              }}>
                {user.avatar ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
              </div>
              <h2 className="h3-style" style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{user.name}</h2>
              <span className="meta-style" style={{ fontSize: '12px' }}>{user.email}</span>

              <Button 
                variant="ghost" 
                onClick={logout} 
                style={{ marginTop: '16px', color: 'var(--color-danger)', borderColor: 'var(--color-border)', height: '36px', padding: '0 16px' }}
              >
                <Icon name="logOut" size={13} /> Logout
              </Button>
            </div>

            {/* Sidebar Navigation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
              {TABS.map(([key, label]) => (
                <Button
                  key={key}
                  variant={activeTab === key ? "primary" : "ghost"}
                  onClick={() => setActiveTab(key)}
                  style={{ justifyContent: 'flex-start', textAlign: 'left', height: '36px', padding: '0 12px' }}
                >
                  {label}
                </Button>
              ))}
            </div>
          </Card>

          {/* Column 2: Right Main Details Panel */}
          <div style={{ flexGrow: 2 }}>
            {/* Tab: Request History */}
            {activeTab === "history" && (
              <div>
                <h2 className="h2-style" style={{ fontSize: '20px', marginTop: 0, marginBottom: '20px' }}>Request History</h2>
                {quotesLoading ? (
                  <DigitronLoader label="loading history" />
                ) : quoteHistory.length === 0 ? (
                  <Card style={{ padding: '32px', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                    <Icon name="fileText" size={40} color="var(--color-muted)" />
                    <h3 className="h3-style" style={{ margin: '12px 0 4px 0' }}>No requests yet</h3>
                    <p className="meta-style" style={{ marginBottom: '20px' }}>You haven't submitted any quote requests yet.</p>
                    <Button variant="primary" onClick={() => navigate("/")}>Browse Products</Button>
                  </Card>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {quoteHistory.map((quote) => {
                      const statusType = quote.status === "Pending" ? "warning" : quote.status === "Approved" ? "success" : "info";
                      return (
                        <Card key={quote.id} style={{ padding: '20px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                              <span className="meta-style" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Quote ID</span>
                              <div className="h3-style" style={{ fontSize: '13px', margin: 0 }}>#{quote.id.slice(-8).toUpperCase()}</div>
                            </div>
                            <div>
                              <span className="meta-style" style={{ fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>Date</span>
                              <span className="body-style" style={{ fontSize: '13px' }}>{new Date(quote.createdAt).toLocaleDateString("en-IN")}</span>
                            </div>
                            <StatusLabel text={quote.status} type={statusType} />
                          </div>

                          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                            <span className="meta-style" style={{ fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Requested Items</span>
                            <ul style={{ margin: 0, paddingLeft: '16px', listStyleType: 'disc' }}>
                              {Array.isArray(quote.items) ? (
                                quote.items.map((item, idx) => (
                                  <li key={idx} className="body-style" style={{ fontSize: '13px', marginBottom: '4px' }}>
                                    <strong>{item.name}</strong> × {item.qty}
                                  </li>
                                ))
                              ) : (
                                <li className="body-style" style={{ fontSize: '13px' }}>{JSON.stringify(quote.items)}</li>
                              )}
                            </ul>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Overview */}
            {activeTab === "overview" && (
              <div>
                <Card style={{ padding: '24px', marginBottom: '24px', border: '1px solid var(--color-border)' }}>
                  <h2 className="h2-style" style={{ fontSize: '20px', marginTop: 0 }}>Hello, {user.name}!</h2>
                  <p className="body-style" style={{ color: 'var(--color-ink-soft)', margin: 0 }}>Welcome to your Digitron account dashboard. Here you can view your wishlist, address book, and review status.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginTop: '24px' }}>
                    <Card style={{ padding: '16px', textAlign: 'center', backgroundColor: 'var(--color-bg)' }}>
                      <div style={{ fontSize: '24px', fontWeight: 7, color: 'var(--color-gold)' }}>{cartCount}</div>
                      <span className="meta-style" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Items in Cart</span>
                    </Card>
                    <Card style={{ padding: '16px', textAlign: 'center', backgroundColor: 'var(--color-bg)' }}>
                      <div style={{ fontSize: '24px', fontWeight: 7, color: 'var(--color-gold)' }}>{wishlist.length}</div>
                      <span className="meta-style" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Saved Items</span>
                    </Card>
                    <Card style={{ padding: '16px', textAlign: 'center', backgroundColor: 'var(--color-bg)' }}>
                      <div style={{ fontSize: '24px', fontWeight: 7, color: 'var(--color-gold)' }}>{reviews.length}</div>
                      <span className="meta-style" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Reviews</span>
                    </Card>
                  </div>
                </Card>

                <h3 className="h3-style" style={{ fontSize: '16px', marginBottom: '12px' }}>Recent Activity</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {wishlistProducts.slice(0, 3).map((product) => (
                    <Card key={product.id} interactive style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => navigate(`/product/${product.id}`)}>
                      <span className="body-style" style={{ fontSize: '13px' }}>Saved product: {product.name}</span>
                      <Icon name="chevronRight" size={14} color="var(--color-muted)" />
                    </Card>
                  ))}
                  {reviews.slice(0, 2).map((review) => (
                    <Card key={`${review.productId}-${review.createdAt}`} interactive style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => navigate(`/product/${review.productId}`)}>
                      <span className="body-style" style={{ fontSize: '13px' }}>Reviewed product: {review.productName}</span>
                      <Icon name="chevronRight" size={14} color="var(--color-muted)" />
                    </Card>
                  ))}
                  {wishlist.length === 0 && reviews.length === 0 && (
                    <p className="meta-style">No recent activities log yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Reviews */}
            {activeTab === "reviews" && (
              <div>
                <h2 className="h2-style" style={{ fontSize: '20px', marginTop: 0, marginBottom: '20px' }}>My Reviews</h2>
                {reviews.length === 0 ? (
                  <Card style={{ padding: '32px', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                    <Icon name="messageSquare" size={40} color="var(--color-muted)" />
                    <h3 className="h3-style" style={{ margin: '12px 0 4px 0' }}>No reviews yet</h3>
                    <p className="meta-style" style={{ marginBottom: '20px' }}>Write a review on any purchased product.</p>
                    <Button variant="primary" onClick={() => navigate("/")}>Browse Products</Button>
                  </Card>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reviews.map((review) => (
                      <Card key={`${review.productId}-${review.createdAt}`} style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span 
                            onClick={() => navigate(`/product/${review.productId}`)}
                            style={{ fontWeight: 6, color: 'var(--color-gold-dark)', cursor: 'pointer', fontSize: '14px' }}
                          >
                            {review.productName}
                          </span>
                          <span className="meta-style">{new Date(review.createdAt).toLocaleDateString("en-IN")}</span>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <StarRating rating={review.rating} size={12} />
                        </div>
                        <p className="body-style" style={{ fontSize: '13px', margin: 0, color: 'var(--color-ink-soft)' }}>{review.text}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Wishlist */}
            {activeTab === "wishlist" && (
              <div>
                <h2 className="h2-style" style={{ fontSize: '20px', marginTop: 0, marginBottom: '20px' }}>My Wishlist</h2>
                {wishlistProducts.length === 0 ? (
                  <Card style={{ padding: '32px', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                    <Icon name="heart" size={40} color="var(--color-muted)" />
                    <h3 className="h3-style" style={{ margin: '12px 0 4px 0' }}>Wishlist is empty</h3>
                    <p className="meta-style" style={{ marginBottom: '20px' }}>Save items from the catalog for quick quote requests.</p>
                    <Button variant="primary" onClick={() => navigate("/")}>Browse Products</Button>
                  </Card>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    {wishlistProducts.map((product) => (
                      <Card key={product.id} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px', border: '1px solid var(--color-border)' }}>
                        <div style={{ 
                          width: '100%', 
                          height: '120px', 
                          backgroundColor: 'white', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          padding: '8px',
                          borderRadius: 'var(--radius-card)',
                          border: '1px solid var(--color-border)',
                          marginBottom: '12px'
                        }}>
                          {product.images && product.images[0] && product.images[0] !== "product" ? (
                            <img src={product.images[0]} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                          ) : (
                            <Icon name="camera" size={32} color="var(--color-muted)" />
                          )}
                        </div>
                        <h3 className="h3-style" style={{ fontSize: '13px', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {product.name}
                        </h3>
                        <span className="meta-style" style={{ fontSize: '11px', marginBottom: '12px' }}>{product.category}</span>
                        
                        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                          <Button variant="ghost" onClick={() => navigate(`/product/${product.id}`)} style={{ padding: 0, flex: 1, height: '32px', fontSize: '11px' }}>
                            View
                          </Button>
                          <Button variant="primary" onClick={() => addToCart(product.id).then(() => showToast("Added to quote request basket!"))} style={{ padding: 0, flex: 1, height: '32px', fontSize: '11px' }}>
                            Add
                          </Button>
                          <Button variant="ghost" onClick={() => wishlistMutation.mutate(product.id)} style={{ padding: 0, width: '32px', height: '32px', minWidth: 'auto', color: 'var(--color-danger)' }}>
                            <Icon name="heart" size={12} />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Addresses */}
            {activeTab === "addresses" && (
              <div>
                <h2 className="h2-style" style={{ fontSize: '20px', marginTop: 0, marginBottom: '20px' }}>Saved Addresses</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  {addresses.map((address, index) => (
                    <Card key={`${address.label}-${index}`} style={{ padding: '16px', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <strong className="h3-style" style={{ fontSize: '13px' }}>{address.label}</strong>
                        <Button 
                          variant="ghost" 
                          onClick={() => deleteAddressMutation.mutate(index)}
                          style={{ padding: 0, width: '24px', height: '24px', minWidth: 'auto', color: 'var(--color-danger)' }}
                        >
                          <Icon name="trash" size={12} />
                        </Button>
                      </div>
                      <p className="body-style" style={{ fontSize: '12px', margin: '0 0 6px 0', color: 'var(--color-ink-soft)', lineHeight: '1.4' }}>
                        {address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} - {address.pincode}
                      </p>
                      <span className="meta-style" style={{ fontSize: '11px' }}>📞 {address.phone}</span>
                    </Card>
                  ))}
                </div>

                {addresses.length < 5 && (
                  <Card style={{ padding: '20px', border: '1px solid var(--color-border)' }}>
                    <h3 className="h3-style" style={{ fontSize: '15px', marginBottom: '16px' }}>Add a New Address</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                        <Select 
                          value={addressForm.label} 
                          onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                        >
                          <option>Home</option>
                          <option>Work</option>
                          <option>Other</option>
                        </Select>
                        <Input 
                          placeholder="Phone Number" 
                          value={addressForm.phone} 
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} 
                        />
                      </div>
                      <Input 
                        placeholder="Address Line 1" 
                        value={addressForm.line1} 
                        onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })} 
                      />
                      <Input 
                        placeholder="Address Line 2 (Optional)" 
                        value={addressForm.line2} 
                        onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })} 
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <Input 
                          placeholder="City" 
                          value={addressForm.city} 
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} 
                        />
                        <Input 
                          placeholder="State" 
                          value={addressForm.state} 
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} 
                        />
                        <Input 
                          placeholder="Pincode" 
                          value={addressForm.pincode} 
                          onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} 
                        />
                      </div>
                      <Button variant="primary" onClick={() => addressMutation.mutate(addressForm)} style={{ height: '36px', marginTop: '4px' }}>
                        Add Address
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Tab: Settings */}
            {activeTab === "settings" && (
              <div>
                <h2 className="h2-style" style={{ fontSize: '20px', marginTop: 0, marginBottom: '20px' }}>Account Settings</h2>
                <Card style={{ padding: '24px', border: '1px solid var(--color-border)', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label className="meta-style" style={{ fontWeight: 6, display: 'block', marginBottom: '6px' }}>Full Name</label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                      <label className="meta-style" style={{ fontWeight: 6, display: 'block', marginBottom: '6px' }}>Email Address</label>
                      <Input value={user.email} readOnly style={{ backgroundColor: 'var(--color-bg)', cursor: 'not-allowed' }} />
                    </div>
                    <Button 
                      variant="primary" 
                      onClick={() => saveProfileMutation.mutate()} 
                      disabled={saveProfileMutation.isPending}
                      style={{ height: '40px', marginTop: '8px' }}
                    >
                      {saveProfileMutation.isPending ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </Card>

                <Card style={{ padding: '20px', border: '1px solid var(--color-danger)', backgroundColor: 'var(--color-danger-bg)' }}>
                  <h3 className="h3-style" style={{ fontSize: '15px', color: 'var(--color-danger)', marginTop: 0, marginBottom: '8px' }}>Danger Zone</h3>
                  <p className="body-style" style={{ fontSize: '13px', color: 'var(--color-danger)', marginBottom: '16px' }}>
                    Logging out will clear your current local session. Your saved quotes, wishlist, and addresses will remain safe in the cloud.
                  </p>
                  <Button variant="ghost" onClick={logout} style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', height: '36px' }}>
                    Logout from Device
                  </Button>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
