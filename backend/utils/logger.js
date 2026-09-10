const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const logger = {
  debug: (...args) => {
    if (!isProduction && !isTest) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args) => {
    if (!isTest) {
      console.log('[INFO]', ...args);
    }
  },
  warn: (...args) => {
    if (!isTest) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args) => {
    console.error('[ERROR]', ...args);
  }
};

module.exports = logger;
