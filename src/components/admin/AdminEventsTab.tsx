import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api";

import { AdminEventSummary } from "./types";
import { AdminEventsList } from "./AdminEventsList";

export const AdminEventsTab = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<AdminEventSummary[]>([]);
  const [latestTerm, setLatestTerm] = useState<string>("");
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [eventsData, currentOptions] = await Promise.all([
          apiRequest('/admin/events'),
          apiRequest('/options/current').catch(() => null),
        ]);
        if (isMounted) {
          setEvents(eventsData);
          if (currentOptions?.term) {
            setLatestTerm(currentOptions.term);
          }
        }
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'Failed to fetch events');
      } finally {
        if (isMounted) {
          setLoadingEvents(false);
        }
      }
    };

    fetchData();

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
      latestTerm={latestTerm}
      onOpenEvent={(eventId) => navigate(`/admin/events/${eventId}`)}
      onEditEvent={(eventId) => navigate(`/admin/events/${eventId}/edit`)}
      onCreateEvent={() => navigate('/admin/events/new')}
    />
  );
};
