import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, Button } from "../components/ui";
import { Footer } from "../components/layout";

export default function NotFoundPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Page Not Found | Digitron Associates";
  }, []);

  return (
    <div className="page">
      <div style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center"
      }}>
        <div style={{
          background: "rgba(212, 175, 55, 0.05)",
          border: "1px solid rgba(212, 175, 55, 0.15)",
          borderRadius: "50%",
          width: "80px",
          height: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px"
        }}>
          <Icon name="alertTriangle" size={40} color="var(--gold)" />
        </div>

        <h1 style={{
          fontSize: "36px",
          fontWeight: 600,
          marginBottom: "12px",
          color: "var(--obsidian)"
        }}>404 - Page Not Found</h1>

        <p style={{
          fontSize: "15px",
          color: "var(--mid-gray)",
          maxWidth: "400px",
          lineHeight: 1.6,
          marginBottom: "32px"
        }}>
          Oops! The page you are looking for doesn't exist or has been moved to another URL.
        </p>

        <div style={{ display: "flex", gap: "12px" }}>
          <Button
            variant="primary"
            onClick={() => navigate("/")}
            style={{ padding: "12px 28px" }}
          >
            Return to Homepage
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate("/contact")}
            style={{ padding: "12px 28px" }}
          >
            Contact Support
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
