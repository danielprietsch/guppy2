
export const DEBUG_MODE = false; // Change to true to enable all debug logs

// Specific areas of the system can be enabled individually for debugging
export const DEBUG_AREAS = {
  PRICE_EDIT: true, // Enable debugging just for price editing
  AVAILABILITY: false,
  USER_ACTIONS: false
};

export const debugLog = (...args: any[]) => {
  if (DEBUG_MODE) {
    console.log('[DEBUG]', ...args);
  }
};

export const debugError = (...args: any[]) => {
  if (DEBUG_MODE) {
    console.error('[DEBUG ERROR]', ...args);
  }
};

// Function for area-specific logs
export const debugAreaLog = (area: keyof typeof DEBUG_AREAS, ...args: any[]) => {
  if (DEBUG_MODE || DEBUG_AREAS[area]) {
    console.log(`[DEBUG:${area}]`, ...args);
  }
};
