/**
 * Parses a standard Google Drive shareable link and converts it to a direct
 * high-performance rendering URL via Google's lh3 user content service.
 * 
 * This format (https://lh3.googleusercontent.com/d/FILE_ID) is extremely robust
 * for web image display, bypasses virus warnings, and supports standard image tag loads.
 * 
 * Supports patterns:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * 
 * @param {string} url - The original Google Drive URL
 * @returns {string} The parsed direct rendering URL, or the original URL if not a Google Drive link
 */
export const parseGoogleDriveLink = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  const trimmedUrl = url.trim();
  
  if (trimmedUrl.includes('drive.google.com')) {
    // Pattern 1: /file/d/FILE_ID/view
    const fileDMatch = trimmedUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch && fileDMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;
    }
    
    // Pattern 2: ?id=FILE_ID or &id=FILE_ID
    const idMatch = trimmedUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
    }
  }
  
  return trimmedUrl;
};
