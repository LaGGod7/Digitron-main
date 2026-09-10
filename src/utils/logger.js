const isProduction = import.meta.env.PROD;
const isTest = import.meta.env.MODE === 'test';

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

export default logger;
