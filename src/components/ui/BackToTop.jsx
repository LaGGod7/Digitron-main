import { useState, useEffect } from "react";
import Icon from "./Icon";

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: "fixed",
        bottom: "32px",
        left: "32px",
        zIndex: 500,
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background: "var(--obsidian, #0c0d10)",
        color: "var(--gold, #D4AF37)",
        border: "1px solid rgba(212, 175, 55, 0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        pointerEvents: isVisible ? "auto" : "none",
        transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = "var(--gold)";
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.3)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
      aria-label="Back to Top"
    >
      <div style={{ transform: "rotate(180deg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="chevronDown" size={20} />
      </div>
    </button>
  );
}
