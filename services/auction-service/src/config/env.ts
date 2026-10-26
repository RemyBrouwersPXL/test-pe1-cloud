import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET || 'gearbids-secret-session-key-super-safe',
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'gearbids-internal-service-token-dev',
  cookieSecure: process.env.COOKIE_SECURE === 'true' || (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false' && process.env.ENABLE_HTTPS === 'true'),
  cookieMaxAge: parseInt(process.env.COOKIE_MAX_AGE || '86400000', 10), // 24 hours
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'gearbids',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  services: {
    notificationsUrl: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:5001',
    inspectionsUrl: process.env.INSPECTIONS_SERVICE_URL || 'http://localhost:5002',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:80,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173').split(',').map(s => s.trim()),
};

