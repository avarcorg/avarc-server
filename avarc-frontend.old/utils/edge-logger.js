// Get logging configuration
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'; // Can be 'info', 'error', or 'debug'

const getTimestamp = () => {
  return new Date().toISOString();
};

const formatLogMessage = (level, message, meta = {}) => {
  const timestamp = getTimestamp();
  const metaString = Object.keys(meta).length
    ? ` ${JSON.stringify(meta)}`
    : '';
  return `[${timestamp}] ${level}: ${message}${metaString}`;
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
      console.debug(formatLogMessage('DEBUG', message, meta));
    }
  },

  info: (message, meta = {}) => {
    if (shouldLog('info')) {
      console.log(formatLogMessage('INFO', message, meta));
    }
  },

  error: (message, meta = {}) => {
    if (shouldLog('error')) {
      console.error(formatLogMessage('ERROR', message, meta));
    }
  },

  access: (req, res, responseTime) => {
    if (shouldLog('info')) {
      const meta = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        responseTime: `${responseTime}ms`,
        ip: req.headers['x-forwarded-for'] || req.ip,
        userAgent: req.headers['user-agent']
      };

      console.log(formatLogMessage('ACCESS', `${req.method} ${req.url}`, meta));
    }
  }
};

export default logger;
