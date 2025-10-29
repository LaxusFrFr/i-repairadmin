import { Timestamp } from 'firebase/firestore';

/**
 * Convert Firestore timestamp to ISO string
 * Handles multiple timestamp formats
 */
export const convertFirestoreTimestamp = (timestamp: any): string => {
  if (!timestamp) return '';
  
  try {
    // Firestore Timestamp object
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toISOString();
    }
    
    // Timestamp with seconds property
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toISOString();
    }
    
    // Timestamp with toDate method
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    
    // Already a string
    if (typeof timestamp === 'string') {
      return timestamp;
    }
    
    // Date object
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
  } catch (error) {
    console.error('Error converting timestamp:', error);
  }
  
  return '';
};

/**
 * Convert ISO string to Firestore Timestamp
 */
export const convertToFirestoreTimestamp = (isoString: string): Timestamp => {
  return Timestamp.fromDate(new Date(isoString));
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp: any): string => {
  const isoString = convertFirestoreTimestamp(timestamp);
  if (!isoString) return 'N/A';
  
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Format timestamp for display (date only)
 */
export const formatDateOnly = (timestamp: any): string => {
  const isoString = convertFirestoreTimestamp(timestamp);
  if (!isoString) return 'N/A';
  
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Format timestamp for display (time only)
 */
export const formatTimeOnly = (timestamp: any): string => {
  const isoString = convertFirestoreTimestamp(timestamp);
  if (!isoString) return 'N/A';
  
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid time';
  }
};

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 */
export const getRelativeTime = (timestamp: any): string => {
  const isoString = convertFirestoreTimestamp(timestamp);
  if (!isoString) return 'N/A';
  
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    }
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Check if timestamp is today
 */
export const isToday = (timestamp: any): boolean => {
  const isoString = convertFirestoreTimestamp(timestamp);
  if (!isoString) return false;
  
  try {
    const date = new Date(isoString);
    const today = new Date();
    
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  } catch (error) {
    return false;
  }
};

/**
 * Check if timestamp is yesterday
 */
export const isYesterday = (timestamp: any): boolean => {
  const isoString = convertFirestoreTimestamp(timestamp);
  if (!isoString) return false;
  
  try {
    const date = new Date(isoString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return date.getDate() === yesterday.getDate() &&
           date.getMonth() === yesterday.getMonth() &&
           date.getFullYear() === yesterday.getFullYear();
  } catch (error) {
    return false;
  }
};
