import React from "react";
import Icon from "./Icon";
import logger from "../../utils/logger";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error("ErrorBoundary caught an uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at center, #1c1d21 0%, #0d0e11 100%)",
          color: "var(--white, #ffffff)",
          fontFamily: "'DM Sans', sans-serif",
          padding: "24px",
          textAlign: "center"
        }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "48px 32px",
            maxWidth: "480px",
            width: "100%",
            boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <div style={{
              background: "rgba(212, 175, 55, 0.08)",
              border: "1px solid rgba(212, 175, 55, 0.2)",
              borderRadius: "50%",
              width: "64px",
              height: "64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px"
            }}>
              <Icon name="alertTriangle" size={32} color="var(--gold, #D4AF37)" />
            </div>

            <h1 style={{
              fontSize: "24px",
              fontWeight: 500,
              margin: "0 0 12px 0",
              letterSpacing: "-0.02em"
            }}>Something went wrong</h1>
            
            <p style={{
              fontSize: "14px",
              color: "rgba(255, 255, 255, 0.5)",
              margin: "0 0 32px 0",
              lineHeight: 1.6
            }}>
              An unexpected error occurred. We have logged the issue and are looking into it. Please try reloading.
            </p>

            <div style={{
              display: "flex",
              gap: "12px",
              width: "100%"
            }}>
              <button
                onClick={this.handleReset}
                style={{
                  flex: 1,
                  background: "var(--gold, #D4AF37)",
                  color: "var(--obsidian, #0c0d10)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "opacity 0.2s ease"
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = 0.9}
                onMouseOut={(e) => e.currentTarget.style.opacity = 1}
              >
                Reload Page
              </button>
              <button
                onClick={() => { window.location.href = "/"; }}
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "var(--white, #ffffff)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background 0.2s ease"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"}
                onMouseOut={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
              >
                Go Home
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details style={{
                marginTop: "32px",
                width: "100%",
                textAlign: "left",
                background: "rgba(0, 0, 0, 0.3)",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "11px",
                fontFamily: "monospace",
                color: "#ff6b6b",
                border: "1px solid rgba(255, 107, 107, 0.1)",
                overflowX: "auto"
              }}>
                <summary style={{ cursor: "pointer", color: "rgba(255, 255, 255, 0.3)", marginBottom: "6px" }}>Error Stacktrace</summary>
                {this.state.error.toString()}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
