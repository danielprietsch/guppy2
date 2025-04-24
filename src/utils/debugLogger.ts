
export const DEBUG_MODE = true; // Enable global debugging in development

// Specific areas of the system can be enabled individually for debugging
export const DEBUG_AREAS = {
  PRICE_EDIT: true, // Enable debugging just for price editing
  AVAILABILITY: true, // Enable debugging for availability changes
  USER_ACTIONS: true, // Enable debugging for user profile actions
  CLIENT_PROFILE: true // Enable debugging specifically for client profile issues
};

// Control verbosity level for specific areas
export const DEBUG_VERBOSITY = {
  PRICE_EDIT: 1, // 1 = essentials only, 2 = detailed, 3 = all
  AVAILABILITY: 1, // Setting to 1 to ensure we see critical logs
  USER_ACTIONS: 2, // Medium verbosity for user actions
  CLIENT_PROFILE: 3 // High verbosity for client profile to catch all issues
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

// Function for area-specific logs with verbosity control
export const debugAreaLog = (area: keyof typeof DEBUG_AREAS, ...args: any[]) => {
  // Default verbosity level is high (3) to log everything if not configured
  const verbosityLevel = DEBUG_VERBOSITY[area] || 3;
  
  if ((DEBUG_MODE || DEBUG_AREAS[area]) && verbosityLevel >= 2) {
    console.log(`[DEBUG:${area}]`, ...args);
  }
};

// Critical logs that should be logged regardless of verbosity
export const debugAreaCritical = (area: keyof typeof DEBUG_AREAS, ...args: any[]) => {
  if (DEBUG_MODE || DEBUG_AREAS[area]) {
    console.error(`[DEBUG:${area}:CRITICAL]`, ...args);
  }
};

// Helper for timing operations
export const debugTimer = (label: string) => {
  if (DEBUG_MODE) {
    console.time(`[DEBUG:TIMER] ${label}`);
    return () => console.timeEnd(`[DEBUG:TIMER] ${label}`);
  }
  return () => {}; // No-op if debug mode is off
};

// Group related logs together
export const debugGroup = (label: string, fn: () => void) => {
  if (DEBUG_MODE) {
    console.group(`[DEBUG:GROUP] ${label}`);
    fn();
    console.groupEnd();
  }
};
