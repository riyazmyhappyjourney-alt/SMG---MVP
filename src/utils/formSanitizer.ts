/**
 * SellMyGhar Form Sanitization & Anti-Waste Validation Utilities
 * Ensures robust data integrity, prevents dummy spam/e-waste submissions,
 * strips malicious tags/scripts, and enforces sensible character/value limits.
 */

export function stripHtmlAndScripts(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // remove control chars
    .trim();
}

export function sanitizeText(input: string, maxLength: number = 200): string {
  if (!input) return '';
  const cleaned = stripHtmlAndScripts(input);
  return cleaned.slice(0, maxLength);
}

export interface ValidationResult<T = string> {
  value: T;
  isValid: boolean;
  error?: string;
}

/**
 * Sanitizes and validates person name (owner name)
 * Enforces 2 - 50 characters, letters, spaces, dots, hyphens, and apostrophes.
 * Rejects symbols, code, numbers, and repetitive dummy characters.
 */
export function sanitizeOwnerName(raw: string): ValidationResult<string> {
  const cleaned = stripHtmlAndScripts(raw).slice(0, 50);
  if (!cleaned || cleaned.length < 2) {
    return { value: cleaned, isValid: false, error: 'Full name is required (minimum 2 characters).' };
  }
  // Check for repeated spam characters like "aaaaaaa" or "xxxxxx"
  if (/^(.)\1{4,}$/i.test(cleaned.replace(/\s/g, ''))) {
    return { value: cleaned, isValid: false, error: 'Please enter a genuine, recognizable name.' };
  }
  // Allowed: letters, spaces, periods, hyphens, apostrophes
  const validPattern = /^[a-zA-Z\s.'-]+$/;
  if (!validPattern.test(cleaned)) {
    return { value: cleaned, isValid: false, error: 'Name must contain only letters, spaces, and hyphens.' };
  }
  return { value: cleaned, isValid: true };
}

/**
 * Validates 10-digit Indian Mobile Phone Number
 */
export function sanitizeIndianPhone(raw: string): ValidationResult<string> {
  const digits = String(raw || '').replace(/\D/g, '').slice(-10);
  if (digits.length !== 10 || !/^[6-9]\d{9}$/.test(digits)) {
    return { 
      value: digits, 
      isValid: false, 
      error: 'Valid 10-digit Indian mobile number starting with 6, 7, 8, or 9 is required.' 
    };
  }
  return { value: digits, isValid: true };
}

/**
 * Sanitizes email address (optional)
 */
export function sanitizeEmail(raw: string): ValidationResult<string> {
  const cleaned = stripHtmlAndScripts(raw).toLowerCase().slice(0, 80);
  if (!cleaned) {
    return { value: '', isValid: true };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) {
    return { value: cleaned, isValid: false, error: 'Please enter a valid email address.' };
  }
  return { value: cleaned, isValid: true };
}

/**
 * Sanitizes Locality Name (Bengaluru)
 */
export function sanitizeLocality(raw: string): ValidationResult<string> {
  const cleaned = stripHtmlAndScripts(raw).slice(0, 80);
  if (!cleaned || cleaned.length < 2) {
    return { value: cleaned, isValid: false, error: 'Bengaluru locality is required.' };
  }
  // Check for repeated dummy characters
  if (/^(.)\1{4,}$/i.test(cleaned.replace(/\s/g, ''))) {
    return { value: cleaned, isValid: false, error: 'Please enter a valid locality name.' };
  }
  // Disallow SQL/script chars
  if (/[<>{}[\]\\]/.test(cleaned)) {
    return { value: cleaned, isValid: false, error: 'Locality contains invalid characters.' };
  }
  return { value: cleaned, isValid: true };
}

/**
 * Sanitizes Apartment / Society / Project Name
 */
export function sanitizeSociety(raw: string): ValidationResult<string> {
  const cleaned = stripHtmlAndScripts(raw).slice(0, 100);
  if (!cleaned || cleaned.length < 2) {
    return { value: cleaned, isValid: false, error: 'Apartment / Society / Project name is required.' };
  }
  if (/^(.)\1{4,}$/i.test(cleaned.replace(/\s/g, ''))) {
    return { value: cleaned, isValid: false, error: 'Please enter a valid apartment or society name.' };
  }
  if (/[<>{}[\]\\]/.test(cleaned)) {
    return { value: cleaned, isValid: false, error: 'Society name contains invalid characters.' };
  }
  return { value: cleaned, isValid: true };
}

/**
 * Sanitizes Wing/Tower and Unit/House Number
 */
export function sanitizeUnitOrTower(raw: string, maxLen: number = 30): string {
  if (!raw) return '';
  return stripHtmlAndScripts(raw)
    .replace(/[<>{}[\]\\]/g, '')
    .slice(0, maxLen);
}

/**
 * Sanitizes Super Built-up Area (SBUA) in sq ft
 * Required positive integer between 200 and 50,000 sq ft.
 */
export function sanitizeSBUA(raw: number | string | ''): ValidationResult<number> {
  const val = typeof raw === 'string' ? parseInt(raw.replace(/\D/g, ''), 10) : raw;
  if (!val || isNaN(val) || val <= 0) {
    return { value: 0, isValid: false, error: 'Super Built-up Area is required.' };
  }
  if (val < 250) {
    return { value: val, isValid: false, error: 'Super Built-up Area must be at least 250 sq.ft.' };
  }
  if (val > 30000) {
    return { value: val, isValid: false, error: 'Super Built-up Area cannot exceed 30,000 sq.ft.' };
  }
  return { value: val, isValid: true };
}

/**
 * Sanitizes Optional Carpet Area in sq ft
 */
export function sanitizeCarpetArea(raw: number | string | '', sbua?: number): ValidationResult<number | undefined> {
  if (raw === '' || raw === undefined || raw === null) {
    return { value: undefined, isValid: true };
  }
  const val = typeof raw === 'string' ? parseInt(raw.replace(/\D/g, ''), 10) : raw;
  if (isNaN(val) || val <= 0) {
    return { value: undefined, isValid: true };
  }
  if (val < 150) {
    return { value: val, isValid: false, error: 'Carpet area must be at least 150 sq.ft.' };
  }
  if (sbua && sbua > 0 && val > sbua) {
    return { value: val, isValid: false, error: 'Carpet area cannot exceed Super Built-up Area.' };
  }
  return { value: val, isValid: true };
}

/**
 * Sanitizes Price in INR
 */
export function sanitizePrice(raw: number | string | '', isRental: boolean): ValidationResult<number> {
  const val = typeof raw === 'string' ? parseInt(raw.replace(/\D/g, ''), 10) : raw;
  const min = isRental ? 5000 : 500000;
  const max = isRental ? 10000000 : 1000000000; // 1 Cr/mo rent or 100 Cr sale
  
  if (!val || isNaN(val) || val <= 0) {
    return { 
      value: 0, 
      isValid: false, 
      error: isRental ? 'Expected monthly rent is required.' : 'Expected selling price is required.' 
    };
  }
  if (val < min) {
    return { 
      value: val, 
      isValid: false, 
      error: isRental 
        ? 'Expected rent must be at least ₹5,000/month.' 
        : 'Expected selling price must be at least ₹5,00,000 (5 Lakhs).' 
    };
  }
  if (val > max) {
    return { 
      value: val, 
      isValid: false, 
      error: isRental 
        ? 'Expected rent cannot exceed ₹1 Crore/month.' 
        : 'Expected selling price cannot exceed ₹100 Crores.' 
    };
  }
  return { value: val, isValid: true };
}

/**
 * Validates external video links (YouTube, Google Drive, Dropbox)
 */
export function validateVideoUrl(url: string): { 
  isValid: boolean; 
  provider: 'YOUTUBE' | 'GOOGLE_DRIVE' | 'DROPBOX' | 'OTHER' | null; 
  error?: string 
} {
  const trimmed = (url || '').trim();
  if (!trimmed) {
    return { isValid: true, provider: null };
  }

  // YouTube match: youtube.com/watch?v=... or youtu.be/... or youtube.com/shorts/...
  if (/^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)/i.test(trimmed)) {
    return { isValid: true, provider: 'YOUTUBE' };
  }

  // Google Drive match: drive.google.com/file/d/... or drive.google.com/open?id=...
  if (/^(https?:\/\/)?(drive\.google\.com\/(file\/d\/|open\?id=|drive\/folders\/))/i.test(trimmed)) {
    return { isValid: true, provider: 'GOOGLE_DRIVE' };
  }

  // Dropbox match: dropbox.com/s/... or dropbox.com/scl/...
  if (/^(https?:\/\/)?(www\.)?dropbox\.com\//i.test(trimmed)) {
    return { isValid: true, provider: 'DROPBOX' };
  }

  // Generic valid URL check
  if (/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed)) {
    return { isValid: true, provider: 'OTHER' };
  }

  return { 
    isValid: false, 
    provider: null, 
    error: 'Please enter a valid YouTube, Google Drive, or Dropbox video link.' 
  };
}

/**
 * Sanitizes property description (max 1000 characters)
 */
export function sanitizeDescription(raw: string): ValidationResult<string> {
  const cleaned = stripHtmlAndScripts(raw).slice(0, 1000);
  return { value: cleaned, isValid: true };
}
