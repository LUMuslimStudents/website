import { X } from "lucide-react";
import { useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import "./ExpandedCardModal.css";

interface ExpandedCardModalProps {
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
  cardPosition: {
    top: number;
    left: number;
    width: number;
    height: number;
  } | null;
  children: ReactNode;
}

export const ExpandedCardModal = ({
  isOpen,
  isClosing,
  onClose,
  cardPosition,
  children,
}: ExpandedCardModalProps) => {
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => document.removeEventListener("keydown", handleEscapeKey);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !cardPosition) return null;

  const modalContent = (
    <div className={`expanded-modal-overlay ${isClosing ? "closing" : ""}`} onClick={onClose}>
      <div
        className={`expanded-card ${isClosing ? "closing" : ""}`}
        style={{
          "--start-top": `${cardPosition.top}px`,
          "--start-left": `${cardPosition.left}px`,
          "--start-width": `${cardPosition.width}px`,
          "--start-height": `${cardPosition.height}px`,
        } as React.CSSProperties & {
          "--start-top"?: string;
          "--start-left"?: string;
          "--start-width"?: string;
          "--start-height"?: string;
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="expanded-card-close-btn"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="expanded-card-content">{children}</div>
      </div>
    </div>
  );

  // Render modal into document.body so it is not affected by transforms on ancestor elements
  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};
