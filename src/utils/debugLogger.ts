
export const DEBUG_MODE = false; // Alterar para true para habilitar todos os logs de depuração

// Logs específicos para áreas do sistema podem ser habilitados individualmente
export const DEBUG_AREAS = {
  PRICE_EDIT: false, // Descomente para depurar apenas a edição de preços
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

// Função para logs específicos por área
export const debugAreaLog = (area: keyof typeof DEBUG_AREAS, ...args: any[]) => {
  if (DEBUG_MODE || DEBUG_AREAS[area]) {
    console.log(`[DEBUG:${area}]`, ...args);
  }
};

