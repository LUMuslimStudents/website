import { Share, X } from "lucide-react";
import { useEffect, useRef, useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
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
  footer?: ReactNode;
  showShareButton?: boolean;
  shareTitle?: string;
  shareText?: string;
  shareUrl?: string;
}

type ModalShareButtonProps = {
  shareTitle?: string;
  shareText?: string;
  shareUrl?: string;
};

const ModalShareButton = ({ shareTitle, shareText, shareUrl }: ModalShareButtonProps) => {
  const [manualShareUrl, setManualShareUrl] = useState<string | null>(null);
  const linkInputRef = useRef<HTMLInputElement | null>(null);

  const canShareData = (data: ShareData) => {
    if (typeof navigator === "undefined" || !navigator.share) {
      return false;
    }

    if (!navigator.canShare) {
      return true;
    }

    try {
      return navigator.canShare(data);
    } catch {
      return false;
    }
  };

  const copyWithLegacyCommand = (value: string) => {
    if (typeof document === "undefined") {
      return false;
    }

    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const didCopy = document.execCommand("copy");
    document.body.removeChild(textArea);
    return didCopy;
  };

  useEffect(() => {
    if (!manualShareUrl || !linkInputRef.current) {
      return;
    }

    linkInputRef.current.focus();
    linkInputRef.current.select();
  }, [manualShareUrl]);

  useEffect(() => {
    if (!manualShareUrl) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setManualShareUrl(null);
      }
    };

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [manualShareUrl]);

  const handleManualCopy = async () => {
    if (!manualShareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(manualShareUrl);
      toast.success("Link copied to clipboard");
      return;
    } catch {
      const didLegacyCopy = copyWithLegacyCommand(manualShareUrl);
      if (didLegacyCopy) {
        toast.success("Link copied to clipboard");
        return;
      }
      toast.error("Could not copy the link. Please copy manually.");
    }
  };

  const handleShare = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const url = shareUrl ?? window.location.href;

    if (navigator.share) {
      const sharePayloads: ShareData[] = [
        {
          title: shareTitle,
          text: shareText,
          url,
        },
        {
          text: shareText,
          url,
        },
        {
          url,
        },
        {
          text: shareText || shareTitle || url,
        },
      ];

      for (const payload of sharePayloads) {
        const isPayloadEmpty = !payload.title && !payload.text && !payload.url;
        if (isPayloadEmpty || !canShareData(payload)) {
          continue;
        }

        try {
          await navigator.share(payload);
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
        }
      }
    }

    setManualShareUrl(url);
  };

  return (
    <>
      <button
        onClick={handleShare}
        className="expanded-card-share-btn"
        aria-label="Share"
        type="button"
      >
        <Share className="h-5 w-5" />
      </button>
      {manualShareUrl ? (
        <div className="expanded-share-fallback" role="dialog" aria-label="Share link" onClick={(event) => event.stopPropagation()}>
          <p className="expanded-share-fallback-title">Share this link</p>
          <input
            ref={linkInputRef}
            readOnly
            value={manualShareUrl}
            className="expanded-share-fallback-input"
            onFocus={(event) => event.currentTarget.select()}
          />
          <div className="expanded-share-fallback-actions">
            <button
              type="button"
              className="expanded-share-fallback-btn"
              onClick={handleManualCopy}
            >
              Copy
            </button>
            <button
              type="button"
              className="expanded-share-fallback-btn secondary"
              onClick={() => setManualShareUrl(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
};

export const ExpandedCardModal = ({
  isOpen,
  isClosing,
  onClose,
  cardPosition,
  children,
  footer,
  showShareButton = false,
  shareTitle,
  shareText,
  shareUrl,
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
        className={`expanded-card ${isClosing ? "closing" : ""} ${footer ? "has-footer" : ""}`}
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
        <div className="expanded-card-action-group">
          {showShareButton ? (
            <ModalShareButton
              shareTitle={shareTitle}
              shareText={shareText}
              shareUrl={shareUrl}
            />
          ) : null}
          <button
            onClick={onClose}
            className="expanded-card-close-btn"
            aria-label="Close"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="expanded-card-content">{children}</div>
        {footer ? <div className="expanded-card-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );

  // Render modal into document.body so it is not affected by transforms on ancestor elements
  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};
