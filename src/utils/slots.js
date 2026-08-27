export const DEFAULT_TIMES = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

export const WEEK_DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function defaultSchedule() {
  return {
    days: [1, 2, 3, 4, 5, 6],
    times: DEFAULT_TIMES,
  };
}

export function todayISO() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function openSlots(date, schedule, bookedTimes) {
  const days = schedule?.days || defaultSchedule().days;
  const times = schedule?.times || defaultSchedule().times;
  const weekday = new Date(`${date}T00:00:00`).getDay();
  if (!days.includes(weekday)) return [];
  return times.filter((time) => !bookedTimes.includes(time));
}
