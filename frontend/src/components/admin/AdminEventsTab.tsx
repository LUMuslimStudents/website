import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api";

import { AdminEventSummary } from "./types";
import { AdminEventsList } from "./AdminEventsList";
import { AdminEventDetailView } from "./AdminEventDetailsView";

export const AdminEventsTab = () => {
  const [events, setEvents] = useState<AdminEventSummary[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchEvents = async () => {
      try {
        const data = await apiRequest('/admin/events');
        if (isMounted) {
          setEvents(data);
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch events');
      } finally {
        if (isMounted) {
          setLoadingEvents(false);
        }
      }
    };

    fetchEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loadingEvents) {
    return <p className="text-sm text-muted-foreground">Loading events...</p>;
  }

  if (selectedEventId) {
    return (
      <AdminEventDetailView
        eventId={selectedEventId}
        onBack={() => setSelectedEventId(null)}
      />
    );
  }

  return (
    <AdminEventsList
      events={events}
      loading={false}
      onOpenEvent={(eventId) => setSelectedEventId(eventId)}
    />
  );
};
