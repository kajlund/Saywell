import vine from '@vinejs/vine';

/**
 * VineJS schema for overall application configuration
 */
const configSchema = vine.object({
  env: vine.enum(['development', 'production', 'test']),
  port: vine.number().min(1).max(65535),
  mongoUri: vine.string(),
  logLevel: vine.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),
  jwtSecret: vine.string().minLength(32),
  authApiUrl: vine.string().trim().optional(),
});

const validator = vine.compile(configSchema);

/**
 * Validates environment variables and returns a clean configuration object.
 *
 * @param {Record<string, string>} [env=process.env] - Environment variables object
 * @returns {Promise<{ env: string, port: number, mongoUri: string, logLevel: string, isDev: boolean }>}
 */
export async function getConfig(env = process.env) {
  const isProduction = env.NODE_ENV === 'production';

  // Prepare raw config input
  let rawConfig;

  if (isProduction) {
    // In production, do NOT provide fallback defaults for critical variables.
    rawConfig = {
      env: env.NODE_ENV,
      port: env.PORT,
      mongoUri: env.MONGO_URI,
      logLevel: env.LOG_LEVEL || 'info', // Defaults to 'info' in production
      jwtSecret: env.JWT_SECRET,
      authApiUrl: env.AUTH_API_URL,
    };
  } else {
    // Development / Test mode defaults
    rawConfig = {
      env: env.NODE_ENV || 'development',
      port: env.PORT || 3000,
      mongoUri: env.MONGO_URI || 'mongodb://127.0.0.1:27017/proverbs',
      logLevel: env.LOG_LEVEL || 'trace', // Defaults to 'trace' in development
      jwtSecret: env.JWT_SECRET,
      authApiUrl: env.AUTH_API_URL || 'https://dummyjson.com/auth/login',
    };
  }

  try {
    const validatedConfig = await validator.validate(rawConfig);

    // Extra safeguard: in production, disallow local dev MongoDB URIs
    if (isProduction && (validatedConfig.mongoUri.includes('127.0.0.1') || validatedConfig.mongoUri.includes('localhost'))) {
      throw new Error('[Config Error] Production deployment cannot use localhost / 127.0.0.1 MONGO_URI.');
    }

    return {
      env: validatedConfig.env,
      port: validatedConfig.port,
      mongoUri: validatedConfig.mongoUri,
      logLevel: validatedConfig.logLevel,
      jwtSecret: validatedConfig.jwtSecret,
      authApiUrl: validatedConfig.authApiUrl,
      isDev: validatedConfig.env === 'development',
    };
  } catch (error) {
    if (error.messages) {
      const formattedErrors = JSON.stringify(error.messages);
      throw new Error(`[Config Validation Failed]: ${formattedErrors}`);
    }
    throw error;
  }
}
