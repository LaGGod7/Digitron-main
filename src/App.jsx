import React, { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Navbar, FloatingWhatsApp } from "./components/layout";
import { Toast, ErrorBoundary, DigitronLoader, BackToTop } from "./components/ui";
import { fetchSettings } from "./services/api";
import HomePage from "./pages/HomePage";

const CategoryPage = React.lazy(() => import("./pages/CategoryPage"));
const ProductDetailPage = React.lazy(() => import("./pages/ProductDetailPage"));
const PackagesPage = React.lazy(() => import("./pages/PackagesPage"));
const ComparePage = React.lazy(() => import("./pages/ComparePage"));
const ContactPage = React.lazy(() => import("./pages/ContactPage"));
const AdminPage = React.lazy(() => import("./pages/AdminPage"));
const CartPage = React.lazy(() => import("./pages/CartPage"));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));

import { useCart } from "./context/CartContext";
import "./styles/index.css";

export default function App() {
  const [compareList, setCompareList] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);
  const timerRef = useRef(null);
  const location = useLocation();
  const { cartCount } = useCart();

  const showToast = useCallback((msg) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToastMsg(msg);
    timerRef.current = setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;

    fetchSettings()
      .then((settings) => {
        const { features, ...configOverrides } = settings;
        const nextConfig = JSON.stringify(configOverrides);
        const nextReviews = features?.enableReviews ? 'true' : 'false';
        const nextCalculator = features?.enableCalculator ? 'true' : 'false';
        const hasChanged =
          localStorage.getItem('ae_site_config') !== nextConfig ||
          localStorage.getItem('ae_enable_reviews') !== nextReviews ||
          localStorage.getItem('ae_enable_calculator') !== nextCalculator;

        if (hasChanged) {
          localStorage.setItem('ae_site_config', nextConfig);
          localStorage.setItem('ae_enable_reviews', nextReviews);
          localStorage.setItem('ae_enable_calculator', nextCalculator);
          window.location.reload();
        }
      })
      .catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      document.documentElement.style.setProperty('--scroll-progress', '0%');
      return;
    }
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = totalScroll > 0 ? (window.scrollY / totalScroll) * 100 : 0;
      document.documentElement.style.setProperty('--scroll-progress', `${scrollProgress}%`);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAdmin, location.pathname]);

  return (
    <ErrorBoundary>
      {!isAdmin && <Navbar compareCount={compareList.length} cartCount={cartCount} />}
      <Suspense fallback={<DigitronLoader label="loading page" />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:slug" element={<CategoryPage compareList={compareList} setCompareList={setCompareList} showToast={showToast} />} />
          <Route path="/product/:id" element={<ProductDetailPage compareList={compareList} setCompareList={setCompareList} showToast={showToast} />} />
          <Route path="/packages" element={<PackagesPage showToast={showToast} />} />
          <Route path="/compare" element={<ComparePage compareList={compareList} setCompareList={setCompareList} />} />
          <Route path="/contact" element={<ContactPage showToast={showToast} />} />
          <Route path="/cart" element={<CartPage showToast={showToast} />} />
          <Route path="/profile" element={<ProfilePage showToast={showToast} />} />
          <Route path="/admin" element={<AdminPage showToast={showToast} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      {!isAdmin && <FloatingWhatsApp />}
      {!isAdmin && <BackToTop />}
      {toastMsg && <Toast message={toastMsg} />}
    </ErrorBoundary>
  );
}
