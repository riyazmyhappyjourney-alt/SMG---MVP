/**
 * SellMyGhar CRM - Shared Formatting Utilities
 * Standardized typography, Indian currency, phone numbers, and safe date/time displays.
 */

/**
 * Format currency in Indian notation with Crore and Lakh shortcuts
 * e.g. 14500000 -> ₹1.45 Cr, 8500000 -> ₹85.00 L
 */
export function formatIndianCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '—';
  const num = Number(amount);
  if (isNaN(num)) return '—';

  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Format full exact number in Indian comma grouping
 * e.g. 14500000 -> ₹1,45,00,000
 */
export function formatIndianNumberFull(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '—';
  const num = Number(amount);
  if (isNaN(num)) return '—';
  return '₹' + num.toLocaleString('en-IN');
}

/**
 * Standardize Indian phone number presentation with uniform spacing
 * e.g. "9876543210" -> "+91 98765 43210"
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

/**
 * Safe date formatting that prevents 1 Jan 1970 epoch errors
 */
export function formatReadableDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime()) || d.getTime() === 0 || d.getFullYear() <= 1970) {
    return '—';
  }
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Safe time formatting (e.g. "11:30 AM")
 */
export function formatReadableTime(timeInput: string | Date | null | undefined): string {
  if (!timeInput) return '—';
  if (typeof timeInput === 'string') {
    const trimmed = timeInput.trim();
    // 1. Matches 12-hour format e.g. "11:30 AM", "4:00 PM", "09:15 am"
    const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
    if (match12) {
      const h = parseInt(match12[1], 10);
      const m = match12[2];
      const period = match12[3].toUpperCase();
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${String(hour12).padStart(2, '0')}:${m} ${period}`;
    }

    // 2. Matches 24-hour time format e.g. "14:30", "09:00", "00:30", "23:59:00"
    const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (match24) {
      const h = parseInt(match24[1], 10);
      const m = match24[2];
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      return `${String(hour12).padStart(2, '0')}:${m} ${period}`;
    }
  }

  // 3. Fallback to Date object or ISO string
  const d = new Date(timeInput);
  if (isNaN(d.getTime()) || d.getTime() === 0 || d.getFullYear() <= 1970) {
    return '—';
  }
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
