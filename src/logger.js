import pino from 'pino';

/**
 * Creates and returns a Pino logger instance based on application configuration.
 *
 * @param {Object} config - The application configuration object returned by getConfig()
 * @param {string} [config.logLevel='info'] - The log level threshold
 * @param {boolean} [config.isDev=false] - Whether development mode is enabled
 * @returns {import('pino').Logger} Pino logger instance
 */
export function getLogger(config) {
  const level = config?.logLevel || 'info';
  const isDev = config?.isDev ?? false;

  const options = {
    level,
  };

  if (isDev) {
    options.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    };
  }

  return pino(options);
}
