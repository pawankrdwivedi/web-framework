import winston from 'winston';
import path from 'path';
import fs from 'fs';
const appName = path.basename(process.cwd());

const _loggerEnv = String(process.env.LOGGER || '').trim().toLowerCase();
const disableFileLogging = _loggerEnv !== 'true';

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

const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

const wrapConsole = (originalFunc) => {
  return function (...args) {
    const stack = new Error().stack || '';
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

let logDirectory;
if (!disableFileLogging) {
  logDirectory = path.join(process.cwd(), 'test-logs');
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
  }
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  trace: 'gray',
};

winston.addColors(colors);

const format = winston.format.combine(
  prefixFormat(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level}]: ${info.message}`
  )
);

const fileFormat = winston.format.combine(
  prefixFormat(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`
  )
);

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

logger.on('error', (err) => {
  console.warn(`[Logger Error] Failed to write to log file: ${err.message}`);
});

export default logger;
