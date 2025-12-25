/**
 * Enhanced debug utility for consistent logging across the application
 * This is a wrapper around the logger utility to maintain backward compatibility
 */

import logger, { LogLevel } from './logger';

// Re-export LogLevel for backward compatibility
export { LogLevel };

// The debug utility (wrapper around logger)
export const debug = {
  // Configuration methods
  configure: logger.configure,
  resetConfig: logger.resetConfig,
  getConfig: logger.getConfig,

  // Logging methods
  log: logger.log,
  info: logger.info,
  warn: logger.warn,
  error: logger.error,

  // Performance measurement methods
  time: logger.time,
  timeEnd: logger.timeEnd,

  // Grouping methods
  group: (label: string) => {
    if (logger.getConfig().enabled && logger.getConfig().level >= LogLevel.DEBUG) {
      if (process.env.NODE_ENV !== 'production') {
        if (typeof console.group === 'function') {
          console.group(`[${logger.getConfig().prefix}:GROUP] ${label}`);
        } else {
          console.log(`[${logger.getConfig().prefix}:GROUP START] ${label}`);
        }
      }
    }
  },

  groupCollapsed: (label: string) => {
    if (logger.getConfig().enabled && logger.getConfig().level >= LogLevel.DEBUG) {
      if (process.env.NODE_ENV !== 'production') {
        if (typeof console.groupCollapsed === 'function') {
          console.groupCollapsed(`[${logger.getConfig().prefix}:GROUP] ${label}`);
        } else {
          console.log(`[${logger.getConfig().prefix}:GROUP START (collapsed)] ${label}`);
        }
      }
    }
  },

  groupEnd: () => {
    if (logger.getConfig().enabled && logger.getConfig().level >= LogLevel.DEBUG) {
      if (process.env.NODE_ENV !== 'production') {
        if (typeof console.groupEnd === 'function') {
          console.groupEnd();
        } else {
          console.log(`[${logger.getConfig().prefix}:GROUP END]`);
        }
      }
    }
  },

  // Utility methods
  table: (data: any, columns?: string[]) => {
    if (logger.getConfig().enabled && logger.getConfig().level >= LogLevel.DEBUG) {
      // Only log in development
      if (process.env.NODE_ENV !== 'production') {
        const prefix = logger.getConfig().prefix;
        console.log(`[${prefix}:TABLE]`);
        console.table(data, columns);
      }
    }
  },

  // Conditional logging
  assert: (condition: boolean, ...args: any[]) => {
    if (logger.getConfig().enabled && logger.getConfig().level >= LogLevel.DEBUG) {
      // Only log in development
      if (process.env.NODE_ENV !== 'production') {
        console.assert(condition, `[${logger.getConfig().prefix}:ASSERT]`, ...args);
      }
    }
  }
};

// Export for convenience
export default debug;
