import { format, isValid } from 'date-fns';

export const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
};

export const isValidDate = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return isValid(d);
};

export const safeFormat = (date, formatStr, fallback = '') => {
  if (!date) return fallback;
  const d = new Date(date);
  if (!isValid(d)) return fallback;
  return format(d, formatStr);
};
