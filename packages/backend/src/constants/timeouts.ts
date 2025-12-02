/**
 * Timeout constants used throughout the application
 */

/**
 * Duration in milliseconds for todo lock timeout
 * After this time, a locked todo will be considered expired and can be locked by another user
 */
export const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
