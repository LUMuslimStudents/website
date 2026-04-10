import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { AdminEventRegistration } from "./types";

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const renderBoolean = (value: boolean) => (value ? 'Yes' : 'No');

type AdminRegistrationSnapshotDialogProps = {
  registration: AdminEventRegistration;
};

export const AdminRegistrationSnapshotDialog = ({ registration }: AdminRegistrationSnapshotDialogProps) => {
  const profile = registration.profile;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View snapshot
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Registration snapshot</DialogTitle>
          <DialogDescription>
            Full registration metadata and stored profile snapshot for this participant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Registration</p>
              <p className="text-sm">Submitted: {formatDateTime(registration.submitted_at)}</p>
              <p className="text-sm">Updated: {formatDateTime(registration.updated_at)}</p>
              <p className="text-sm">Quoted price: {registration.quoted_price} SEK</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Snapshots</p>
              <p className="text-sm">Invitation: {registration.invitation_snapshot}</p>
              <p className="text-sm">Siblings: {registration.siblings_snapshot}</p>
              <p className="text-sm">User ID: {registration.user_id ?? 'Guest registration'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Profile status</p>
              <p className="text-sm">Student: {profile ? renderBoolean(profile.is_student) : '—'}</p>
              <p className="text-sm">Alumnus: {profile ? renderBoolean(profile.is_alumnus) : '—'}</p>
              <p className="text-sm">Gender: {profile?.gender || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Linked account</p>
              <p className="text-sm">{registration.linked_user ? `${registration.linked_user.first_name} ${registration.linked_user.last_name}` : 'No linked user'}</p>
              <p className="text-sm">{registration.linked_user?.email || '—'}</p>
              <p className="text-sm">{registration.linked_user?.role || '—'}</p>
            </div>
          </div>

          {profile && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Profile snapshot</h4>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div><span className="text-muted-foreground">First name:</span> {profile.first_name}</div>
                <div><span className="text-muted-foreground">Last name:</span> {profile.last_name}</div>
                <div><span className="text-muted-foreground">Email:</span> {profile.email}</div>
                <div><span className="text-muted-foreground">Phone:</span> {profile.phone_number}</div>
                <div><span className="text-muted-foreground">University:</span> {profile.university_name || '—'}</div>
                <div><span className="text-muted-foreground">Study program:</span> {profile.study_program || '—'}</div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};