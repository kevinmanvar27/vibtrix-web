/**
 * Debug configuration file
 * This file configures the debug utility to control log output
 */

import logger, { LogLevel } from './logger';

// Configure the debug utility to reduce console output
export function configureDebugUtility() {
  // In production, disable all logs
  if (process.env.NODE_ENV === 'production') {
    logger.configure({
      level: LogLevel.NONE,
      enabled: false
    });
  } else {
    // In development, disable all logs by default for clean terminal
    // Only enable when explicitly needed for debugging
    logger.configure({
      level: LogLevel.NONE,
      enabled: false
    });
  }
}

export default configureDebugUtility;
