/**
 * Simple logger utility for consistent logging across the application
 * This is a simplified version of the debug utility to avoid circular dependencies
 */

// Log levels
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  ALL = 5
}

// Configuration
interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix: string;
  includeTimestamp: boolean;
}

// Default configuration - enabled in development, disabled in production
const defaultConfig: LoggerConfig = {
  enabled: process.env.NODE_ENV !== 'production', // Enabled in development
  level: process.env.NODE_ENV === 'production' ? LogLevel.NONE : LogLevel.DEBUG, // Debug logs in development
  prefix: 'Vibtrix',
  includeTimestamp: true
};

// Current configuration
let config: LoggerConfig = { ...defaultConfig };

// Format timestamp
const getTimestamp = (): string => {
  if (!config.includeTimestamp) return '';

  const now = new Date();
  return `[${now.toISOString()}] `;
};

// Format prefix
const getPrefix = (type: string): string => {
  return `${getTimestamp()}[${config.prefix}:${type}]`;
};

// The logger utility
export const logger = {
  // Configuration methods
  configure: (newConfig: Partial<LoggerConfig>) => {
    config = { ...config, ...newConfig };
  },

  resetConfig: () => {
    config = { ...defaultConfig };
  },

  getConfig: (): LoggerConfig => {
    return { ...config };
  },

  // Logging methods
  log: (...args: any[]) => {
    if (config.enabled && config.level >= LogLevel.DEBUG) {
      // Only log in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(getPrefix('DEBUG'), ...args);
      }
    }
  },

  info: (...args: any[]) => {
    if (config.enabled && config.level >= LogLevel.INFO) {
      // Only log in development
      if (process.env.NODE_ENV !== 'production') {
        console.info(getPrefix('INFO'), ...args);
      }
    }
  },

  warn: (...args: any[]) => {
    if (config.enabled && config.level >= LogLevel.WARN) {
      // Only log in development
      if (process.env.NODE_ENV !== 'production') {
        console.warn(getPrefix('WARN'), ...args);
      }
    }
  },

  error: (...args: any[]) => {
    // Only log errors if enabled and level is appropriate
    if (config.enabled && config.level >= LogLevel.ERROR) {
      // In production, we don't log anything
      if (process.env.NODE_ENV !== 'production') {
        console.error(getPrefix('ERROR'), ...args);
      }
    }
  },

  // Performance measurement methods
  time: (label: string) => {
    if (config.enabled && config.level >= LogLevel.DEBUG) {
      // Only log in development
      if (process.env.NODE_ENV !== 'production') {
        console.time(`${getPrefix('TIME')} ${label}`);
      }
    }
  },

  timeEnd: (label: string) => {
    if (config.enabled && config.level >= LogLevel.DEBUG) {
      // Only log in development
      if (process.env.NODE_ENV !== 'production') {
        console.timeEnd(`${getPrefix('TIME')} ${label}`);
      }
    }
  }
};

// Export for convenience
export default logger;
