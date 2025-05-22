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

// Helper function to convert Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Since our arrayBufferToBase64 function now returns a concatenated string of base64 chunks,
  // we need to ensure we're handling a single base64 string for decoding
  // This is a simplified version that assumes the base64 string is valid
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}
