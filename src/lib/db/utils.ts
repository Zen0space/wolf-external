// Timezone configuration - using ISO 8601 with Malaysia timezone (+08:00)

// For debugging time calculations
export function getLocalAndMalaysiaTime(): { local: string, malaysia: string } {
  const now = new Date();
  const malaysiaTime = new Date(now.getTime());
  return {
    local: now.toISOString(),
    malaysia: malaysiaTime.toISOString().replace('Z', '+08:00')
  };
}

// Get current time in Malaysia timezone as ISO 8601 string
export function getMalaysiaTimeISO(): string {
  const now = new Date();
  return now.toISOString().replace('Z', '+08:00');
}

// Convert any date to Malaysia timezone ISO string
export function toMalaysiaTimeISO(date: Date): string {
  return date.toISOString().replace('Z', '+08:00');
}

// Format a date for display in Malaysia time
export function formatMalaysiaTime(timestamp: Date | string): { formattedTime: string, isoTimestamp: string } {
  // Convert the timestamp to a Date object
  let date: Date;
  
  try {
    if (typeof timestamp === 'string') {
      // Remove timezone offset if present and create date
      const cleanTimestamp = timestamp.replace(/([+-]\d{2}:?\d{2}|Z)$/, '');
      date = new Date(cleanTimestamp);
    } else {
      date = new Date(timestamp);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      // If date is invalid, use current date as fallback
      console.warn('Invalid date detected, using current date as fallback');
      date = new Date();
    }
    
    // Create ISO timestamp with Malaysia offset
    const isoTimestamp = date.toISOString().replace('Z', '+08:00');
    
    // Get current date for comparison
    const now = new Date();
    
    // For day comparison
    const isToday = 
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    
    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    const isYesterday = 
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate();
    
    // Format the time part (HH:MM)
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Determine if AM or PM
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert 24-hour format to 12-hour format
    const hours12 = hours % 12 || 12;
    
    // Format with leading zeros
    const formattedMinutes = minutes.toString().padStart(2, '0');
    
    // Format day/month/year for display if needed
    const displayDay = date.getDate().toString().padStart(2, '0');
    const displayMonth = date.toLocaleString('en-US', { month: 'short' });
    const displayYear = date.getFullYear();
    
    let formattedTime;
    if (isToday) {
      formattedTime = `Today, ${hours12}:${formattedMinutes} ${period} (MYT)`;
    } else if (isYesterday) {
      formattedTime = `Yesterday, ${hours12}:${formattedMinutes} ${period} (MYT)`;
    } else {
      formattedTime = `${displayDay} ${displayMonth} ${displayYear}, ${hours12}:${formattedMinutes} ${period} (MYT)`;
    }
    
    return {
      formattedTime,
      isoTimestamp
    };
  } catch (error) {
    console.error('Error formatting date:', error);
    // Return fallback values
    return {
      formattedTime: 'Date unavailable',
      isoTimestamp: new Date().toISOString().replace('Z', '+08:00')
    };
  }
}

// Helper function to convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  if (buffer instanceof Uint8Array) {
    buffer = buffer.buffer;
  }
  
  // Process the buffer in chunks to avoid memory issues with large files
  const binary = new Uint8Array(buffer);
  const chunkSize = 1024 * 1024; // 1MB chunks
  let result = '';
  
  // Process the binary data in chunks
  for (let i = 0; i < binary.length; i += chunkSize) {
    const chunk = binary.slice(i, Math.min(i + chunkSize, binary.length));
    let binaryString = '';
    
    // Convert each byte to a character
    for (let j = 0; j < chunk.length; j++) {
      binaryString += String.fromCharCode(chunk[j]);
    }
    
    // Encode the chunk and append to result
    result += btoa(binaryString);
  }
  
  return result;
}

// Helper function to convert Base64 to ArrayBuffer with maximum robustness for large files
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  try {
    // For extremely large base64 strings, we need a completely different approach
    // that minimizes memory usage and handles browser limitations
    
    // First, measure the string to get an idea of how large this file is
    const base64Length = base64.length;
    console.log(`Processing base64 string of length: ${base64Length}`);
    
    // For very large strings (>50MB of base64 data), use an alternative approach
    if (base64Length > 50 * 1024 * 1024) {
      return processLargeBase64String(base64);
    }
    
    // For medium-sized strings, use a more efficient approach than the standard one
    if (base64Length > 10 * 1024 * 1024) {
      return processMediumBase64String(base64);
    }
    
    // For smaller strings, use the standard approach which is more straightforward
    return processStandardBase64String(base64);
  } catch (error) {
    console.error('Error converting base64 to ArrayBuffer:', error);
    throw new Error(`Failed to process file content: ${error instanceof Error ? error.message : 'Unknown error'}. The file may be too large to download directly.`);
  }
}

// Process extremely large base64 strings (>50MB)
function processLargeBase64String(base64: string): ArrayBuffer {
  console.log('Using extreme large file processing method');
  
  try {
    // For extremely large files, we use the smallest possible chunk size
    // and avoid creating any intermediate large strings or arrays
    const chunkSize = 1024; // 1KB chunks of base64 (very small to minimize memory pressure)
    
    // Calculate output size (approximate)
    const paddingLength = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    const outputLength = Math.floor((base64.length * 3) / 4) - paddingLength;
    
    // Allocate a buffer for the result, with some extra space just in case
    const result = new Uint8Array(outputLength + 8);
    let resultIndex = 0;
    
    // Process in very small chunks
    for (let i = 0; i < base64.length; i += chunkSize) {
      // Extract a small chunk that's guaranteed to be a multiple of 4 characters
      const end = Math.min(i + chunkSize, base64.length);
      const adjustedEnd = end - (end - i) % 4; // Ensure we only process complete quartets
      
      if (adjustedEnd <= i) continue; // Skip if we don't have a complete quartet
      
      // Process this small chunk
      const chunk = base64.substring(i, adjustedEnd);
      const binaryString = atob(chunk);
      
      // Copy bytes directly to the result buffer
      for (let j = 0; j < binaryString.length; j++) {
        result[resultIndex++] = binaryString.charCodeAt(j);
      }
    }
    
    // Handle any remaining characters at the end (if not a multiple of 4)
    const remainder = base64.length % 4;
    if (remainder > 0) {
      // Get the last complete quartet
      const lastQuartet = base64.substring(base64.length - remainder - 4, base64.length);
      const binaryString = atob(lastQuartet);
      
      // Copy only the relevant bytes (excluding padding)
      for (let j = 0; j < binaryString.length; j++) {
        result[resultIndex++] = binaryString.charCodeAt(j);
      }
    }
    
    // Return only the filled portion of the buffer
    return result.slice(0, resultIndex).buffer;
  } catch (error) {
    console.error('Error in processLargeBase64String:', error);
    throw error;
  }
}

// Process medium-sized base64 strings (10-50MB)
function processMediumBase64String(base64: string): ArrayBuffer {
  console.log('Using medium file processing method');
  
  try {
    // Use a moderate chunk size for medium files
    const chunkSize = 4096; // 4KB chunks
    
    // Calculate expected output size
    const paddingLength = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    const outputLength = Math.floor((base64.length * 3) / 4) - paddingLength;
    
    // Allocate a buffer for the result
    const result = new Uint8Array(outputLength);
    let resultIndex = 0;
    
    // Process in chunks that are multiples of 4 characters (base64 quartets)
    for (let i = 0; i < base64.length; i += chunkSize) {
      const end = Math.min(i + chunkSize, base64.length);
      const adjustedEnd = end - (end - i) % 4; // Ensure we only process complete quartets
      
      if (adjustedEnd <= i) continue; // Skip if we don't have a complete quartet
      
      // Process this chunk
      const chunk = base64.substring(i, adjustedEnd);
      const binaryString = atob(chunk);
      
      // Copy bytes to the result buffer
      for (let j = 0; j < binaryString.length; j++) {
        result[resultIndex++] = binaryString.charCodeAt(j);
      }
    }
    
    // Handle any remaining characters at the end (if not a multiple of 4)
    const remainder = base64.length % 4;
    if (remainder > 0) {
      // Pad to make a complete quartet if needed
      const lastPart = base64.substring(base64.length - remainder);
      const paddedLastPart = lastPart + '='.repeat(4 - remainder);
      const binaryString = atob(paddedLastPart);
      
      // Copy only the relevant bytes (excluding padding)
      for (let j = 0; j < 3 - paddingLength; j++) {
        result[resultIndex++] = binaryString.charCodeAt(j);
      }
    }
    
    // Return only the filled portion of the buffer
    return result.slice(0, resultIndex).buffer;
  } catch (error) {
    console.error('Error in processMediumBase64String:', error);
    throw error;
  }
}

// Process standard-sized base64 strings (<10MB)
function processStandardBase64String(base64: string): ArrayBuffer {
  console.log('Using standard file processing method');
  
  try {
    // For smaller strings, we can use a more direct approach
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  } catch (error) {
    console.error('Error in processStandardBase64String:', error);
    throw error;
  }
}
