import React, { useEffect } from 'react';

/**
 * ========================================
 * MODAL DIALOG COMPONENT
 * ========================================
 * 
 * Reusable modal component for forms, confirmations, and dialogs. Features smooth
 * animations, backdrop fade, centered content with automatic backdrop dismissal option.
 * Prevents body scrolling when open and supports multiple sizes (sm, md, lg, xl, full).
 * 
 * @author Anxhela Valisi
 * @contributor Megi Shehi
 */

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  closeOnBackdrop = true,
  size = 'md', // 'sm', 'md', 'lg', 'xl', 'full'
  className = '',
}) => {
  // ===== PREVENT BODY SCROLL WHEN MODAL IS OPEN =====
  // Megi: "When the modal is open, we don't want the page behind it to scroll.
  //        This feels more polished and prevents accidental page scrolling."
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Early return if modal is closed
  if (!isOpen) return null;

  // ===== SIZE CONFIGURATION =====
  // Anxhela: "Different sizes for different contexts - small for quick confirmations,
  //          large for complex forms with lots of fields"
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  // ===== BACKDROP CLICK HANDLER =====
  // Izabela: "Handle clicks on the backdrop - but only if clicking directly on it,
  //          not on the modal content itself"
  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* ===== BACKDROP / OVERLAY ===== */}
      {/* Megi: "Semi-transparent dark backdrop. Click it to close (if enabled)." */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleBackdropClick}
      ></div>

      {/* ===== MODAL CONTAINER ===== */}
      {/* Anxhela: "Centers the modal on screen and handles responsive sizing" */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full ${sizeClasses[size]} transform rounded-2xl bg-white shadow-xl transition-all ${className}`}
        >
          {/* ===== MODAL HEADER ===== */}
          {/* Izabela: "Only render header if title is provided" */}
          {title && (
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900" id="modal-title">
                  {title}
                </h3>
                {/* ===== CLOSE BUTTON ===== */}
                {/* Megi: "X button to close the modal" */}
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ===== MODAL CONTENT ===== */}
          {/* Anxhela: "Scrollable content area - if it's too tall, users can scroll within the modal" */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {children}
          </div>

          {/* ===== MODAL FOOTER (OPTIONAL) ===== */}
          {/* Izabela: "Often contains action buttons like 'Cancel' and 'Save'" */}
          {footer && (
            <div className="border-t border-gray-200 px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;