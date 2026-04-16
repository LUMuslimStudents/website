import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AdminEventDetailView } from "./AdminEventDetailsView";

export const AdminEventDetailRoute = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const parsedEventId = useMemo(() => Number(eventId), [eventId]);

  if (!eventId || Number.isNaN(parsedEventId)) {
    return <p className="text-sm text-muted-foreground">Invalid event id.</p>;
  }

  return (
    <AdminEventDetailView
      eventId={parsedEventId}
      onBack={() => navigate('/admin/events')}
    />
  );
};
