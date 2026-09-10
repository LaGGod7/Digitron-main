import { useState, useEffect } from "react";
import { Icon, Input, Select, Textarea, Button, Card } from "../components/ui";
import { Footer } from "../components/layout";
import { useMutation } from '@tanstack/react-query';
import { submitQuoteRequest } from '../services/api';
import products from "../data/products";
import siteConfig from "../data/siteConfig";

export default function ContactPage({ showToast }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", product: "", message: "" });

  useEffect(() => {
    document.title = "Contact Us | Digitron Associates";
  }, []);
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: (data) => submitQuoteRequest(data),
    onSuccess: () => {
      setForm({ name: "", phone: "", email: "", product: "", message: "" });
      showToast("Enquiry sent! We'll contact you shortly.");
    },
    onError: () => showToast("Failed to send enquiry. Please try again.")
  });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.match(/^[6-9]\d{9}$/)) e.phone = "Enter a valid 10-digit Indian mobile number";
    if (form.message.length < 10) e.message = "Please describe your requirements (min 10 chars)";
    return e;
  };

  const submit = () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    
    mutation.mutate({
      customerName: form.name,
      customerPhone: form.phone,
      items: [{ name: form.product || "General Enquiry", message: form.message, customerEmail: form.email }]
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-inner">
          <div className="page-header-label">Get in touch</div>
          <h1 className="page-header-title">Contact & Request Quote</h1>
        </div>
      </div>
      <div className="contact-page">
        <div className="contact-grid">
          <Card className="contact-form-wrap" style={{ padding: 48 }}>
            <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 20 }}>Send Enquiry</h2>
            
            <Input
              label="Full Name *"
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Phone Number *"
                placeholder="10-digit mobile"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                error={errors.phone}
              />
              <Input
                label="Email (optional)"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <Select
              label="Product of Interest"
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
            >
              <option value="">Select a product...</option>
              {products.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
              <option value="bundle_home">Package: Home Security Starter Kit</option>
              <option value="bundle_shop">Package: Shop Security Pro Kit</option>
              <option value="bundle_parking">Package: Parking & Perimeter Kit</option>
            </Select>

            <Textarea
              label="Message / Requirements *"
              rows={5}
              placeholder="Describe your security requirements, premises size, number of cameras needed, etc."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              error={errors.message}
            />

            <Button 
              variant="primary" 
              style={{ padding: "12px 32px", fontSize: 14 }} 
              onClick={submit} 
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Sending..." : "Send Enquiry"}
            </Button>
          </Card>

          <div className="contact-info-wrap">
            <Card className="contact-info-card" interactive>
              <div className="contact-info-icon"><Icon name="mapPin" size={20} color="var(--gold)" /></div>
              <div>
                <div className="contact-info-title">Store Address</div>
                <div className="contact-info-text">{siteConfig.address.line1}<br />{siteConfig.address.line2}<br />{siteConfig.address.state}</div>
              </div>
            </Card>
            <Card className="contact-info-card" interactive onClick={() => window.open(`https://wa.me/${siteConfig.whatsappNumber}`, "_blank")}>
              <div className="contact-info-icon"><Icon name="phone" size={20} color="var(--gold)" /></div>
              <div>
                <div className="contact-info-title">Phone & WhatsApp</div>
                <div className="contact-info-text">
                  {siteConfig.phoneNumber}<br />
                  <span style={{ color: "var(--whatsapp)", cursor: "pointer" }}>Chat on WhatsApp →</span>
                </div>
              </div>
            </Card>
            <Card className="contact-info-card">
              <div className="contact-info-icon"><Icon name="clock" size={20} color="var(--gold)" /></div>
              <div>
                <div className="contact-info-title">Business Hours</div>
                <div className="contact-info-text">{siteConfig.hours.weekday}<br />{siteConfig.hours.weekend}<br />Public holidays may vary</div>
              </div>
            </Card>
            <Card className="contact-info-card">
              <div className="contact-info-icon"><Icon name="mail" size={20} color="var(--gold)" /></div>
              <div>
                <div className="contact-info-title">Email</div>
                <div className="contact-info-text">{siteConfig.email}<br />{siteConfig.salesEmail}</div>
              </div>
            </Card>
            <Card className="map-placeholder" style={{ justifyContent: "center" }}>
              <Icon name="mapPin" size={24} color="var(--light-gray)" />
              <span>Google Maps Embed</span>
              <span style={{ fontSize: 10 }}>Add your Google Maps embed code here</span>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
