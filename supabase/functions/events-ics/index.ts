import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type EventRow = {
  id: number;
  title: string;
  description: string | null;
  address: string;
  date: string;
  start_time: string;
  end_time: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const pad = (value: number) => String(value).padStart(2, '0');

const formatUtcTimestamp = (date: Date) => {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
};

const escapeIcsText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

const parseDatePart = (dateIso: string) => {
  const date = new Date(dateIso);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
};

const parseTimePart = (timeText: string) => {
  const [hours = '00', minutes = '00', seconds = '00'] = timeText.split(':');
  return {
    hours: Number(hours) || 0,
    minutes: Number(minutes) || 0,
    seconds: Number(seconds) || 0,
  };
};

const buildIcsPayload = (event: EventRow) => {
  const { year, month, day } = parseDatePart(event.date);
  const startTime = parseTimePart(event.start_time);
  const endTime = parseTimePart(event.end_time);

  const startUtcMs = Date.UTC(year, month, day, startTime.hours, startTime.minutes, startTime.seconds);
  let endUtcMs = Date.UTC(year, month, day, endTime.hours, endTime.minutes, endTime.seconds);

  if (endUtcMs <= startUtcMs) {
    endUtcMs += 24 * 60 * 60 * 1000;
  }

  const endDate = new Date(endUtcMs);
  const formatFloating = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LUMS//Events//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:event-${event.id}@lums`,
    `DTSTAMP:${formatUtcTimestamp(new Date())}`,
    `DTSTART:${formatFloating(new Date(startUtcMs))}`,
    `DTEND:${formatFloating(endDate)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    event.description ? `DESCRIPTION:${escapeIcsText(event.description)}` : '',
    event.address ? `LOCATION:${escapeIcsText(event.address)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const { eventId } = await req.json();

    if (!Number.isInteger(eventId)) {
      return new Response(JSON.stringify({ error: 'Invalid event id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: 'Supabase environment is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: event, error } = await supabase
      .from('events_info')
      .select('id,title,description,address,date,start_time,end_time')
      .eq('id', eventId)
      .single<EventRow>();

    if (error || !event) {
      return new Response(JSON.stringify({ error: 'Event not found or not accessible' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ics = buildIcsPayload(event);

    return new Response(JSON.stringify({ ics }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
