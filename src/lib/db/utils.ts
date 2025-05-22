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

// Helper function to convert Base64 to ArrayBuffer with ultra-efficient memory handling
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  try {
    // For very large files, we need to be extremely careful with memory
    // First, we'll calculate the expected size of the decoded data
    // Base64 encodes 3 bytes into 4 characters, with padding at the end
    const paddingLength = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    const expectedLength = Math.floor((base64.length * 3) / 4) - paddingLength;
    
    // Create a single result buffer of the exact size we need
    const result = new Uint8Array(expectedLength);
    
    // Process in very small chunks to minimize memory usage
    // Using 8KB chunks for base64 string (which decodes to ~6KB of binary data)
    const chunkSize = 8 * 1024; // 8KB of base64 text at a time
    let resultIndex = 0;
    
    // Handle each chunk individually without storing intermediate arrays
    for (let i = 0; i < base64.length; i += chunkSize) {
      // Get the current chunk of base64 text
      const end = Math.min(i + chunkSize, base64.length);
      const chunk = base64.substring(i, end);
      
      // Only decode complete base64 quartets (groups of 4 characters)
      // If the chunk doesn't end on a quartet boundary, we'll handle it specially
      const completeQuartets = Math.floor(chunk.length / 4);
      const completeChunkLength = completeQuartets * 4;
      
      // Decode the complete quartets in this chunk
      if (completeChunkLength > 0) {
        const completeChunk = chunk.substring(0, completeChunkLength);
        const binaryString = atob(completeChunk);
        
        // Copy binary data directly to the result buffer
        for (let j = 0; j < binaryString.length; j++) {
          result[resultIndex++] = binaryString.charCodeAt(j);
        }
      }
      
      // Handle any remaining characters (less than 4) by combining with the next chunk
      // This only happens for the last iteration or if chunkSize is not a multiple of 4
      const remaining = chunk.length - completeChunkLength;
      if (remaining > 0 && end < base64.length) {
        // Look ahead to get enough characters to form a complete quartet
        const nextChunkStart = end;
        const nextChunkEnd = Math.min(nextChunkStart + (4 - remaining), base64.length);
        const remainingChars = base64.substring(end - remaining, nextChunkEnd);
        
        // Only process if we have a complete quartet
        if (remainingChars.length === 4) {
          const binaryString = atob(remainingChars);
          for (let j = 0; j < binaryString.length; j++) {
            result[resultIndex++] = binaryString.charCodeAt(j);
          }
          // Skip the characters we just processed in the next iteration
          i += (4 - remaining);
        }
      }
    }
    
    // If we didn't fill the entire buffer (due to padding or calculation errors),
    // return just the portion we filled
    if (resultIndex < expectedLength) {
      return result.slice(0, resultIndex).buffer;
    }
    
    return result.buffer;
  } catch (error) {
    console.error('Error converting base64 to ArrayBuffer:', error);
    throw new Error(`Failed to process large file content: ${error instanceof Error ? error.message : 'Unknown error'}. The file may be too large to download directly.`);
  }
}
