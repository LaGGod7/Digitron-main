import { useEffect, useRef } from "react";
import { Icon } from "./index";

/**
 * ConfirmDialog — replaces window.confirm for destructive actions.
 *
 * Props:
 *   open       : boolean
 *   title      : string
 *   message    : string
 *   confirmLabel : string (default "Delete")
 *   cancelLabel  : string (default "Cancel")
 *   onConfirm  : () => void
 *   onCancel   : () => void
 *   variant    : "danger" | "warning"
 */
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
}) {
  const triggerRef = useRef(null);
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      const timer = setTimeout(() => {
        if (cancelBtnRef.current) {
          cancelBtnRef.current.focus();
        }
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", handleKeyDown);
        if (triggerRef.current) {
          triggerRef.current.focus();
        }
      };
    }
  }, [open, onCancel]);

  if (!open) return null;

  const iconName = variant === "danger" ? "trash" : "alertTriangle";
  const iconColor = variant === "danger" ? "#f87171" : "#fcd34d";
  const iconBg =
    variant === "danger"
      ? "rgba(248,113,113,0.1)"
      : "rgba(252,211,77,0.1)";
  const iconBorder =
    variant === "danger"
      ? "rgba(248,113,113,0.2)"
      : "rgba(252,211,77,0.2)";

  return (
    <div
      className="confirm-dialog-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div
          className="confirm-dialog-icon"
          style={{ background: iconBg, borderColor: iconBorder, color: iconColor }}
        >
          <Icon name={iconName} size={24} color={iconColor} />
        </div>
        <h3 id="confirm-dialog-title">{title}</h3>
        <p>{message}</p>
        <div className="confirm-dialog-actions">
          <button ref={cancelBtnRef} className="btn-confirm-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="btn-confirm-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

