export const WEEK_DAYS = [
  { id: 'monday', label: 'Monday', short: 'Mon' },
  { id: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { id: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { id: 'thursday', label: 'Thursday', short: 'Thu' },
  { id: 'friday', label: 'Friday', short: 'Fri' },
  { id: 'saturday', label: 'Saturday', short: 'Sat' },
  { id: 'sunday', label: 'Sunday', short: 'Sun' },
];

export const DAY_START = 7 * 60;
export const DAY_END = 24 * 60;

export function formatDateLabel(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function parseTimeToMinutes(timeValue) {
  const [hours, minutes] = timeValue.split(':').map(Number);
  return hours * 60 + minutes;
}

export function parseEndTimeToMinutes(timeValue) {
  const minutes = parseTimeToMinutes(timeValue);
  return minutes === 0 ? DAY_END : minutes;
}

export function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
}

export function getDayLabel(dayId) {
  return WEEK_DAYS.find((day) => day.id === dayId)?.label || dayId;
}

export function getDayShortLabel(dayId) {
  return WEEK_DAYS.find((day) => day.id === dayId)?.short || dayId;
}

export function normalizeParticipants(participants) {
  return participants.map((participant) => ({
    ...participant,
    periods: participant.periods || [],
  }));
}

function getBusyPeriodsForDay(participants, dayId) {
  return normalizeParticipants(participants)
    .flatMap((participant) => participant.periods)
    .filter((period) => period.day === dayId)
    .map((period) => ({
      start: Math.max(parseTimeToMinutes(period.start), DAY_START),
      end: Math.min(parseEndTimeToMinutes(period.end), DAY_END),
    }))
    .filter((period) => period.end > period.start)
    .sort((first, second) => first.start - second.start);
}

function mergePeriods(periods) {
  const merged = [];

  for (const period of periods) {
    const previous = merged[merged.length - 1];

    if (previous && period.start <= previous.end) {
      previous.end = Math.max(previous.end, period.end);
    } else {
      merged.push({ ...period });
    }
  }

  return merged;
}

export function findEveryoneFreeWindows(participants) {
  if (participants.length === 0) return [];

  return WEEK_DAYS.flatMap((day) => {
    const busyPeriods = mergePeriods(getBusyPeriodsForDay(participants, day.id));
    const freeWindows = [];
    let cursor = DAY_START;

    // Busy periods are merged first. The gaps between those busy ranges are the
    // times when no participant has said they are busy.
    for (const busy of busyPeriods) {
      if (busy.start > cursor) {
        freeWindows.push({ day: day.id, start: cursor, end: busy.start });
      }
      cursor = Math.max(cursor, busy.end);
    }

    if (cursor < DAY_END) {
      freeWindows.push({ day: day.id, start: cursor, end: DAY_END });
    }

    return freeWindows;
  });
}

export function getCalendarSlots() {
  const slots = [];

  for (let minutes = DAY_START; minutes < DAY_END; minutes += 30) {
    slots.push(minutes);
  }

  return slots;
}

export function getAvailabilityCalendar(participants) {
  const normalizedParticipants = normalizeParticipants(participants);
  const totalParticipants = normalizedParticipants.length;

  return WEEK_DAYS.map((day) => ({
    ...day,
    slots: getCalendarSlots().map((start) => {
      const end = start + 30;
      const busyCount = normalizedParticipants.filter((participant) =>
        participant.periods.some((period) => {
          if (period.day !== day.id) return false;

          const busyStart = parseTimeToMinutes(period.start);
          const busyEnd = parseEndTimeToMinutes(period.end);
          return start < busyEnd && end > busyStart;
        }),
      ).length;
      const availableCount = totalParticipants - busyCount;

      // Green means everyone is free. Red means at least one person is busy.
      let status = 'empty';
      if (totalParticipants > 0 && busyCount === 0) {
        status = 'free';
      } else if (totalParticipants > 0) {
        status = 'busy';
      }

      return { start, end, busyCount, availableCount, totalParticipants, status };
    }),
  }));
}
