/**
 * Validate that a string is exactly 6 decimal digits.
 * Used by the MFA verify route to validate input format.
 */
export function isValidOtpFormat(code: string): boolean {
  return /^\d{6}$/.test(code);
}

export interface MfaOtpRecord {
  id: string;
  user_id: string;
  code: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}
