import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AdminOption = {
  term: string;
  price_single_term: number;
  price_discounted_two_term: number;
  membership_open: boolean;
  is_current: boolean;
};

export const AdminSettingsTab = () => {
  const [current, setCurrent] = useState<AdminOption | null>(null);
  const [allTerms, setAllTerms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingTerm, setChangingTerm] = useState(false);

  // Editable fields
  const [priceSingle, setPriceSingle] = useState(150);
  const [priceTwoTerm, setPriceTwoTerm] = useState(300);
  const [membershipOpen, setMembershipOpen] = useState(true);
  const [nextTerm, setNextTerm] = useState("");

  // Confirmation dialogs
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmChangeTerm, setConfirmChangeTerm] = useState(false);

  const fetchCurrent = useCallback(async () => {
    try {
      const data = (await apiRequest("/options/current")) as AdminOption;
      setCurrent(data);
      setPriceSingle(data.price_single_term);
      setPriceTwoTerm(data.price_discounted_two_term);
      setMembershipOpen(data.membership_open);

      // Also fetch all terms for duplicate validation
      try {
        const all = (await apiRequest("/admin/options")) as AdminOption[];
        setAllTerms(new Set(all.map((o) => o.term)));
      } catch {
        // Non-critical — just can't check for duplicates
      }
    } catch {
      setCurrent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrent();
  }, [fetchCurrent]);

  const hasChanges =
    current !== null &&
    (priceSingle !== current.price_single_term ||
      priceTwoTerm !== current.price_discounted_two_term ||
      membershipOpen !== current.membership_open);

  const handleSavePrices = async () => {
    if (!current) return;
    setConfirmSave(false);
    setSaving(true);
    try {
      await apiRequest("/admin/options", "PUT", {
        term: current.term,
        price_single_term: priceSingle,
        price_discounted_two_term: priceTwoTerm,
        membership_open: membershipOpen,
        is_current: true,
      });
      toast.success("Settings updated");
      setCurrent({
        ...current,
        price_single_term: priceSingle,
        price_discounted_two_term: priceTwoTerm,
        membership_open: membershipOpen,
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const promptChangeTerm = () => {
    const trimmed = nextTerm.trim();
    if (!trimmed) {
      toast.error("Enter a term code (e.g. VT27)");
      return;
    }
    if (allTerms.has(trimmed)) {
      toast.error(`Term "${trimmed}" already exists.`);
      return;
    }
    setConfirmChangeTerm(true);
  };

  const handleChangeTerm = async () => {
    const trimmed = nextTerm.trim();
    setConfirmChangeTerm(false);
    setChangingTerm(true);
    setChangingTerm(true);
    try {
      const created = (await apiRequest("/admin/options", "PUT", {
        term: trimmed,
        price_single_term: priceSingle,
        price_discounted_two_term: priceTwoTerm,
        membership_open: membershipOpen,
        is_current: true,
      })) as AdminOption;
      toast.success("Term changed to " + trimmed);
      setCurrent(created);
      setNextTerm("");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to change term");
    } finally {
      setChangingTerm(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading settings...</p>;
  }

  if (!current) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Term</CardTitle>
          <CardDescription>
            Create one below to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="initial-term">Term Code</Label>
            <Input
              id="initial-term"
              placeholder="e.g. HT27"
              value={nextTerm}
              onChange={(e) => setNextTerm(e.target.value)}
            />
          </div>
          <Button onClick={promptChangeTerm} disabled={changingTerm || !nextTerm.trim()}>
            {changingTerm ? "Creating..." : "Create Term"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Current term header ────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold">
          Current Term:{" "}
          <span className="text-primary">{current.term}</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Adjust pricing or change to a new term below.
        </p>
      </div>

      {/* ── Pricing & membership ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing &amp; Membership</CardTitle>
          <CardDescription>
            Changes apply to the current term ({current.term}).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price_single_term">Single Term Price (SEK)</Label>
            <Input
              id="price_single_term"
              type="number"
              value={priceSingle}
              onChange={(e) => setPriceSingle(Number(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_discounted_two_term">
              Two-Term Discounted Price (SEK)
            </Label>
            <Input
              id="price_discounted_two_term"
              type="number"
              value={priceTwoTerm}
              onChange={(e) => setPriceTwoTerm(Number(e.target.value) || 0)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="membership_open" className="text-base">
                Membership Registration Open
              </Label>
              <p className="text-sm text-muted-foreground">
                When off, new sign-ups are disabled.
              </p>
            </div>
            <Switch
              id="membership_open"
              checked={membershipOpen}
              onCheckedChange={setMembershipOpen}
            />
          </div>

          <Button onClick={() => setConfirmSave(true)} disabled={saving || !hasChanges}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* ── Change term ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Change Term</CardTitle>
          <CardDescription>
            Enter a new term code to start a fresh term. The current prices and membership
            setting will carry over.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-term">New Term Code</Label>
            <Input
              id="new-term"
              placeholder="e.g. VT27"
              value={nextTerm}
              onChange={(e) => setNextTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={promptChangeTerm}
            disabled={changingTerm || !nextTerm.trim()}
            variant="secondary"
          >
            {changingTerm ? "Creating..." : "Start New Term"}
          </Button>
        </CardContent>
      </Card>

      {/* ── Confirmation: Save prices ──────────────────────────────── */}
      <AlertDialog open={confirmSave} onOpenChange={setConfirmSave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you?</AlertDialogTitle>
            <AlertDialogDescription>
              This will change the prices and membership status for the{" "}
              <strong>{current.term}</strong> term. These settings immediately
              affect all current and future sign-ups and event registrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSavePrices}>
              Yes, update settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Confirmation: Change term ──────────────────────────────── */}
      <AlertDialog open={confirmChangeTerm} onOpenChange={setConfirmChangeTerm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to start a new term?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make{" "}
              <strong>{nextTerm.trim() || "?"}</strong> the new active term.
              All new users and events will be assigned to the new term.
              Past terms are preserved but cannot be reactivated from here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangeTerm}>
              Yes, start new term
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
