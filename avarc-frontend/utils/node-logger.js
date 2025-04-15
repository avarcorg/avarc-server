const fs = require('fs');
const path = require('path');

// Get logging configuration
const LOGS_DIR = process.env.LOGS_DIR || path.join(process.cwd(), 'logs');
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'; // Can be 'info', 'error', or 'debug'

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const accessLogStream = fs.createWriteStream(
  path.join(LOGS_DIR, 'access.log'),
  { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
  path.join(LOGS_DIR, 'error.log'),
  { flags: 'a' }
);

const getTimestamp = () => {
  return new Date().toISOString();
};

const formatLogMessage = (level, message, meta = {}) => {
  const timestamp = getTimestamp();
  const metaString = Object.keys(meta).length
    ? ` ${JSON.stringify(meta)}`
    : '';
  return `[${timestamp}] ${level}: ${message}${metaString}\n`;
};

const shouldLog = (level) => {
  const levels = {
    debug: 0,
    info: 1,
    error: 2
  };
  return levels[level] >= levels[LOG_LEVEL];
};

const logger = {
  debug: (message, meta = {}) => {
    if (shouldLog('debug')) {
      const logMessage = formatLogMessage('DEBUG', message, meta);
      console.debug(logMessage.trim());
      accessLogStream.write(logMessage);
    }
  },

  info: (message, meta = {}) => {
    if (shouldLog('info')) {
      const logMessage = formatLogMessage('INFO', message, meta);
      console.log(logMessage.trim());
      accessLogStream.write(logMessage);
    }
  },

  error: (message, meta = {}) => {
    if (shouldLog('error')) {
      const logMessage = formatLogMessage('ERROR', message, meta);
      console.error(logMessage.trim());
      errorLogStream.write(logMessage);
    }
  },

  access: (req, res, responseTime) => {
    if (shouldLog('info')) {
      const meta = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        responseTime: `${responseTime}ms`,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      const logMessage = formatLogMessage('ACCESS', `${req.method} ${req.url}`, meta);
      console.log(logMessage.trim());
      accessLogStream.write(logMessage);
    }
  }
};

// Log logger configuration on initialization
logger.info('Logger initialized with configuration:', {
  logsDir: LOGS_DIR,
  logLevel: LOG_LEVEL
});

module.exports = logger;
