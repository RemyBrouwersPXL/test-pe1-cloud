import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to perform this action. Active session cookie required.',
    });
  }
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId || !req.session.isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Administrator privileges required.',
    });
  }
  next();
};

export const attachUser = async (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.userId) {
    try {
      const result = await query(
        'SELECT id, username, email, full_name, avatar_url, is_seller, is_admin FROM users WHERE id = $1',
        [req.session.userId]
      );
      if (result.rows.length > 0) {
        (req as any).user = result.rows[0];
      }
    } catch (err) {
      console.error('Error fetching user for session:', err);
    }
  }
  next();
};
