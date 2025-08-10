/**
 * Web Page Insertions Configuration
 * 
 * This file manages the configuration for inserting web pages between PDF pages
 * in the FullscreenPDFViewer component.
 */

export interface WebPageInsertion {
  /**
   * Location specifies where to insert the webpage
   * Format: [afterPage, beforePage]
   * Example: [1, 2] means insert between PDF page 1 and page 2
   */
  location: [number, number];
  
  /**
   * The URL of the webpage to display
   */
  url: string;
  
  /**
   * Title lines to display in the white capsule
   * Can be:
   * - A single string (1 line)
   * - An array of strings (multiple lines)
   * - For backward compatibility: titleLine1 and titleLine2
   */
  title?: string | string[];
  
  /**
   * @deprecated Use 'title' instead. First line of text to display in the white capsule
   */
  titleLine1?: string;
  
  /**
   * @deprecated Use 'title' instead. Second line of text to display in the white capsule
   */
  titleLine2?: string;
  
  /**
   * Optional: Custom identifier for this insertion
   */
  id?: string;
  
  /**
   * Optional: Whether this insertion is enabled (default: true)
   */
  enabled?: boolean;
}

/**
 * Main configuration for all web page insertions
 * 
 * To add a new webpage insertion:
 * 1. Add a new WebPageInsertion object to the array
 * 2. Set the location [afterPage, beforePage]
 * 3. Provide the URL and title lines
 * 
 * Example:
 * {
 *   id: "emancipation-playlist",
 *   location: [1, 2],
 *   url: "https://www.youtube.com/playlist?list=PLUVpFBRxKq4N5LUQ0nJY1u8PZ22M2EzE4",
 *   titleLine1: "Journeying to Emancipation",
 *   titleLine2: "Friday, August 1, 2025",
 *   enabled: true
 * }
 */
export const webPageInsertions: WebPageInsertion[] = [
  {
    id: "emancipation-playlist",
    location: [1, 2],
    url: "https://www.youtube.com/embed/videoseries?list=PLUVpFBRxKq4N5LUQ0nJY1u8PZ22M2EzE4&listType=playlist&showinfo=1&rel=0&modestbranding=0&fs=1&cc_load_policy=0&iv_load_policy=1&autohide=0",
    title: [
      "Journeying to Emancipation",
      "Friday, August 1, 2025"
    ],
    enabled: true
  },
  
  // Example with single line title
  {
    id: "why-the-museum",
    location: [5, 6],
    url: "https://www.youtube.com/embed/DvB6SGAwzYQ?showinfo=1&rel=0&modestbranding=0&fs=1&cc_load_policy=0&iv_load_policy=1&autohide=0",
    title: "Why the Museum",
    enabled: true
  }
];

/**
 * Helper function to get only enabled insertions
 */
export const getEnabledInsertions = (): WebPageInsertion[] => {
  return webPageInsertions.filter(insertion => insertion.enabled !== false);
};

/**
 * Helper function to get insertion by ID
 */
export const getInsertionById = (id: string): WebPageInsertion | undefined => {
  return webPageInsertions.find(insertion => insertion.id === id);
};

/**
 * Helper function to get title lines from insertion
 */
export const getTitleLines = (insertion: WebPageInsertion): string[] => {
  // New format: title field
  if (insertion.title) {
    if (Array.isArray(insertion.title)) {
      return insertion.title.filter(line => line.trim().length > 0);
    }
    return [insertion.title];
  }
  
  // Legacy format: titleLine1 and titleLine2
  const lines: string[] = [];
  if (insertion.titleLine1) lines.push(insertion.titleLine1);
  if (insertion.titleLine2) lines.push(insertion.titleLine2);
  return lines;
};

/**
 * Helper function to validate insertion configuration
 */
export const validateInsertion = (insertion: WebPageInsertion): boolean => {
  // Check if location is valid
  if (!Array.isArray(insertion.location) || insertion.location.length !== 2) {
    return false;
  }
  
  const [afterPage, beforePage] = insertion.location;
  if (typeof afterPage !== 'number' || typeof beforePage !== 'number') {
    return false;
  }
  
  if (afterPage >= beforePage || afterPage < 1 || beforePage < 2) {
    return false;
  }
  
  // Check required fields
  if (!insertion.url) {
    return false;
  }
  
  // Check if title exists in any format
  const titleLines = getTitleLines(insertion);
  if (titleLines.length === 0) {
    return false;
  }
  
  return true;
};

/**
 * Helper function to get validated and enabled insertions
 */
export const getValidInsertions = (): WebPageInsertion[] => {
  return getEnabledInsertions().filter(validateInsertion);
};

/**
 * Configuration metadata
 */
export const config = {
  version: "1.0.0",
  lastUpdated: "2025-08-11",
  description: "Web page insertions for BHEM PDF viewer"
};