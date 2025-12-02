/**
 * Validation constraints for Todo entities
 * These constants should be used consistently across frontend and backend
 */
export const TODO_CONSTRAINTS = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 1000,
} as const;

/**
 * Validation constraints for User entities
 * These constants should be used consistently across frontend and backend
 */
export const USER_CONSTRAINTS = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 6,
  EMAIL_MAX_LENGTH: 255,
} as const;
