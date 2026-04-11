import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type EventRegistrationTermsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gdprAccepted: boolean;
  onGdprAcceptedChange: (accepted: boolean) => void;
  refundAccepted: boolean;
  onRefundAcceptedChange: (accepted: boolean) => void;
  onAccept: () => void;
  loading?: boolean;
  refundCutoffAt?: string | Date | null;
};

const formatDeadline = (value?: string | Date | null) => {
  if (!value) {
    return "48 hours before the event starts";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "48 hours before the event starts";
  }

  return date.toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
};

export const EventRegistrationTermsDialog = ({
  open,
  onOpenChange,
  gdprAccepted,
  onGdprAcceptedChange,
  refundAccepted,
  onRefundAcceptedChange,
  onAccept,
  loading = false,
  refundCutoffAt,
}: EventRegistrationTermsDialogProps) => {
  const [expandedCondition, setExpandedCondition] = useState<string | null>("refund");
  const allAccepted = gdprAccepted && refundAccepted;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Event Terms & Conditions</DialogTitle>
          <DialogDescription>
            Please read and accept the following conditions before submitting your event registration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Checkbox
                checked={refundAccepted}
                onCheckedChange={(checked) => onRefundAcceptedChange(Boolean(checked))}
              />
              <button
                onClick={() => setExpandedCondition(expandedCondition === "refund" ? null : "refund")}
                className="flex items-center gap-2 flex-1 text-left font-medium hover:text-primary transition-colors"
                type="button"
              >
                <span>Refund Policy</span>
                <ChevronDown
                  size={18}
                  className={`flex-shrink-0 transition-transform ${expandedCondition === "refund" ? "rotate-180" : ""}`}
                />
              </button>
            </div>
            {expandedCondition === "refund" && (
              <p className="text-sm text-muted-foreground ml-7">
                Refunds are available only until <strong>48 hours</strong> before the event date, 
                which means <strong>{formatDeadline(refundCutoffAt)}</strong> at the latest.
                There will be no refunds after this period, regardless of the circumstances.
              </p>
            )}
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Checkbox
                checked={gdprAccepted}
                onCheckedChange={(checked) => onGdprAcceptedChange(Boolean(checked))}
              />
              <button
                onClick={() => setExpandedCondition(expandedCondition === "gdpr" ? null : "gdpr")}
                className="flex items-center gap-2 flex-1 text-left font-medium hover:text-primary transition-colors"
                type="button"
              >
                <span>In accordance with the General Data Protection Regulation (GDPR), personal and financial data collected will be handled securely, respecting members' privacy and rights.</span>
                <ChevronDown
                  size={18}
                  className={`flex-shrink-0 transition-transform ${expandedCondition === "gdpr" ? "rotate-180" : ""}`}
                />
              </button>
            </div>
            {expandedCondition === "gdpr" && (
              <div className="text-sm text-muted-foreground ml-7">
                <ul className="list-disc pl-5 space-y-2">
                  <li>We, LUMS, process your personal data for administering your participation in events and communicating with you.</li>
                  <li><strong>Storage period:</strong> 1 year from the start of membership.</li>
                  <li><strong>Rights:</strong> You can request access, rectification, deletion, object to processing, or withdraw consent.</li>
                  <li><strong>Contact:</strong> For questions or to exercise your rights, contact <a className="text-primary hover:underline" href="mailto:muslimskastudenterlu@gmail.com">muslimskastudenterlu@gmail.com</a>.</li>
                  <li>Your event registration implies consent to this processing.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onAccept} disabled={!allAccepted || loading} className="flex-1">
            {loading ? "Submitting..." : "Accept & Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
