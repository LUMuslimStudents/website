import type { Database } from ']/types/types';

type EventRow = Database['public']['Tables']['events_info']['Row'];
type EventFormFieldRow = Database['public']['Tables']['event_form_fields']['Row'];

export type EventFormFieldResponse = {
	id: string;
	question: string;
	help_text: string | null;
	field_type: Database['public']['Enums']['EventFormFieldType'];
	is_required: boolean;
	options: string[];
};

/**
 * Keep response shape aligned with REST handlers.
 * - date: YYYY-MM-DD
 * - start_time/end_time: HH:MM
 */
export const fixEventDateTimeFormat = (event: EventRow): EventRow => {
	const startTime = typeof event.start_time === 'string' ? event.start_time.substring(0, 5) : event.start_time;
	const endTime = typeof event.end_time === 'string' ? event.end_time.substring(0, 5) : event.end_time;

	return {
		...event,
		date: typeof event.date === 'string' ? event.date.substring(0, 10) : event.date,
		start_time: startTime,
		end_time: endTime,
	};
};

export const normalizeFieldOptions = (value: Database['public']['Tables']['event_form_fields']['Row']['options']): string[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter((option): option is string => typeof option === 'string' && option.trim().length > 0);
};

export const toEventFormFieldResponse = (field: EventFormFieldRow): EventFormFieldResponse => ({
	id: field.id,
	question: field.question,
	help_text: field.help_text,
	field_type: field.field_type,
	is_required: field.is_required,
	options: normalizeFieldOptions(field.options),
});

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

export const buildIcsPayload = (event: EventRow) => {
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
