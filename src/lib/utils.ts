import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function detoxTime(date: string) {
  if (!date) return '';
  // Strips offsets like +00, +05:00, Z and ensures 'T' separator
  return date.replace(' ', 'T').replace(/(\+.*|Z|-[0-9]{2}:[0-9]{2})$/, '');
}

export function formatDate(date: string | Date) {
  const d = typeof date === 'string' ? new Date(detoxTime(date)) : date;
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatTime(date: string | Date) {
  const d = typeof date === 'string' ? new Date(detoxTime(date)) : date;
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function formatDateTimeISO(isoString: string) {
  if (!isoString) return '';
  // Extrae la fecha y hora directamente de la cadena ISO sin conversión de zona horaria
  // Formato de entrada: "2024-01-15T10:30:00.000Z" o "2024-01-15T10:30:00+00:00"
  // Salida: "15/01/2024 10:30"
  const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return isoString;
  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} ${hour}:${minute}`;
}
