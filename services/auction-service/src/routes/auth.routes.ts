import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { query } from '../config/db';

const router = Router();

// Rate limiting for authentication endpoints (SEC-08)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

// Register new user
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { username, email, password, full_name, location } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: 'Missing required fields: username, email, password, full_name' });
    }

    // Input validation: Password complexity & email format (SEC-12)
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters in length' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Valid email address required' });
    }

    // Check if user exists
    const existing = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username.toLowerCase().trim(), email.toLowerCase().trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const defaultAvatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`;

    const result = await query(
      `INSERT INTO users (username, email, password_hash, full_name, avatar_url, location, is_seller, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, FALSE)
       RETURNING id, username, email, full_name, avatar_url, location, is_seller, is_admin, created_at`,
      [username.toLowerCase().trim(), email.toLowerCase().trim(), password_hash, full_name.trim(), defaultAvatar, location || 'Unknown']
    );

    const newUser = result.rows[0];

    // Establish session cookie with session regeneration (SEC-06)
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error on registration:', err);
      }
      req.session.userId = newUser.id;
      req.session.username = newUser.username;
      req.session.isAdmin = newUser.is_admin;

      return res.status(201).json({
        message: 'Registration successful',
        user: newUser,
      });
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Username/email and password required' });
    }

    const identifier = usernameOrEmail.toLowerCase().trim();
    const result = await query(
      'SELECT * FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $1',
      [identifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    const user = result.rows[0];

    // Strict password verification (SEC-01: Removed fallback backdoor)
    let isMatch = false;
    if (user.password_hash) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    // Regenerate session to prevent session fixation attacks (SEC-06)
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error on login:', err);
        return res.status(500).json({ error: 'Could not establish secure session' });
      }

      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.isAdmin = user.is_admin;

      const safeUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        location: user.location,
        is_seller: user.is_seller,
        is_admin: user.is_admin,
        created_at: user.created_at,
      };

      return res.status(200).json({
        message: 'Login successful',
        user: safeUser,
      });
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('gearbids.sid');
    return res.status(200).json({ message: 'Logged out successfully' });
  });
});

// Current User Profile / Session Check
router.get('/me', async (req: Request, res: Response) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ authenticated: false, user: null });
  }

  try {
    const result = await query(
      'SELECT id, username, email, full_name, avatar_url, bio, location, is_seller, is_admin, created_at FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ authenticated: false, user: null });
    }

    return res.status(200).json({
      authenticated: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
