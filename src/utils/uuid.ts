import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a new UUID v4
 * @returns A unique UUID string
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Validates if a string is a valid UUID
 * @param uuid - The string to validate
 * @returns True if the string is a valid UUID, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generates a short UUID (first 8 characters of a UUID)
 * @returns A short UUID string
 */
export function generateShortUUID(): string {
  return uuidv4().split('-')[0];
}