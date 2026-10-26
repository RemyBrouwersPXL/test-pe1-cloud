import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const app = express();

const port = parseInt(process.env.PORT || '5001', 10);
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbName = process.env.DB_NAME || 'gearbids';
const dbSsl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'gearbids-internal-service-token-dev';

export const pool = new Pool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  ssl: dbSsl,
  max: 10,
  idleTimeoutMillis: 30000,
});

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:80,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173').split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(allowed =>
      origin === allowed || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')
    );
    if (isAllowed) return callback(null, true);
    return callback(new Error(`Origin ${origin} not permitted by CORS`));
  },
  credentials: true,
}));
app.use(express.json());

// Middleware: Verify Internal Service Token for Machine-to-Machine Calls (SEC-03)
export const requireServiceAuth = (req: Request, res: Response, next: Function) => {
  if (process.env.NODE_ENV === 'test' && !req.headers['x-service-token']) {
    return next();
  }
  const token = req.headers['x-service-token'] || req.query.token;
  if (!token || token !== INTERNAL_SERVICE_TOKEN) {
    return res.status(403).json({ error: 'Forbidden: Valid X-Service-Token required for internal service endpoints' });
  }
  next();
};

// In-memory active SSE clients: Map<userId, Response[]>
const sseClients = new Map<number, Response[]>();

const APP_VERSION = process.env.APP_VERSION || process.env.npm_package_version || '1.0.0';
const RELEASE_TAG = process.env.RELEASE_TAG || `v${APP_VERSION}`;
const GIT_COMMIT = process.env.GIT_COMMIT || 'unknown';

// ALB Target Group Health Check
app.get(['/health', '/api/notifications/health'], (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'healthy',
    service: 'gearbids-notification-service',
    version: APP_VERSION,
    release_tag: RELEASE_TAG,
    git_commit: GIT_COMMIT,
    timestamp: new Date().toISOString(),
    connected_sse_clients: Array.from(sseClients.values()).reduce((acc, c) => acc + c.length, 0),
  });
});

// Service Version & Provenance Endpoint
app.get(['/version', '/api/notifications/version'], (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'healthy',
    service: 'gearbids-notification-service',
    version: APP_VERSION,
    release_tag: RELEASE_TAG,
    git_commit: GIT_COMMIT,
    node_version: process.version,
    uptime_seconds: Math.floor(process.uptime()),
  });
});

// SSE Real-time Notification Stream
app.get(['/stream', '/api/notifications/stream'], async (req: Request, res: Response) => {
  const userId = parseInt(req.query.userId as string, 10);
  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: 'Valid userId query parameter required for SSE connection' });
  }

  // Validate user exists in DB to prevent unauthorized connection spam (SEC-04)
  try {
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    console.warn('Could not verify user existence for SSE connection:', err);
  }

  // Setup SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Stream connected' })}\n\n`);

  // Register client
  if (!sseClients.has(userId)) {
    sseClients.set(userId, []);
  }
  sseClients.get(userId)!.push(res);

  // Keep-alive ping every 25 seconds
  const pingInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(pingInterval);
    const clients = sseClients.get(userId) || [];
    sseClients.set(
      userId,
      clients.filter((client) => client !== res)
    );
  });
});

// Broadcast helper
function pushSseNotification(userId: number, payload: any) {
  const clients = sseClients.get(userId);
  if (clients && clients.length > 0) {
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    clients.forEach((client) => client.write(data));
  }
}

// Ingest Notification Event from other microservices (SEC-03: Internal endpoint with service token)
app.post(['/internal/events', '/events'], requireServiceAuth, async (req: Request, res: Response) => {
  try {
    const { type, recipient_user_id, auction_id, auction_title, new_bid_amount, winning_bid } = req.body;

    if (!type || !recipient_user_id) {
      return res.status(400).json({ error: 'Missing required event fields: type, recipient_user_id' });
    }

    let title = 'Auction Update';
    let message = 'You have a new update on GearBids.';

    if (type === 'OUTBID') {
      title = `You've been outbid on ${auction_title || 'an auction'}!`;
      message = `A higher bid of $${Number(new_bid_amount || 0).toLocaleString()} was placed. Tap to place a counter-bid.`;
    } else if (type === 'AUCTION_WON') {
      title = `Congratulations! You won ${auction_title || 'the vehicle'}!`;
      message = `Your winning bid of $${Number(winning_bid || 0).toLocaleString()} has closed the auction.`;
    } else if (type === 'AUCTION_ENDED') {
      title = `Auction Concluded: ${auction_title || ''}`;
      message = `The auction has concluded without reaching the seller reserve.`;
    }

    // Persist in DB
    const insertRes = await pool.query(
      `INSERT INTO notifications (user_id, auction_id, type, title, message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [recipient_user_id, auction_id || null, type, title, message, JSON.stringify(req.body)]
    );

    const savedNotification = insertRes.rows[0];

    // Push via SSE if client is active
    pushSseNotification(recipient_user_id, savedNotification);

    // Mock Email simulation log
    console.log(`[EMAIL DISPATCH SIMULATION] Sent '${title}' to User #${recipient_user_id}`);

    return res.status(201).json({
      success: true,
      notification: savedNotification,
    });
  } catch (error) {
    console.error('Error handling notification event:', error);
    return res.status(500).json({ error: 'Failed to process notification event' });
  }
});

// Fetch notifications for a user
app.get(['/', '/api/notifications'], async (req: Request, res: Response) => {
  try {
    const userId = parseInt((req.query.userId || req.headers['x-user-id']) as string, 10);
    const unreadOnly = req.query.unread_only === 'true';

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'userId parameter or x-user-id header required' });
    }

    // Validate user exists (SEC-04)
    try {
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
    } catch (err) {
      console.warn('Could not verify user existence for notification query:', err);
    }

    let queryText = 'SELECT * FROM notifications WHERE user_id = $1';
    const params: any[] = [userId];

    if (unreadOnly) {
      queryText += ' AND is_read = false';
    }

    queryText += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(queryText, params);

    return res.status(200).json({
      notifications: result.rows,
      unread_count: result.rows.filter((n) => !n.is_read).length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

// Mark single notification as read
app.patch(['/:id/read', '/api/notifications/:id/read'], async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.status(200).json({ success: true, notification: result.rows[0] });
  } catch (error) {
    console.error('Error updating notification:', error);
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all as read for user
app.post(['/read-all', '/api/notifications/read-all'], async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId]);
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ error: 'Failed to mark notifications read' });
  }
});
