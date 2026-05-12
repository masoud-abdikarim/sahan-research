/**
 * Shared validation logic for the application.
 */

// Strict alphanumeric validation (no spaces, no special characters)
export const PASSWORD_REGEX = /^[a-zA-Z0-9]{6,}$/;

/**
 * Validates a password based on strict requirements:
 * 1. Minimum 6 characters
 * 2. Letters and numbers only (no special characters or spaces)
 * 3. Case insensitive (mixed case allowed)
 */
export const validatePassword = (password: string): string => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters long";
  
  // Check if it contains only letters and numbers
  if (!/^[a-zA-Z0-9]+$/.test(password)) {
    return "Password can only contain letters and numbers (no spaces or special characters)";
  }
  
  return "";
};

/**
 * Returns the human-readable password requirements for UI display.
 */
export const getPasswordRequirements = () => [
  "Minimum 6 characters",
  "Letters and numbers only",
  "No spaces or special characters",
  "Uppercase & lowercase allowed"
];
