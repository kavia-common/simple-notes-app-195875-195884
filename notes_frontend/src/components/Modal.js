import React, { useEffect } from "react";
import "./Modal.css";

/**
 * A lightweight modal that behaves like a centered dialog on desktop
 * and a bottom sheet on mobile.
 */
// PUBLIC_INTERFACE
export default function Modal({ open, title, children, footer, onClose, labelledById }) {
  /** Render a modal overlay with accessible dialog semantics. */
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ModalOverlay" role="presentation" onMouseDown={onClose}>
      <div
        className="Modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="ModalHeader">
          <div className="ModalTitleWrap">
            <h2 className="ModalTitle" id={labelledById}>
              {title}
            </h2>
          </div>
          <button className="IconButton" type="button" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>

        <div className="ModalBody">{children}</div>

        {footer ? <div className="ModalFooter">{footer}</div> : null}
      </div>
    </div>
  );
}
