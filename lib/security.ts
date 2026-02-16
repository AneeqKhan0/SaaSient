/**
 * Security utilities for input validation and sanitization
 */

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 * - Minimum 8 characters
 * - At least one letter
 * - At least one number (optional but recommended)
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one letter' };
  }

  // Recommended but not required
  if (!/\d/.test(password)) {
    console.warn('Password should contain at least one number for better security');
  }

  return { valid: true };
}

/**
 * Sanitizes user input by trimming whitespace
 */
export function sanitizeInput(input: string): string {
  return input.trim();
}

/**
 * Validates phone number format (basic)
 */
export function isValidPhone(phone: string): boolean {
  // Basic validation - adjust based on your requirements
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Prevents XSS by escaping HTML special characters
 * Note: React does this automatically, but this is for extra safety
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Rate limiting helper (client-side)
 * Prevents rapid form submissions
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  canAttempt(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }

    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Secure random string generator
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for server-side
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Checks if a string contains potential SQL injection patterns
 * Note: This is a basic check. Supabase RLS is the primary protection.
 */
export function containsSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|\*\/|\/\*)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /(;|\||&)/,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Validates that a value is within expected bounds
 */
export function isWithinBounds(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Sanitizes filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}

/**
 * Checks if content length is within acceptable limits
 */
export function isValidContentLength(content: string, maxLength: number = 10000): boolean {
  return content.length <= maxLength;
}

/**
 * Validates date is not in the past (for appointments)
 */
export function isValidFutureDate(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Removes potentially dangerous characters from search queries
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>\"']/g, '')
    .substring(0, 100);
}
