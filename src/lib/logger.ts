/**
 * Production-ready logger utility for consistent logging across the application
 * All logging is disabled in production for performance and security
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

const isProduction = process.env.NODE_ENV === 'production';

// Default configuration - completely disabled in production
const defaultConfig: LoggerConfig = {
  enabled: !isProduction,
  level: isProduction ? LogLevel.NONE : LogLevel.ERROR, // Only errors in development
  prefix: 'Vibtrix',
  includeTimestamp: !isProduction
};

// Current configuration
let config: LoggerConfig = { ...defaultConfig };

// Format timestamp
const getTimestamp = (): string => {
  if (!config.includeTimestamp || isProduction) return '';
  return `[${new Date().toISOString()}] `;
};

// Format prefix
const getPrefix = (type: string): string => {
  return `${getTimestamp()}[${config.prefix}:${type}]`;
};

// The logger utility
export const logger = {
  // Configuration methods
  configure: (newConfig: Partial<LoggerConfig>) => {
    if (!isProduction) {
      config = { ...config, ...newConfig };
    }
  },

  resetConfig: () => {
    config = { ...defaultConfig };
  },

  getConfig: (): LoggerConfig => ({ ...config }),

  // Logging methods - all disabled in production
  log: (...args: any[]) => {
    if (!isProduction && config.enabled && config.level >= LogLevel.DEBUG) {
      console.log(getPrefix('DEBUG'), ...args);
    }
  },

  info: (...args: any[]) => {
    if (!isProduction && config.enabled && config.level >= LogLevel.INFO) {
      console.info(getPrefix('INFO'), ...args);
    }
  },

  warn: (...args: any[]) => {
    if (!isProduction && config.enabled && config.level >= LogLevel.WARN) {
      console.warn(getPrefix('WARN'), ...args);
    }
  },

  error: (...args: any[]) => {
    if (!isProduction && config.enabled && config.level >= LogLevel.ERROR) {
      console.error(getPrefix('ERROR'), ...args);
    }
  },

  // Performance measurement methods
  time: (label: string) => {
    if (!isProduction && config.enabled && config.level >= LogLevel.DEBUG) {
      console.time(`${getPrefix('TIME')} ${label}`);
    }
  },

  timeEnd: (label: string) => {
    if (!isProduction && config.enabled && config.level >= LogLevel.DEBUG) {
      console.timeEnd(`${getPrefix('TIME')} ${label}`);
    }
  }
};

export default logger;
