import winston from 'winston';
import path from 'path';
import fs from 'fs';
const appName = path.basename(process.cwd());

// If LOGGER is set to 'true' (case-insensitive) we enable file logging
const _loggerEnv = String(process.env.LOGGER || '').trim().toLowerCase();
const disableFileLogging = _loggerEnv !== 'true';

// Dynamic prefix format for Winston
const prefixFormat = winston.format((info) => {
  const stack = new Error().stack || '';
  const isFramework = stack.includes('qe-framework-core') || stack.includes('framework/') || stack.includes('framework\\');

  if (isFramework) {
    info.message = `[qe-framework-core] ${info.message}`;
  } else {
    info.message = `[${appName}] ${info.message}`;
  }
  return info;
});

// Intercept global console commands and redirect them through our logging pattern
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

/**
 * Creates a wrapper for standard console methods (log, warn, error).
 * It inspects the current execution stack trace to determine if the log call originated
 * from the core framework ('qe-framework-core') or the application running it.
 * It prepends the appropriate prefix before invoking the original console method.
 * 
 * @param {Function} originalFunc - The original console function to execute.
 * @returns {Function} - The wrapped console function.
 */
const wrapConsole = (originalFunc) => {
  return function (...args) {
    const stack = new Error().stack || '';
    // Check if the file path contains qe-framework-core or framework-relative paths
    const isFramework = stack.includes('qe-framework-core') || stack.includes('framework/') || stack.includes('framework\\');
    const prefix = isFramework ? '[qe-framework-core]' : `[${appName}]`;

    if (args[0] && typeof args[0] === 'string') {
      args[0] = `${prefix} ${args[0]}`;
    } else {
      args.unshift(prefix);
    }
    originalFunc.apply(console, args);
  };
};

console.log = wrapConsole(originalLog);
console.error = wrapConsole(originalError);
console.warn = wrapConsole(originalWarn);

// Prepare logs directory only when file logging is enabled
let logDirectory;
if (!disableFileLogging) {
  logDirectory = path.join(process.cwd(), 'test-logs');
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
  }
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  trace: 'gray',
};

// Add colors to winston
winston.addColors(colors);

// Custom format
const format = winston.format.combine(
  prefixFormat(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level}]: ${info.message}`
  )
);

// Format for files (without color codes)
const fileFormat = winston.format.combine(
  prefixFormat(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`
  )
);

// Create the logger instance
const transports = [
  new winston.transports.Console({ format }),
];

if (!disableFileLogging) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDirectory, `error-${process.pid}.log`),
      level: 'error',
      format: fileFormat,
    })
  );
  transports.push(
    new winston.transports.File({
      filename: path.join(logDirectory, `execution-${process.pid}.log`),
      format: fileFormat,
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'trace',
  levels,
  transports,
});

// Prevent Winston file transport errors from crashing the process (common in multi-process Windows environments)
logger.on('error', (err) => {
  console.warn(`[Logger Error] Failed to write to log file: ${err.message}`);
});

export default logger;