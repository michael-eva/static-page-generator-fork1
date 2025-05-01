/**
 * Utilities for persisting form data across authentication flows and browser tabs
 */
import { setCookie, getCookie, deleteCookie } from './cookies';

// Key for localStorage backup
const FORM_DATA_KEY = 'websiteBuilder';
const BACKUP_KEY = 'websiteBuilderBackup';
const EMAIL_ASSOC_KEY = 'formDataEmail';

/**
 * Save form data in multiple storage mechanisms for maximum persistence
 * @param formData The JSON string of form data to save
 * @param email Optional email to associate with the data
 */
export function persistFormData(formData: string, email?: string) {
  try {
    // 1. Save to cookies (survives page reloads in same tab)
    setCookie(BACKUP_KEY, formData, 7); // 7 days expiry
    
    // 2. Save to localStorage (survives browser restarts but only in same tab)
    localStorage.setItem(FORM_DATA_KEY, formData);
    
    // 3. Save to sessionStorage (survives page reloads but not tab closures)
    sessionStorage.setItem(BACKUP_KEY, formData);
    
    // 4. If email is provided, create an association for later recovery
    if (email) {
      // Save an association between this email and form data
      localStorage.setItem(EMAIL_ASSOC_KEY, email);
      // Consider also storing in IndexedDB for even more persistence
    }
  } catch (error) {
    console.error('Error saving form data:', error);
  }
}

/**
 * Attempt to recover form data using multiple fallback mechanisms
 * @returns The form data JSON string or null if not found
 */
export function recoverFormData(): string | null {
  try {
    // Try to recover from primary storage first
    let data = localStorage.getItem(FORM_DATA_KEY);
    if (data) return data;
    
    // Then try cookie backup
    data = getCookie(BACKUP_KEY);
    if (data) return data;
    
    // Then try sessionStorage
    data = sessionStorage.getItem(BACKUP_KEY);
    if (data) return data;
    
    return null;
  } catch (error) {
    console.error('Error recovering form data:', error);
    return null;
  }
}

/**
 * Clean up all saved form data
 */
export function clearFormData() {
  try {
    localStorage.removeItem(FORM_DATA_KEY);
    localStorage.removeItem(EMAIL_ASSOC_KEY);
    sessionStorage.removeItem(BACKUP_KEY);
    deleteCookie(BACKUP_KEY);
  } catch (error) {
    console.error('Error clearing form data:', error);
  }
}

/**
 * Check if there is form data associated with an email
 */
export function hasFormDataForEmail(email: string): boolean {
  const savedEmail = localStorage.getItem(EMAIL_ASSOC_KEY);
  return savedEmail === email && (getCookie(BACKUP_KEY) !== null || sessionStorage.getItem(BACKUP_KEY) !== null);
}
