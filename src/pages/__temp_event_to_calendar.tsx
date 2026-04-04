
// const toDate = (value: Date | string) => {
//   if (value instanceof Date) {
//     return value;
//   }

//   const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.exec(value);
//   if (dateOnlyMatch) {
//     const [year, month, day] = value.split("-").map(Number);
//     return new Date(year, month - 1, day);
//   }

//   return new Date(value);
// };

// const parseTimeString = (value: string) => {
//   const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
//   if (!match) {
//     return null;
//   }

//   const hours = Number(match[1]);
//   const minutes = Number(match[2]);
//   const seconds = Number(match[3] ?? "0");

//   if ([hours, minutes, seconds].some((part) => Number.isNaN(part))) {
//     return null;
//   }
//   return { hours, minutes, seconds };
// };

// const mergeDateAndTime = (dateValue: Date | string, timeValue: Date | string) => {
//   const date = toDate(dateValue);
//   const merged = new Date(date);

//   if (typeof timeValue === "string") {
//     const parsed = parseTimeString(timeValue);
//     if (parsed) {
//       merged.setHours(parsed.hours, parsed.minutes, parsed.seconds, 0);
//       return merged;
//     }
//   }

//   const time = toDate(timeValue);
//   merged.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), 0);
//   return merged;
// };

// const formatLocal = (value: Date) => {
//   const pad = (num: number) => String(num).padStart(2, "0");
//   return `${value.getFullYear()}${pad(value.getMonth() + 1)}${pad(value.getDate())}T${pad(value.getHours())}${pad(value.getMinutes())}${pad(value.getSeconds())}`;
// };

// const escapeIcsText = (value: string) =>
//   value
//     .replace(/\\/g, "\\\\")
//     .replace(/\r?\n/g, "\\n")
//     .replace(/,/g, "\\,")
//     .replace(/;/g, "\\;
// ");

// const buildIcs = (event: events_info) => {
//   const start = mergeDateAndTime(event.date, event.start_time);
//   const end = mergeDateAndTime(event.date, event.end_time);

//   if (end <= start) {
//     end.setDate(end.getDate() + 1);
//   }

//   const lines = [
//     "BEGIN:VCALENDAR",
//     "VERSION:2.0",
//     "PRODID:-//LUMS//Events//EN",
//     "CALSCALE:GREGORIAN",
//     "BEGIN:VEVENT",
//     `UID:event-${event.id}@lums`,
//     `DTSTAMP:${formatLocal(new Date())}`,
//     `DTSTART:${formatLocal(start)}`,
//     `DTEND:${formatLocal(end)}`,
//     `SUMMARY:${escapeIcsText(event.title)}`,
//     event.description ? `DESCRIPTION:${escapeIcsText(event.description)}` : "",
//     event.address ? `LOCATION:${escapeIcsText(event.address)}` : "",
//     "END:VEVENT",
//     "END:VCALENDAR",
//   ].filter(Boolean);

//   const reflink = `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
//   return (
//     <a
//       href={reflink}
//       download={event.title + ".ics"}
//       className="group text-sm inline-flex items-center gap-1 underline underline-offset-6 hover:opacity-80"
//     >
//       <span>add to calendar?</span>
//       <ExternalLink
//         className="h-3.5 w-3.5 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5"
//         aria-hidden="true"
//       />
//     </a>
//   )
// };
