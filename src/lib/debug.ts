/**
 * Production-ready debug utility for consistent logging across the application
 * All logging is disabled in production for performance and security
 */

import logger, { LogLevel } from './logger';

export { LogLevel };

const isProduction = process.env.NODE_ENV === 'production';

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

  // Grouping methods - disabled in production
  group: (label: string) => {
    if (!isProduction && logger.getConfig().enabled && logger.getConfig().level >= LogLevel.DEBUG) {
      if (typeof console.group === 'function') {
        console.group(`[${logger.getConfig().prefix}:GROUP] ${label}`);
      } else {
        console.log(`[${logger.getConfig().prefix}:GROUP START] ${label}`);
      }
    }
  },

  groupCollapsed: (label: string) => {
    if (!isProduction && logger.getConfig().enabled && logger.getConfig().level >= LogLevel.DEBUG) {
      if (typeof console.groupCollapsed === 'function') {
        console.groupCollapsed(`[${logger.getConfig().prefix}:GROUP] ${label}`);
      } else {
        console.log(`[${logger.getConfig().prefix}:GROUP START (collapsed)] ${label}`);
      }
    }
  },

  groupEnd: () => {
    if (!isProduction && logger.getConfig().enabled && logger.getConfig().level >= LogLevel.DEBUG) {
      if (typeof console.groupEnd === 'function') {
        console.groupEnd();
      } else {
        console.log(`[${logger.getConfig().prefix}:GROUP END]`);
      }
    }
  },

  // Utility methods - disabled in production
  table: (data: any, columns?: string[]) => {
    if (!isProduction && logger.getConfig().enabled && logger.getConfig().level >= LogLevel.DEBUG) {
      console.log(`[${logger.getConfig().prefix}:TABLE]`);
      console.table(data, columns);
    }
  },

  // Conditional logging - disabled in production
  assert: (condition: boolean, ...args: any[]) => {
    if (!isProduction && logger.getConfig().enabled && logger.getConfig().level >= LogLevel.DEBUG) {
      console.assert(condition, `[${logger.getConfig().prefix}:ASSERT]`, ...args);
    }
  }
};

export default debug;
