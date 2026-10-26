import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import authRoutes from './routes/auth.routes';
import auctionRoutes from './routes/auction.routes';

export const app = express();

// Trust proxy for AWS Application Load Balancer
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // APIs return JSON; frontend handles CSP
  crossOriginEmbedderPolicy: false,
}));

// Middleware: Strict CORS with credentials
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);

    const isAllowed = config.allowedOrigins.some(allowed =>
      origin === allowed ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    );

    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not permitted by CORS policy`));
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session Configuration (Old-School Session Cookies)
app.use(
  session({
    name: 'gearbids.sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.cookieSecure,
      maxAge: config.cookieMaxAge,
      sameSite: 'lax',
    },
  })
);

// ALB Target Group Health Check
app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'healthy',
    service: 'gearbids-auction-service',
    timestamp: new Date().toISOString(),
    uptime_seconds: process.uptime(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found on auction-service' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'An unexpected error occurred.',
  });
});
