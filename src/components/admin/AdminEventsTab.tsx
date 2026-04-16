import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api";

import { AdminEventSummary } from "./types";
import { AdminEventsList } from "./AdminEventsList";

export const AdminEventsTab = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<AdminEventSummary[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchEvents = async () => {
      try {
        const data = await apiRequest('/admin/events');
        if (isMounted) {
          setEvents(data);
        }
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'Failed to fetch events');
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

  return (
    <AdminEventsList
      events={events}
      loading={false}
      onOpenEvent={(eventId) => navigate(`/admin/events/${eventId}`)}
      onCreateEvent={() => navigate('/admin/events/new')}
    />
  );
};
